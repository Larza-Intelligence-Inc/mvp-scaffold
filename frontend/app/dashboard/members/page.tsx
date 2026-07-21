"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/application/native-select";
import { appOrigin, authClient } from "@/lib/auth-client";
import { ORG_ROLE_OPTIONS, type OrgRole } from "@/lib/auth-permissions";

type MemberRow = {
    id: string;
    role: string;
    userId: string;
    user?: {
        id?: string;
        name?: string;
        email?: string;
        image?: string | null;
    };
};

type InvitationRow = {
    id: string;
    email: string;
    role?: string | null;
    status: string;
    expiresAt: string | Date;
};

export default function MembersPage() {
    const { data: session } = authClient.useSession();
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [invitations, setInvitations] = useState<InvitationRow[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<string>("member");
    const [roleOptions, setRoleOptions] = useState(ORG_ROLE_OPTIONS.map((r) => ({ ...r, value: r.value as string })));
    const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [canInvite, setCanInvite] = useState(false);
    const [canUpdateMember, setCanUpdateMember] = useState(false);
    const [canRemoveMember, setCanRemoveMember] = useState(false);
    const [canCancelInvite, setCanCancelInvite] = useState(false);

    const activeOrgId = session?.session.activeOrganizationId ?? null;
    const currentUserId = session?.user.id ?? null;

    const refresh = useCallback(async () => {
        if (!activeOrgId) {
            setMembers([]);
            setInvitations([]);
            return;
        }
        const [membersRes, invitesRes, rolesRes] = await Promise.all([
            authClient.organization.listMembers({
                query: { organizationId: activeOrgId },
            }),
            authClient.organization.listInvitations({
                query: { organizationId: activeOrgId },
            }),
            authClient.organization.listRoles({
                query: { organizationId: activeOrgId },
            }),
        ]);
        if (membersRes.error) {
            setError(membersRes.error.message ?? "Could not load members");
        } else {
            const payload = membersRes.data as { members?: MemberRow[] } | MemberRow[] | null;
            const list = Array.isArray(payload) ? payload : (payload?.members ?? []);
            setMembers(list);
        }
        if (invitesRes.error) {
            setError(invitesRes.error.message ?? "Could not load invitations");
        } else {
            setInvitations((invitesRes.data as InvitationRow[]) ?? []);
        }
        const custom = ((rolesRes.data as { role: string }[] | null) ?? []).map((r) => ({
            value: r.role,
            label: r.role.charAt(0).toUpperCase() + r.role.slice(1),
        }));
        const seen = new Set(ORG_ROLE_OPTIONS.map((r) => r.value));
        setRoleOptions([
            ...ORG_ROLE_OPTIONS.map((r) => ({ value: r.value as string, label: r.label })),
            ...custom.filter((c) => !seen.has(c.value as OrgRole)),
        ]);
    }, [activeOrgId]);

    const refreshPermissions = useCallback(async () => {
        if (!activeOrgId) {
            setCanInvite(false);
            setCanUpdateMember(false);
            setCanRemoveMember(false);
            setCanCancelInvite(false);
            return;
        }
        const [invite, update, remove, cancel] = await Promise.all([
            authClient.organization.hasPermission({
                permissions: { invitation: ["create"] },
                organizationId: activeOrgId,
            }),
            authClient.organization.hasPermission({
                permissions: { member: ["update"] },
                organizationId: activeOrgId,
            }),
            authClient.organization.hasPermission({
                permissions: { member: ["delete"] },
                organizationId: activeOrgId,
            }),
            authClient.organization.hasPermission({
                permissions: { invitation: ["cancel"] },
                organizationId: activeOrgId,
            }),
        ]);
        setCanInvite(Boolean(invite.data?.success));
        setCanUpdateMember(Boolean(update.data?.success));
        setCanRemoveMember(Boolean(remove.data?.success));
        setCanCancelInvite(Boolean(cancel.data?.success));
    }, [activeOrgId]);

    useEffect(() => {
        void refresh();
        void refreshPermissions();
    }, [refresh, refreshPermissions]);

    async function inviteMember(e: React.FormEvent) {
        e.preventDefault();
        if (!activeOrgId) {
            setError("Select an active organization first");
            return;
        }
        setBusy(true);
        setError(null);
        setMessage(null);
        setLastInviteLink(null);
        const { data, error: inviteError } = await authClient.organization.inviteMember({
            email: inviteEmail.trim(),
            role: inviteRole,
            organizationId: activeOrgId,
        });
        setBusy(false);
        if (inviteError) {
            setError(inviteError.message ?? "Invite failed");
            return;
        }
        const invitationId = (data as { id?: string } | null)?.id;
        if (invitationId) {
            setLastInviteLink(`${appOrigin()}/accept-invitation/${invitationId}`);
        }
        setInviteEmail("");
        setMessage(
            invitationId
                ? "Invitation email sent. A backup link is available below if the recipient needs it."
                : "Invitation email sent.",
        );
        await refresh();
    }

    async function updateRole(memberId: string, role: string) {
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: updateError } = await authClient.organization.updateMemberRole({
            memberId,
            role,
            organizationId: activeOrgId ?? undefined,
        });
        setBusy(false);
        if (updateError) {
            setError(updateError.message ?? "Could not update role");
            return;
        }
        setMessage("Member role updated");
        await refresh();
    }

    async function removeMember(memberIdOrEmail: string) {
        if (!window.confirm("Remove this member from the organization?")) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: removeError } = await authClient.organization.removeMember({
            memberIdOrEmail,
            organizationId: activeOrgId ?? undefined,
        });
        setBusy(false);
        if (removeError) {
            setError(removeError.message ?? "Could not remove member");
            return;
        }
        setMessage("Member removed");
        await refresh();
    }

    async function cancelInvitation(invitationId: string) {
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: cancelError } = await authClient.organization.cancelInvitation({
            invitationId,
        });
        setBusy(false);
        if (cancelError) {
            setError(cancelError.message ?? "Could not cancel invitation");
            return;
        }
        setMessage("Invitation canceled");
        await refresh();
    }

    async function copyLink(link: string) {
        try {
            await navigator.clipboard.writeText(link);
            setMessage("Invite link copied");
        } catch {
            setError("Could not copy link");
        }
    }

    const pendingInvites = invitations.filter((i) => i.status === "pending");

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
            {message ? <p className="text-sm text-success-primary">{message}</p> : null}
            {error ? <p className="text-sm text-error-primary">{error}</p> : null}

            {!activeOrgId ? (
                <p className="text-sm text-tertiary">
                    Set an active organization on the Organizations page before managing members.
                </p>
            ) : null}

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Members</h2>
                    <p className="text-sm text-tertiary">People in the active organization and their roles.</p>
                </div>
                {members.length === 0 ? (
                    <p className="text-md text-tertiary">No members loaded yet.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {members.map((m) => {
                            const email = m.user?.email ?? m.userId;
                            const name = m.user?.name ?? email;
                            const isSelf = m.userId === currentUserId;
                            return (
                                <li
                                    key={m.id}
                                    className="flex flex-col gap-3 rounded-xl bg-secondary px-4 py-3 ring-1 ring-secondary sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-primary">
                                            {name}
                                            {isSelf ? <span className="text-tertiary"> (you)</span> : null}
                                        </p>
                                        <p className="truncate font-mono text-sm text-tertiary">{email}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {canUpdateMember ? (
                                            <NativeSelect
                                                value={m.role.split(",")[0] ?? "member"}
                                                onChange={(role) => void updateRole(m.id, role)}
                                                options={roleOptions}
                                                isDisabled={busy}
                                                className="w-36"
                                            />
                                        ) : (
                                            <span className="rounded-full bg-primary px-2.5 py-1 text-sm font-medium text-secondary ring-1 ring-secondary">
                                                {m.role}
                                            </span>
                                        )}
                                        {canRemoveMember && !isSelf ? (
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                isDisabled={busy}
                                                onPress={() => void removeMember(m.id)}
                                            >
                                                Remove
                                            </Button>
                                        ) : null}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Invite member</h2>
                    <p className="text-sm text-tertiary">
                        Create an invitation link. Without an email provider, copy and share the link manually.
                    </p>
                </div>
                <form className="flex flex-col gap-4" onSubmit={(e) => void inviteMember(e)}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                        <Input
                            isRequired
                            label="Email"
                            name="inviteEmail"
                            type="email"
                            value={inviteEmail}
                            onChange={setInviteEmail}
                            placeholder="teammate@example.com"
                            className="flex-1"
                            isDisabled={!activeOrgId || !canInvite}
                        />
                        <NativeSelect
                            label="Role"
                            value={inviteRole}
                            onChange={setInviteRole}
                            options={roleOptions}
                            isDisabled={!activeOrgId || !canInvite || busy}
                            className="w-full sm:w-40"
                        />
                        <Button
                            type="submit"
                            color="primary"
                            size="md"
                            isDisabled={busy || !activeOrgId || !canInvite || !inviteEmail.trim()}
                            isLoading={busy}
                        >
                            Invite
                        </Button>
                    </div>
                </form>
                {!canInvite && activeOrgId ? (
                    <p className="text-sm text-tertiary">Your role cannot create invitations.</p>
                ) : null}
                {lastInviteLink ? (
                    <div className="flex flex-col gap-2 rounded-xl bg-secondary p-3 ring-1 ring-secondary">
                        <p className="text-sm font-medium text-primary">Invite link</p>
                        <p className="break-all font-mono text-sm text-tertiary">{lastInviteLink}</p>
                        <Button color="secondary" size="sm" onPress={() => void copyLink(lastInviteLink)}>
                            Copy link
                        </Button>
                    </div>
                ) : null}
            </section>

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Pending invitations</h2>
                </div>
                {pendingInvites.length === 0 ? (
                    <p className="text-md text-tertiary">No pending invitations.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {pendingInvites.map((inv) => {
                            const link = `${appOrigin()}/accept-invitation/${inv.id}`;
                            return (
                                <li
                                    key={inv.id}
                                    className="flex flex-col gap-3 rounded-xl bg-secondary px-4 py-3 ring-1 ring-secondary sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-medium text-primary">{inv.email}</p>
                                        <p className="text-sm text-tertiary">Role: {inv.role ?? "member"}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button color="secondary" size="sm" onPress={() => void copyLink(link)}>
                                            Copy link
                                        </Button>
                                        {canCancelInvite ? (
                                            <Button
                                                color="secondary"
                                                size="sm"
                                                isDisabled={busy}
                                                onPress={() => void cancelInvitation(inv.id)}
                                            >
                                                Cancel
                                            </Button>
                                        ) : null}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}
