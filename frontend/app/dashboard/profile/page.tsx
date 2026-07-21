"use client";

import { authClient } from "@/lib/auth-client";

export default function ProfilePage() {
    const { data: session } = authClient.useSession();
    const user = session?.user;

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <p className="text-md text-tertiary">Profile details will live here. This is a placeholder route.</p>
            {user ? (
                <dl className="flex flex-col gap-3 rounded-2xl bg-primary p-4 ring-1 ring-secondary sm:p-6">
                    <div>
                        <dt className="text-sm text-tertiary">Name</dt>
                        <dd className="text-md font-medium text-primary">{user.name || "—"}</dd>
                    </div>
                    <div>
                        <dt className="text-sm text-tertiary">Email</dt>
                        <dd className="text-md font-medium text-primary">{user.email}</dd>
                    </div>
                </dl>
            ) : null}
        </div>
    );
}
