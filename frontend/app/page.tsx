// This is a SERVER component: the fetch runs inside the container, so it uses the
// internal service URL (http://backend:3001). A client component in the browser would
// instead use process.env.NEXT_PUBLIC_API_URL (http://localhost:3001).
async function getHello() {
  const url = process.env.BACKEND_URL_INTERNAL ?? 'http://localhost:3001'
  try {
    const res = await fetch(`${url}/api/hello`, { cache: 'no-store' })
    return (await res.json()) as { message: string }
  } catch {
    return { message: '⚠️ Backend not reachable — is the backend service up?' }
  }
}

export default async function Page() {
  const data = await getHello()
  return (
    <main style={{ padding: 48, maxWidth: 640 }}>
      <h1>One-click scaffold</h1>
      <p>Frontend (Next.js) → Backend (Hono) → Database (Postgres), all wired.</p>
      <p style={{ padding: 16, background: '#f4f4f5', borderRadius: 8 }}>
        <strong>API says:</strong> {data.message}
      </p>
    </main>
  )
}
