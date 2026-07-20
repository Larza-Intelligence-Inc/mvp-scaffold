"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WelcomeHero } from "@/components/landing/welcome-hero";
import { authClient } from "@/lib/auth-client";

export function HomePage({ apiMessage }: { apiMessage: string }) {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        if (!isPending && session) {
            router.replace("/dashboard");
        }
    }, [isPending, session, router]);

    if (isPending) {
        return (
            <main className="mx-auto flex min-h-dvh max-w-container flex-col justify-center px-6 py-16">
                <p className="text-md text-tertiary">Loading…</p>
            </main>
        );
    }

    if (session) {
        return null;
    }

    return (
        <main className="mx-auto flex min-h-dvh max-w-container flex-col justify-center px-6 py-16">
            <WelcomeHero apiMessage={apiMessage} />
        </main>
    );
}
