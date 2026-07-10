import { Button } from "@/components/base/buttons/button";
import { Badge } from "@/components/base/badges/badges";
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
        <main className="mx-auto max-w-container px-6 py-12">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                    <Badge type="pill-color" color="brand" size="sm">
                        Untitled UI ready
                    </Badge>
                    <h1 className="text-display-sm font-semibold text-primary">One-click scaffold</h1>
                    <p className="text-md text-tertiary">
                        Frontend (Next.js) → Backend (Hono) → Database (Postgres), all wired.
                    </p>
                </div>

                <div className="rounded-xl bg-secondary p-4 ring-1 ring-secondary">
                    <p className="text-md text-secondary">
                        <strong className="text-primary">API says:</strong> {data.message}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button color="primary" size="md">
                        Primary button
                    </Button>
                    <Button color="secondary" size="md">
                        Secondary
                    </Button>
                    <Button color="link-color" size="md" href="https://www.untitledui.com/react/docs/cli">
                        Add more components
                    </Button>
                </div>
            </div>
        </main>
    );
}
