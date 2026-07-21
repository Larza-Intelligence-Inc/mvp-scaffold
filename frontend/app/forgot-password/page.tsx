"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/application/auth-split-layout";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { appOrigin, authClient, safeNextPath } from "@/lib/auth-client";

function ForgotPasswordForm() {
    const searchParams = useSearchParams();
    const nextPath = safeNextPath(searchParams.get("next"));
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const { error: resetError } = await authClient.requestPasswordReset({
            email,
            redirectTo: `${appOrigin()}/reset-password`,
        });
        setLoading(false);
        if (resetError) {
            setError(resetError.message ?? "Could not send reset email");
            return;
        }
        setSent(true);
    }

    if (sent) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="font-display text-display-xs font-medium tracking-tight text-primary">Check your email</h1>
                <p className="text-md text-tertiary">
                    If an account exists for <span className="font-medium text-primary">{email}</span>, we sent a password
                    reset link. It expires in about an hour.
                </p>
                <a className="font-medium text-brand-secondary hover:underline" href="/login">
                    Back to log in
                </a>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-display-xs font-medium tracking-tight text-primary">Forgot password</h1>
                <p className="text-md text-tertiary">
                    Enter your email and we&apos;ll send a reset link.{" "}
                    <a
                        className="font-medium text-brand-secondary hover:underline"
                        href={nextPath !== "/dashboard" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
                    >
                        Back to log in
                    </a>
                </p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={onSubmit}>
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
                <Button type="submit" color="primary" size="lg" className="w-full" isDisabled={loading} isLoading={loading}>
                    Send reset link
                </Button>
            </form>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <AuthSplitLayout
            panelTitle="Get back in securely."
            panelSubtitle="We'll email you a one-time link to choose a new password."
        >
            <Suspense fallback={<p className="text-md text-tertiary">Loading…</p>}>
                <ForgotPasswordForm />
            </Suspense>
        </AuthSplitLayout>
    );
}
