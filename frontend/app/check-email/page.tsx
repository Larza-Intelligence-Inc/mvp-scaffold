"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/application/auth-split-layout";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { appOrigin, authClient, safeNextPath } from "@/lib/auth-client";

function CheckEmailForm() {
    const searchParams = useSearchParams();
    const nextPath = safeNextPath(searchParams.get("next"));
    const initialEmail = searchParams.get("email") ?? "";
    const [email, setEmail] = useState(initialEmail);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(
        initialEmail ? `We sent a verification link to ${initialEmail}.` : null,
    );
    const [loading, setLoading] = useState(false);

    async function resend(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);
        const { error: sendError } = await authClient.sendVerificationEmail({
            email,
            callbackURL: `${appOrigin()}${nextPath}`,
        });
        setLoading(false);
        if (sendError) {
            setError(sendError.message ?? "Could not resend verification email");
            return;
        }
        setMessage(`Verification email sent to ${email}.`);
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-display-xs font-medium tracking-tight text-primary">Verify your email</h1>
                <p className="text-md text-tertiary">
                    Open the link in your inbox to activate your account, then{" "}
                    <a className="font-medium text-brand-secondary hover:underline" href="/login">
                        log in
                    </a>
                    .
                </p>
            </div>

            {message ? <p className="text-sm text-success-primary">{message}</p> : null}

            <form className="flex flex-col gap-5" onSubmit={resend}>
                <Input
                    isRequired
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="ada@example.com"
                    size="md"
                />
                {error ? <p className="text-sm text-error-primary">{error}</p> : null}
                <Button type="submit" color="secondary" size="lg" className="w-full" isDisabled={loading} isLoading={loading}>
                    Resend verification email
                </Button>
            </form>
        </div>
    );
}

export default function CheckEmailPage() {
    return (
        <AuthSplitLayout
            panelTitle="One more step."
            panelSubtitle="Confirm your email so we know it's really you."
        >
            <Suspense fallback={<p className="text-md text-tertiary">Loading…</p>}>
                <CheckEmailForm />
            </Suspense>
        </AuthSplitLayout>
    );
}
