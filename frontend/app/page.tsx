import { Badge } from "@/components/base/badges/badges";
import { WelcomeActions } from "@/components/landing/welcome-actions";
import { getServerBackendClient } from "@/generated/backend/client";

async function getHello() {
    try {
        const { data, error } = await getServerBackendClient().GET("/api/hello");
        if (error || !data) {
            return { message: "⚠️ Backend not reachable — is the backend service up?" };
        }
        return data;
    } catch {
        return { message: "⚠️ Backend not reachable — is the backend service up?" };
    }
}

export default async function Page() {
    const data = await getHello();

    return (
        <main className="mx-auto flex min-h-dvh max-w-container flex-col justify-center px-6 py-16">
            <div className="flex max-w-xl flex-col gap-8">
                <div className="flex flex-col gap-4">
                    <Badge type="pill-color" color="brand" size="sm">
                        MVP Scaffold
                    </Badge>
                    <div className="flex flex-col gap-3">
                        <h1 className="text-display-md font-semibold text-primary">Welcome</h1>
                        <p className="text-md text-tertiary">
                            A full-stack starter with Next.js, Hono, PostgreSQL, and Untitled UI. Use this as a
                            blank canvas for your product.
                        </p>
                    </div>
                </div>

                <div className="rounded-xl bg-secondary p-4 ring-1 ring-secondary">
                    <p className="text-md text-secondary">
                        <strong className="text-primary">API says:</strong> {data.message}
                    </p>
                </div>

                <WelcomeActions />
            </div>
        </main>
    );
}
