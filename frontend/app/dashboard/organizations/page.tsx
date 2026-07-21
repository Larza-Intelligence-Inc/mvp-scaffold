"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { authClient } from "@/lib/auth-client";

type Org = {
    id: string;
    name: string;
    slug: string;
};

export default function OrganizationsPage() {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [orgName, setOrgName] = useState("");
    const [editName, setEditName] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [canUpdate, setCanUpdate] = useState(false);
    const [canDelete, setCanDelete] = useState(false);

    const activeOrgId = session?.session.activeOrganizationId ?? null;
    const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null;

    const refreshOrgs = useCallback(async () => {
        const { data, error: listError } = await authClient.organization.list();
        if (listError) {
            setError(listError.message ?? "Could not load organizations");
            return;
        }
        setOrgs((data as Org[]) ?? []);
    }, []);

    const refreshPermissions = useCallback(async () => {
        if (!activeOrgId) {
            setCanUpdate(false);
            setCanDelete(false);
            return;
        }
        const [updateRes, deleteRes] = await Promise.all([
            authClient.organization.hasPermission({
                permissions: { organization: ["update"] },
                organizationId: activeOrgId,
            }),
            authClient.organization.hasPermission({
                permissions: { organization: ["delete"] },
                organizationId: activeOrgId,
            }),
        ]);
        setCanUpdate(Boolean(updateRes.data?.success));
        setCanDelete(Boolean(deleteRes.data?.success));
    }, [activeOrgId]);

    useEffect(() => {
        if (session) {
            void refreshOrgs();
        }
    }, [session?.user.id, refreshOrgs]);

    useEffect(() => {
        if (activeOrg) {
            setEditName(activeOrg.name);
        }
        void refreshPermissions();
    }, [activeOrg?.id, activeOrg?.name, refreshPermissions]);

    async function createOrganization(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setMessage(null);
        const slug = orgName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        const { error: createError } = await authClient.organization.create({
            name: orgName.trim(),
            slug: slug || `org-${Date.now()}`,
        });
        setBusy(false);
        if (createError) {
            setError(createError.message ?? "Could not create organization");
            return;
        }
        setOrgName("");
        setMessage("Organization created");
        await refreshOrgs();
    }

    async function setActive(organizationId: string) {
        setBusy(true);
        setError(null);
        const { error: activeError } = await authClient.organization.setActive({ organizationId });
        setBusy(false);
        if (activeError) {
            setError(activeError.message ?? "Could not set active organization");
            return;
        }
        setMessage("Active organization updated");
        router.refresh();
    }

    async function updateActiveOrg(e: React.FormEvent) {
        e.preventDefault();
        if (!activeOrgId) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: updateError } = await authClient.organization.update({
            organizationId: activeOrgId,
            data: { name: editName.trim() },
        });
        setBusy(false);
        if (updateError) {
            setError(updateError.message ?? "Could not update organization");
            return;
        }
        setMessage("Organization updated");
        await refreshOrgs();
    }

    async function leaveActiveOrg() {
        if (!activeOrgId) return;
        if (!window.confirm("Leave this organization? You will lose access until re-invited.")) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: leaveError } = await authClient.organization.leave({
            organizationId: activeOrgId,
        });
        setBusy(false);
        if (leaveError) {
            setError(leaveError.message ?? "Could not leave organization");
            return;
        }
        setMessage("You left the organization");
        await refreshOrgs();
        router.refresh();
    }

    async function deleteActiveOrg() {
        if (!activeOrgId) return;
        if (
            !window.confirm(
                "Delete this organization permanently? Members, invitations, and teams will be removed.",
            )
        ) {
            return;
        }
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: deleteError } = await authClient.organization.delete({
            organizationId: activeOrgId,
        });
        setBusy(false);
        if (deleteError) {
            setError(deleteError.message ?? "Could not delete organization");
            return;
        }
        setMessage("Organization deleted");
        await refreshOrgs();
        router.refresh();
    }

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
            {message ? <p className="text-sm text-success-primary">{message}</p> : null}
            {error ? <p className="text-sm text-error-primary">{error}</p> : null}

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Your organizations</h2>
                    <p className="text-sm text-tertiary">Create an organization or switch the active one.</p>
                </div>
                {orgs.length === 0 ? (
                    <p className="text-md text-tertiary">No organizations yet. Create one below.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {orgs.map((org) => (
                            <li
                                key={org.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3 ring-1 ring-secondary"
                            >
                                <div>
                                    <p className="font-medium text-primary">{org.name}</p>
                                    <p className="font-mono text-sm text-tertiary">{org.slug}</p>
                                </div>
                                {org.id === activeOrgId ? (
                                    <span className="text-sm font-medium text-brand-secondary">Active</span>
                                ) : (
                                    <Button color="secondary" size="sm" isDisabled={busy} onPress={() => void setActive(org.id)}>
                                        Set active
                                    </Button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Create organization</h2>
                </div>
                <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={(e) => void createOrganization(e)}>
                    <Input
                        isRequired
                        label="Organization name"
                        name="orgName"
                        value={orgName}
                        onChange={setOrgName}
                        placeholder="Acme Inc"
                        className="flex-1"
                    />
                    <Button type="submit" color="primary" size="md" isDisabled={busy || !orgName.trim()} isLoading={busy}>
                        Create
                    </Button>
                </form>
            </section>

            {activeOrg ? (
                <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-display text-xl font-medium tracking-tight text-primary">Active organization</h2>
                        <p className="text-sm text-tertiary">
                            Manage <span className="font-medium text-primary">{activeOrg.name}</span> ({activeOrg.slug}).
                        </p>
                    </div>

                    {canUpdate ? (
                        <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={(e) => void updateActiveOrg(e)}>
                            <Input
                                isRequired
                                label="Name"
                                name="editName"
                                value={editName}
                                onChange={setEditName}
                                className="flex-1"
                            />
                            <Button
                                type="submit"
                                color="secondary"
                                size="md"
                                isDisabled={busy || !editName.trim() || editName.trim() === activeOrg.name}
                                isLoading={busy}
                            >
                                Save name
                            </Button>
                        </form>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                        <Button color="secondary" size="md" isDisabled={busy} onPress={() => void leaveActiveOrg()}>
                            Leave organization
                        </Button>
                        {canDelete ? (
                            <Button color="primary-destructive" size="md" isDisabled={busy} onPress={() => void deleteActiveOrg()}>
                                Delete organization
                            </Button>
                        ) : null}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
