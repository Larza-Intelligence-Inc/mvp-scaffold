"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/application/dashboard-shell";
import { authClient } from "@/lib/auth-client";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        if (!isPending && !session) {
            router.replace("/login");
        }
    }, [isPending, session, router]);

    if (isPending || !session) {
        return (
            <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
                <p className="text-md text-tertiary">Loading…</p>
            </main>
        );
    }

    return <DashboardShell>{children}</DashboardShell>;
}
