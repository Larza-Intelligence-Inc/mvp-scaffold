"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/application/auth-split-layout";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { appOrigin, authClient } from "@/lib/auth-client";

function safeNextPath(raw: string | null): string {
    if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
    return raw;
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = safeNextPath(searchParams.get("next"));
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const { error: signInError } = await authClient.signIn.email({
            email,
            password,
            callbackURL: `${appOrigin()}${nextPath}`,
        });
        setLoading(false);
        if (signInError) {
            setError(signInError.message ?? "Login failed");
            return;
        }
        router.push(nextPath);
        router.refresh();
    }

    async function onPasskeySignIn() {
        setError(null);
        setLoading(true);
        const { error: passkeyError } = await authClient.signIn.passkey({
            fetchOptions: {
                // Ensure session cookie lands for the proxied same-origin path.
            },
        });
        setLoading(false);
        if (passkeyError) {
            setError(passkeyError.message ?? "Passkey sign-in failed");
            return;
        }
        router.push(nextPath);
        router.refresh();
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-display-xs font-medium tracking-tight text-primary">Log in</h1>
                <p className="text-md text-tertiary">
                    New here?{" "}
                    <a
                        className="font-medium text-brand-secondary hover:underline"
                        href={nextPath !== "/dashboard" ? `/sign-up?next=${encodeURIComponent(nextPath)}` : "/sign-up"}
                    >
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
                {error ? <p className="text-sm text-error-primary">{error}</p> : null}
                <Button type="submit" color="primary" size="lg" className="w-full" isDisabled={loading} isLoading={loading}>
                    Log in
                </Button>
            </form>

            <div className="flex items-center gap-3">
                <div className="h-px flex-1 border-t border-secondary" />
                <span className="text-sm text-tertiary">or</span>
                <div className="h-px flex-1 border-t border-secondary" />
            </div>

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
