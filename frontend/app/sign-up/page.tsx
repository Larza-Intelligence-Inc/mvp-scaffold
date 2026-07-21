"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthSplitLayout } from "@/components/application/auth-split-layout";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { appOrigin, authClient } from "@/lib/auth-client";

export default function SignUpPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const { error: signUpError } = await authClient.signUp.email({
            name,
            email,
            password,
            callbackURL: `${appOrigin()}/dashboard`,
        });
        setLoading(false);
        if (signUpError) {
            setError(signUpError.message ?? "Sign up failed");
            return;
        }
        router.push("/dashboard");
        router.refresh();
    }

    return (
        <AuthSplitLayout
            panelTitle="Start with a clearer picture."
            panelSubtitle="Join Larza and keep your care team aligned from day one."
        >
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                    <h1 className="font-display text-display-xs font-medium tracking-tight text-primary">Create account</h1>
                    <p className="text-md text-tertiary">
                        Already have an account?{" "}
                        <a className="font-medium text-brand-secondary hover:underline" href="/login">
                            Log in
                        </a>
                    </p>
                </div>

                <form className="flex flex-col gap-5" onSubmit={onSubmit}>
                    <Input isRequired label="Name" name="name" value={name} onChange={setName} placeholder="Ada Lovelace" size="md" />
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
                        hint="At least 8 characters"
                        size="md"
                    />
                    {error ? <p className="text-sm text-error-primary">{error}</p> : null}
                    <Button type="submit" color="primary" size="lg" className="w-full" isDisabled={loading} isLoading={loading}>
                        Sign up
                    </Button>
                </form>
            </div>
        </AuthSplitLayout>
    );
}
