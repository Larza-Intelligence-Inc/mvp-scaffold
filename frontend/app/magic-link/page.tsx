"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthSplitLayout } from "@/components/application/auth-split-layout";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { appOrigin, authClient, safeNextPath } from "@/lib/auth-client";

function MagicLinkForm() {
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
        const { error: magicError } = await authClient.signIn.magicLink({
            email,
            callbackURL: `${appOrigin()}${nextPath}`,
            errorCallbackURL: `${appOrigin()}/login?error=magic_link`,
        });
        setLoading(false);
        if (magicError) {
            setError(magicError.message ?? "Could not send magic link");
            return;
        }
        setSent(true);
    }

    if (sent) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="font-display text-display-xs font-medium tracking-tight text-primary">Check your email</h1>
                <p className="text-md text-tertiary">
                    We sent a sign-in link to <span className="font-medium text-primary">{email}</span>. It expires in 10
                    minutes.
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
                <h1 className="font-display text-display-xs font-medium tracking-tight text-primary">Email magic link</h1>
                <p className="text-md text-tertiary">
                    We will email you a one-tap sign-in link.{" "}
                    <a
                        className="font-medium text-brand-secondary hover:underline"
                        href={nextPath !== "/dashboard" ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
                    >
                        Use password instead
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
                    Send magic link
                </Button>
            </form>
        </div>
    );
}

export default function MagicLinkPage() {
    return (
        <AuthSplitLayout
            panelTitle="Sign in without a password."
            panelSubtitle="A secure link in your inbox is all it takes."
        >
            <Suspense fallback={<p className="text-md text-tertiary">Loading…</p>}>
                <MagicLinkForm />
            </Suspense>
        </AuthSplitLayout>
    );
}
