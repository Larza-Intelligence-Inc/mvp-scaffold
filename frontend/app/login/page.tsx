"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/application/auth-split-layout";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { appOrigin, authClient, safeNextPath } from "@/lib/auth-client";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = safeNextPath(searchParams.get("next"));
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(
        searchParams.get("reset") === "1"
            ? "Password updated. You can log in with your new password."
            : searchParams.get("error") === "magic_link"
              ? "That magic link is invalid or expired. Request a new one."
              : null,
    );
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setInfo(null);
        setLoading(true);
        const { error: signInError } = await authClient.signIn.email({
            email,
            password,
            callbackURL: `${appOrigin()}${nextPath}`,
        });
        setLoading(false);
        if (signInError) {
            const message = signInError.message ?? "Login failed";
            setError(message);
            if (/verif/i.test(message) || signInError.code === "EMAIL_NOT_VERIFIED") {
                setInfo("Verify your email to continue. You can resend the confirmation link below.");
            }
            return;
        }
        router.push(nextPath);
        router.refresh();
    }

    async function onResendVerification() {
        if (!email) {
            setError("Enter your email above, then resend verification.");
            return;
        }
        setResending(true);
        setError(null);
        const { error: sendError } = await authClient.sendVerificationEmail({
            email,
            callbackURL: `${appOrigin()}${nextPath}`,
        });
        setResending(false);
        if (sendError) {
            setError(sendError.message ?? "Could not resend verification email");
            return;
        }
        setInfo(`Verification email sent to ${email}.`);
    }

    async function onPasskeySignIn() {
        setError(null);
        setInfo(null);
        setLoading(true);
        const { error: passkeyError } = await authClient.signIn.passkey({});
        setLoading(false);
        if (passkeyError) {
            setError(passkeyError.message ?? "Passkey sign-in failed");
            return;
        }
        router.push(nextPath);
        router.refresh();
    }

    const nextQuery = nextPath !== "/dashboard" ? `?next=${encodeURIComponent(nextPath)}` : "";

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-display-xs font-medium tracking-tight text-primary">Log in</h1>
                <p className="text-md text-tertiary">
                    New here?{" "}
                    <a className="font-medium text-brand-secondary hover:underline" href={`/sign-up${nextQuery}`}>
                        Create an account
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
                <div className="flex flex-col gap-2">
                    <Input
                        isRequired
                        label="Password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="••••••••"
                        size="md"
                    />
                    <a
                        className="self-end text-sm font-medium text-brand-secondary hover:underline"
                        href={`/forgot-password${nextQuery}`}
                    >
                        Forgot password?
                    </a>
                </div>
                {error ? <p className="text-sm text-error-primary">{error}</p> : null}
                {info ? <p className="text-sm text-tertiary">{info}</p> : null}
                <Button type="submit" color="primary" size="lg" className="w-full" isDisabled={loading} isLoading={loading}>
                    Log in
                </Button>
            </form>

            {info && /verif/i.test(info) ? (
                <Button color="secondary" size="md" className="w-full" isDisabled={resending} isLoading={resending} onPress={() => void onResendVerification()}>
                    Resend verification email
                </Button>
            ) : null}

            <div className="flex items-center gap-3">
                <div className="h-px flex-1 border-t border-secondary" />
                <span className="text-sm text-tertiary">or</span>
                <div className="h-px flex-1 border-t border-secondary" />
            </div>

            <div className="flex flex-col gap-3">
                <Button color="secondary" size="lg" className="w-full" href={`/magic-link${nextQuery}`}>
                    Email me a magic link
                </Button>
                <Button
                    color="secondary"
                    size="lg"
                    className="w-full"
                    isDisabled={loading}
                    onPress={() => void onPasskeySignIn()}
                >
                    Sign in with passkey
                </Button>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <AuthSplitLayout
            panelTitle="Care that stays ahead."
            panelSubtitle="Personalized preventative care, organized for the teams who deliver it."
        >
            <Suspense fallback={<p className="text-md text-tertiary">Loading…</p>}>
                <LoginForm />
            </Suspense>
        </AuthSplitLayout>
    );
}
