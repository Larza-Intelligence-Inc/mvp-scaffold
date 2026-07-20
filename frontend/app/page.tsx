import { WelcomeHero } from "@/components/landing/welcome-hero";
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
            <WelcomeHero apiMessage={data.message} />
        </main>
    );
}
