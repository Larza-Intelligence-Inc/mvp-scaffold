"use client";

import { authClient } from "@/lib/auth-client";

export default function DashboardHomePage() {
    const { data: session } = authClient.useSession();
    const firstName = session?.user.name?.split(" ")[0] || "there";

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <p className="text-md text-tertiary">Welcome back, {firstName}. Use the sidebar to manage organizations, members, and settings.</p>
        </div>
    );
}
