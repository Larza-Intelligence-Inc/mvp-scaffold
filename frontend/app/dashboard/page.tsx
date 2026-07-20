"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/application/dashboard-shell";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { authClient } from "@/lib/auth-client";

type Org = {
    id: string;
    name: string;
    slug: string;
};

export default function DashboardPage() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [orgName, setOrgName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const activeOrgId = session?.session.activeOrganizationId ?? null;

    async function refreshOrgs() {
        const { data, error: listError } = await authClient.organization.list();
        if (listError) {
            setError(listError.message ?? "Could not load organizations");
            return;
        }
        setOrgs((data as Org[]) ?? []);
    }

    useEffect(() => {
        if (!isPending && !session) {
            router.replace("/login");
        }
    }, [isPending, session, router]);

    useEffect(() => {
        if (session) {
            void refreshOrgs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session?.user.id]);

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

    async function inviteMember(e: React.FormEvent) {
        e.preventDefault();
        if (!activeOrgId) {
            setError("Select an active organization first");
            return;
        }
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: inviteError } = await authClient.organization.inviteMember({
            email: inviteEmail.trim(),
            role: "member",
            organizationId: activeOrgId,
        });
        setBusy(false);
        if (inviteError) {
            setError(inviteError.message ?? "Invite failed");
            return;
        }
        setInviteEmail("");
        setMessage("Invitation sent (check backend logs for the invite link)");
    }

    if (isPending || !session) {
        return (
            <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
                <p className="text-md text-tertiary">Loading…</p>
            </main>
        );
    }

    const activeOrg = orgs.find((o) => o.id === activeOrgId) ?? null;
    const firstName = session.user.name?.split(" ")[0] || "there";

    return (
        <DashboardShell title={`Welcome back, ${firstName}`} subtitle={activeOrg ? `Active org · ${activeOrg.name}` : "No active organization yet"}>
            <div className="mx-auto flex max-w-3xl flex-col gap-8">
                {message ? <p className="text-sm text-success-primary">{message}</p> : null}
                {error ? <p className="text-sm text-error-primary">{error}</p> : null}

                <section id="organizations" className="flex flex-col gap-4 rounded-2xl bg-primary p-6 shadow-sm ring-1 ring-secondary">
                    <div className="flex flex-col gap-1">
                        <p className="font-mono text-xs font-medium tracking-[0.08em] text-tertiary uppercase">Organizations</p>
                        <h2 className="font-display text-xl font-medium tracking-tight text-primary">Your organizations</h2>
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
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            isDisabled={busy}
                                            onPress={() => void setActive(org.id)}
                                        >
                                            Set active
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="flex flex-col gap-4 rounded-2xl bg-primary p-6 shadow-sm ring-1 ring-secondary">
                    <div className="flex flex-col gap-1">
                        <p className="font-mono text-xs font-medium tracking-[0.08em] text-tertiary uppercase">Create</p>
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

                <section id="members" className="flex flex-col gap-4 rounded-2xl bg-primary p-6 shadow-sm ring-1 ring-secondary">
                    <div className="flex flex-col gap-1">
                        <p className="font-mono text-xs font-medium tracking-[0.08em] text-tertiary uppercase">Members</p>
                        <h2 className="font-display text-xl font-medium tracking-tight text-primary">Invite member</h2>
                    </div>
                    <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={(e) => void inviteMember(e)}>
                        <Input
                            isRequired
                            label="Email"
                            name="inviteEmail"
                            type="email"
                            value={inviteEmail}
                            onChange={setInviteEmail}
                            placeholder="teammate@example.com"
                            className="flex-1"
                            isDisabled={!activeOrgId}
                        />
                        <Button
                            type="submit"
                            color="primary"
                            size="md"
                            isDisabled={busy || !activeOrgId || !inviteEmail.trim()}
                            isLoading={busy}
                        >
                            Invite
                        </Button>
                    </form>
                    {!activeOrgId ? (
                        <p className="text-sm text-tertiary">Set an active organization before inviting members.</p>
                    ) : null}
                </section>
            </div>
        </DashboardShell>
    );
}
