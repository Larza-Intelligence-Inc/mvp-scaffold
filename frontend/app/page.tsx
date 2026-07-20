import { ComponentShowcase } from "@/components/landing/component-showcase";
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
            <ComponentShowcase apiMessage={data.message} />
        </main>
    );
}
