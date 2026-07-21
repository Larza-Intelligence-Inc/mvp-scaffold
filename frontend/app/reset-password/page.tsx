"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/application/auth-split-layout";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const linkError = searchParams.get("error");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(
        linkError ? "This reset link is invalid or expired. Request a new one." : null,
    );
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!token) {
            setError("Missing reset token. Request a new password reset email.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        const { error: resetError } = await authClient.resetPassword({
            newPassword: password,
            token,
        });
        setLoading(false);
        if (resetError) {
            setError(resetError.message ?? "Could not reset password");
            return;
        }
        router.push("/login?reset=1");
        router.refresh();
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-display-xs font-medium tracking-tight text-primary">Choose a new password</h1>
                <p className="text-md text-tertiary">
                    Or{" "}
                    <a className="font-medium text-brand-secondary hover:underline" href="/forgot-password">
                        request a new link
                    </a>
                </p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={onSubmit}>
                <Input
                    isRequired
                    label="New password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    hint="At least 8 characters"
                    size="md"
                />
                <Input
                    isRequired
                    label="Confirm password"
                    name="confirm"
                    type="password"
                    value={confirm}
                    onChange={setConfirm}
                    placeholder="••••••••"
                    size="md"
                />
                {error ? <p className="text-sm text-error-primary">{error}</p> : null}
                <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    className="w-full"
                    isDisabled={loading || !token}
                    isLoading={loading}
                >
                    Update password
                </Button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <AuthSplitLayout panelTitle="Set a fresh password." panelSubtitle="Your previous sessions will be signed out for safety.">
            <Suspense fallback={<p className="text-md text-tertiary">Loading…</p>}>
                <ResetPasswordForm />
            </Suspense>
        </AuthSplitLayout>
    );
}
