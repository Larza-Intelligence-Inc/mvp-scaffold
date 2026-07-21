"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { authClient } from "@/lib/auth-client";

type PasskeyRow = {
    id: string;
    name?: string | null;
    deviceType?: string;
    backedUp?: boolean;
    createdAt?: string | Date | null;
    aaguid?: string | null;
};

function passkeyLabel(pk: PasskeyRow): string {
    if (pk.name?.trim()) return pk.name.trim();
    if (pk.deviceType) return `${pk.deviceType} passkey`;
    return "Passkey";
}

export default function ProfilePage() {
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
    const [passkeyName, setPasskeyName] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const refreshPasskeys = useCallback(async () => {
        const { data, error: listError } = await authClient.passkey.listUserPasskeys();
        if (listError) {
            setError(listError.message ?? "Could not load passkeys");
            return;
        }
        setPasskeys((data as PasskeyRow[]) ?? []);
    }, []);

    useEffect(() => {
        if (session) {
            void refreshPasskeys();
        }
    }, [session?.user.id, refreshPasskeys]);

    async function addPasskey(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: addError } = await authClient.passkey.addPasskey({
            name: passkeyName.trim() || undefined,
        });
        setBusy(false);
        if (addError) {
            setError(addError.message ?? "Could not register passkey");
            return;
        }
        setPasskeyName("");
        setMessage("Passkey registered");
        await refreshPasskeys();
    }

    async function renamePasskey(id: string, name: string) {
        const next = window.prompt("Passkey name", name);
        if (next === null) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: updateError } = await authClient.passkey.updatePasskey({
            id,
            name: next.trim(),
        });
        setBusy(false);
        if (updateError) {
            setError(updateError.message ?? "Could not update passkey");
            return;
        }
        setMessage("Passkey updated");
        await refreshPasskeys();
    }

    async function removePasskey(id: string) {
        if (!window.confirm("Delete this passkey?")) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: deleteError } = await authClient.passkey.deletePasskey({ id });
        setBusy(false);
        if (deleteError) {
            setError(deleteError.message ?? "Could not delete passkey");
            return;
        }
        setMessage("Passkey deleted");
        await refreshPasskeys();
    }

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
            {message ? <p className="text-sm text-success-primary">{message}</p> : null}
            {error ? <p className="text-sm text-error-primary">{error}</p> : null}

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Profile</h2>
                    <p className="text-sm text-tertiary">Your account details.</p>
                </div>
                {user ? (
                    <dl className="flex flex-col gap-3">
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
            </section>

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Passkeys</h2>
                    <p className="text-sm text-tertiary">
                        Sign in with your device authenticator — no password or email provider required.
                    </p>
                </div>

                {passkeys.length === 0 ? (
                    <p className="text-md text-tertiary">No passkeys registered yet.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {passkeys.map((pk) => {
                            const label = passkeyLabel(pk);
                            return (
                                <li
                                    key={pk.id}
                                    className="flex flex-col gap-3 rounded-xl bg-secondary px-4 py-3 ring-1 ring-secondary sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-medium text-primary">{label}</p>
                                        <p className="text-sm text-tertiary">
                                            {pk.deviceType ?? "unknown device"}
                                            {pk.backedUp ? " · backed up" : ""}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            isDisabled={busy}
                                            onPress={() => void renamePasskey(pk.id, pk.name ?? label)}
                                        >
                                            Rename
                                        </Button>
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            isDisabled={busy}
                                            onPress={() => void removePasskey(pk.id)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}

                <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={(e) => void addPasskey(e)}>
                    <Input
                        label="Name (optional)"
                        name="passkeyName"
                        value={passkeyName}
                        onChange={setPasskeyName}
                        placeholder="MacBook Touch ID"
                        className="flex-1"
                    />
                    <Button type="submit" color="primary" size="md" isDisabled={busy} isLoading={busy}>
                        Add passkey
                    </Button>
                </form>
            </section>
        </div>
    );
}
