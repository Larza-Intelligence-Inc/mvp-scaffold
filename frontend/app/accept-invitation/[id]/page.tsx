"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/application/auth-split-layout";
import { Button } from "@/components/base/buttons/button";
import { authClient } from "@/lib/auth-client";

type InvitationDetails = {
    id: string;
    email: string;
    role?: string | null;
    status: string;
    organizationId: string;
    organization?: {
        name?: string;
        slug?: string;
    };
};

export default function AcceptInvitationPage() {
    const params = useParams<{ id: string }>();
    const invitationId = params.id;
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!invitationId || isPending) return;
        if (!session) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        async function load() {
            setLoading(true);
            const { data, error: getError } = await authClient.organization.getInvitation({
                query: { id: invitationId },
            });
            if (cancelled) return;
            if (getError) {
                setError(getError.message ?? "Invitation not found");
                setInvitation(null);
            } else {
                setInvitation(data as InvitationDetails);
            }
            setLoading(false);
        }
        void load();
        return () => {
            cancelled = true;
        };
    }, [invitationId, session, isPending]);

    async function accept() {
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: acceptError } = await authClient.organization.acceptInvitation({
            invitationId,
        });
        setBusy(false);
        if (acceptError) {
            setError(acceptError.message ?? "Could not accept invitation");
            return;
        }
        setMessage("Invitation accepted");
        router.push("/dashboard/organizations");
        router.refresh();
    }

    async function reject() {
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: rejectError } = await authClient.organization.rejectInvitation({
            invitationId,
        });
        setBusy(false);
        if (rejectError) {
            setError(rejectError.message ?? "Could not reject invitation");
            return;
        }
        setMessage("Invitation rejected");
        router.push("/dashboard");
    }

    if (isPending || loading) {
        return (
            <AuthSplitLayout panelTitle="You're invited." panelSubtitle="Join your team on Larza.">
                <p className="text-md text-tertiary">Loading invitation…</p>
            </AuthSplitLayout>
        );
    }

    if (!session) {
        const next = encodeURIComponent(`/accept-invitation/${invitationId}`);
        return (
            <AuthSplitLayout panelTitle="You're invited." panelSubtitle="Sign in with the invited email to continue.">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <h1 className="font-display text-display-xs font-medium tracking-tight text-primary">
                            Sign in required
                        </h1>
                        <p className="text-md text-tertiary">
                            Log in or create an account with the email address that received this invitation.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button color="primary" size="md" href={`/login?next=${next}`}>
                            Log in
                        </Button>
                        <Button color="secondary" size="md" href={`/sign-up?next=${next}`}>
                            Sign up
                        </Button>
                    </div>
                </div>
            </AuthSplitLayout>
        );
    }

    return (
        <AuthSplitLayout
            panelTitle="You're invited."
            panelSubtitle="Accept to join the organization and start collaborating."
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="font-display text-display-xs font-medium tracking-tight text-primary">
                        Organization invitation
                    </h1>
                    {invitation ? (
                        <p className="text-md text-tertiary">
                            Join{" "}
                            <span className="font-medium text-primary">
                                {invitation.organization?.name ?? "an organization"}
                            </span>{" "}
                            as <span className="font-medium text-primary">{invitation.role ?? "member"}</span>. Invited
                            email: <span className="font-mono text-primary">{invitation.email}</span>
                        </p>
                    ) : (
                        <p className="text-md text-tertiary">We couldn&apos;t load this invitation.</p>
                    )}
                </div>

                {message ? <p className="text-sm text-success-primary">{message}</p> : null}
                {error ? <p className="text-sm text-error-primary">{error}</p> : null}

                {invitation && invitation.status === "pending" ? (
                    <div className="flex flex-wrap gap-3">
                        <Button color="primary" size="md" isDisabled={busy} isLoading={busy} onPress={() => void accept()}>
                            Accept invitation
                        </Button>
                        <Button color="secondary" size="md" isDisabled={busy} onPress={() => void reject()}>
                            Decline
                        </Button>
                    </div>
                ) : invitation ? (
                    <p className="text-sm text-tertiary">This invitation is {invitation.status}.</p>
                ) : null}
            </div>
        </AuthSplitLayout>
    );
}
