"use client";

import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { authClient } from "@/lib/auth-client";

export default function MembersPage() {
    const { data: session } = authClient.useSession();
    const [inviteEmail, setInviteEmail] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const activeOrgId = session?.session.activeOrganizationId ?? null;

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

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
            {message ? <p className="text-sm text-success-primary">{message}</p> : null}
            {error ? <p className="text-sm text-error-primary">{error}</p> : null}

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Invite member</h2>
                    <p className="text-sm text-tertiary">Send an invitation to join the active organization.</p>
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
                    <Button type="submit" color="primary" size="md" isDisabled={busy || !activeOrgId || !inviteEmail.trim()} isLoading={busy}>
                        Invite
                    </Button>
                </form>
                {!activeOrgId ? (
                    <p className="text-sm text-tertiary">
                        Set an active organization on the Organizations page before inviting members.
                    </p>
                ) : null}
            </section>
        </div>
    );
}
