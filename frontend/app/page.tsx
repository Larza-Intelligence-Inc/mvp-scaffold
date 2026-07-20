import { HomePage } from "@/components/landing/home-page";
import { getServerBackendClient } from "@/generated/backend/client";

async function getHello() {
    try {
        const { data, error } = await getServerBackendClient().GET("/api/hello");
        if (error || !data) {
            return { message: "Backend not reachable — is the backend service up?" };
        }
        return data;
    } catch {
        return { message: "Backend not reachable — is the backend service up?" };
    }
}

export default async function Page() {
    const data = await getHello();
    return <HomePage apiMessage={data.message} />;
}
