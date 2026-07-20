"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { appOrigin, authClient } from "@/lib/auth-client";

export default function LoginPage() {
    const router = useRouter();
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
            callbackURL: `${appOrigin()}/dashboard`,
        });
        setLoading(false);
        if (signInError) {
            setError(signInError.message ?? "Login failed");
            return;
        }
        router.push("/dashboard");
        router.refresh();
    }

    return (
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-16">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-display-xs font-semibold text-primary">Log in</h1>
                    <p className="text-md text-tertiary">
                        New here?{" "}
                        <a className="font-medium text-brand-secondary hover:underline" href="/sign-up">
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
                    />
                    <Input
                        isRequired
                        label="Password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={setPassword}
                        placeholder="••••••••"
                    />
                    {error ? <p className="text-sm text-error-primary">{error}</p> : null}
                    <Button type="submit" color="primary" size="lg" className="w-full" isDisabled={loading} isLoading={loading}>
                        Log in
                    </Button>
                </form>
            </div>
        </main>
    );
}
