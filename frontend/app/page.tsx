import { HomePage } from "@/components/landing/home-page";
import { getServerBackendClient } from "@/generated/backend/client";

// Render at request time, not build time: the backend is only reachable at
// runtime (private network), so static prerendering during `docker build` would
// bake in a stale "not reachable" message.
export const dynamic = "force-dynamic";

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
