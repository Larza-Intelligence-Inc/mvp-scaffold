"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { authClient } from "@/lib/auth-client";
import {
    ORG_ROLE_OPTIONS,
    PERMISSION_MATRIX,
    roleHasPermission,
    statement,
    type OrgRole,
} from "@/lib/auth-permissions";

type CustomRole = {
    id: string;
    role: string;
    permission: string | Record<string, string[]>;
};

function parsePermission(raw: string | Record<string, string[]>): Record<string, string[]> {
    if (typeof raw === "object" && raw !== null) return raw;
    try {
        return JSON.parse(raw) as Record<string, string[]>;
    } catch {
        return {};
    }
}

export default function RolesPage() {
    const { data: session } = authClient.useSession();
    const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
    const [roleName, setRoleName] = useState("");
    const [selectedActions, setSelectedActions] = useState<Record<string, Set<string>>>({});
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [canCreate, setCanCreate] = useState(false);
    const [canDelete, setCanDelete] = useState(false);
    const [canRead, setCanRead] = useState(false);
    const [myPermissions, setMyPermissions] = useState<Record<string, boolean>>({});

    const activeOrgId = session?.session.activeOrganizationId ?? null;

    const allPermissionKeys = useMemo(() => {
        const keys: { resource: string; action: string; key: string }[] = [];
        for (const row of PERMISSION_MATRIX) {
            for (const action of row.actions) {
                keys.push({
                    resource: row.resource,
                    action,
                    key: `${row.resource}:${action}`,
                });
            }
        }
        return keys;
    }, []);

    const refreshRoles = useCallback(async () => {
        if (!activeOrgId) {
            setCustomRoles([]);
            return;
        }
        const { data, error: listError } = await authClient.organization.listRoles({
            query: { organizationId: activeOrgId },
        });
        if (listError) {
            // Members without ac:read may not list roles — that's fine.
            setCustomRoles([]);
            return;
        }
        setCustomRoles((data as CustomRole[]) ?? []);
    }, [activeOrgId]);

    const refreshPermissions = useCallback(async () => {
        if (!activeOrgId) {
            setCanCreate(false);
            setCanDelete(false);
            setCanRead(false);
            setMyPermissions({});
            return;
        }
        const checks = await Promise.all(
            allPermissionKeys.map(async ({ resource, action, key }) => {
                const res = await authClient.organization.hasPermission({
                    permissions: { [resource]: [action] },
                    organizationId: activeOrgId,
                });
                return [key, Boolean(res.data?.success)] as const;
            }),
        );
        const map: Record<string, boolean> = {};
        for (const [key, ok] of checks) map[key] = ok;
        setMyPermissions(map);
        setCanCreate(Boolean(map["ac:create"]));
        setCanDelete(Boolean(map["ac:delete"]));
        setCanRead(Boolean(map["ac:read"]));
    }, [activeOrgId, allPermissionKeys]);

    useEffect(() => {
        void refreshRoles();
        void refreshPermissions();
    }, [refreshRoles, refreshPermissions]);

    function toggleAction(resource: string, action: string) {
        setSelectedActions((prev) => {
            const next = { ...prev };
            const set = new Set(next[resource] ?? []);
            if (set.has(action)) set.delete(action);
            else set.add(action);
            next[resource] = set;
            return next;
        });
    }

    async function createRole(e: React.FormEvent) {
        e.preventDefault();
        if (!activeOrgId) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        const permission: Record<string, string[]> = {};
        for (const [resource, actions] of Object.entries(selectedActions)) {
            if (actions.size > 0) permission[resource] = [...actions];
        }
        if (Object.keys(permission).length === 0) {
            setBusy(false);
            setError("Select at least one permission");
            return;
        }
        const { error: createError } = await authClient.organization.createRole({
            role: roleName.trim().toLowerCase(),
            permission,
            organizationId: activeOrgId,
        });
        setBusy(false);
        if (createError) {
            setError(createError.message ?? "Could not create role");
            return;
        }
        setRoleName("");
        setSelectedActions({});
        setMessage("Custom role created");
        await refreshRoles();
    }

    async function deleteRole(roleId: string) {
        if (!window.confirm("Delete this custom role?")) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: deleteError } = await authClient.organization.deleteRole({
            roleId,
            organizationId: activeOrgId ?? undefined,
        });
        setBusy(false);
        if (deleteError) {
            setError(deleteError.message ?? "Could not delete role");
            return;
        }
        setMessage("Role deleted");
        await refreshRoles();
    }

    return (
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
            {message ? <p className="text-sm text-success-primary">{message}</p> : null}
            {error ? <p className="text-sm text-error-primary">{error}</p> : null}

            {!activeOrgId ? (
                <p className="text-sm text-tertiary">
                    Set an active organization on the Organizations page before managing roles.
                </p>
            ) : null}

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Your permissions</h2>
                    <p className="text-sm text-tertiary">
                        Live checks via Better Auth <span className="font-mono">hasPermission</span> for the active org.
                    </p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-secondary text-tertiary">
                                <th className="py-2 pr-4 font-medium">Resource</th>
                                <th className="py-2 pr-4 font-medium">Action</th>
                                <th className="py-2 font-medium">Allowed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allPermissionKeys.map(({ resource, action, key }) => (
                                <tr key={key} className="border-b border-secondary/60">
                                    <td className="py-2 pr-4 font-mono text-primary">{resource}</td>
                                    <td className="py-2 pr-4 font-mono text-secondary">{action}</td>
                                    <td className="py-2">
                                        {myPermissions[key] ? (
                                            <span className="text-success-primary">Yes</span>
                                        ) : (
                                            <span className="text-tertiary">No</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Built-in roles</h2>
                    <p className="text-sm text-tertiary">Static roles shipped with the organization plugin.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-secondary text-tertiary">
                                <th className="py-2 pr-3 font-medium">Permission</th>
                                {ORG_ROLE_OPTIONS.map((r) => (
                                    <th key={r.value} className="py-2 px-2 font-medium capitalize">
                                        {r.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {PERMISSION_MATRIX.flatMap((row) =>
                                row.actions.map((action) => (
                                    <tr key={`${row.resource}:${action}`} className="border-b border-secondary/60">
                                        <td className="py-2 pr-3 font-mono text-primary">
                                            {row.resource}:{action}
                                        </td>
                                        {ORG_ROLE_OPTIONS.map((r) => (
                                            <td key={r.value} className="py-2 px-2 text-center">
                                                {roleHasPermission(r.value as OrgRole, row.resource, action) ? (
                                                    <span className="text-success-primary">✓</span>
                                                ) : (
                                                    <span className="text-quaternary">—</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                )),
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Custom roles</h2>
                    <p className="text-sm text-tertiary">
                        Dynamic access control — create org-specific roles beyond owner/admin/member.
                    </p>
                </div>

                {!canRead && activeOrgId ? (
                    <p className="text-sm text-tertiary">Your role cannot read custom roles (needs ac:read).</p>
                ) : null}

                {customRoles.length === 0 ? (
                    <p className="text-md text-tertiary">No custom roles yet.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {customRoles.map((role) => {
                            const perms = parsePermission(role.permission);
                            return (
                                <li
                                    key={role.id}
                                    className="flex flex-col gap-2 rounded-xl bg-secondary px-4 py-3 ring-1 ring-secondary sm:flex-row sm:items-start sm:justify-between"
                                >
                                    <div>
                                        <p className="font-medium capitalize text-primary">{role.role}</p>
                                        <p className="mt-1 font-mono text-sm text-tertiary">
                                            {Object.entries(perms)
                                                .map(([res, acts]) => `${res}:[${acts.join(", ")}]`)
                                                .join(" · ") || "No permissions"}
                                        </p>
                                    </div>
                                    {canDelete ? (
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            isDisabled={busy}
                                            onPress={() => void deleteRole(role.id)}
                                        >
                                            Delete
                                        </Button>
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                )}

                {canCreate ? (
                    <form className="flex flex-col gap-4 border-t border-secondary pt-4" onSubmit={(e) => void createRole(e)}>
                        <Input
                            isRequired
                            label="Role name"
                            name="roleName"
                            value={roleName}
                            onChange={setRoleName}
                            placeholder="moderator"
                        />
                        <div className="flex flex-col gap-3">
                            <p className="text-sm font-medium text-secondary">Permissions</p>
                            {(Object.keys(statement) as (keyof typeof statement)[]).map((resource) => (
                                <div key={resource} className="flex flex-col gap-2">
                                    <p className="font-mono text-sm text-primary">{resource}</p>
                                    <div className="flex flex-wrap gap-3">
                                        {statement[resource].map((action) => {
                                            const checked = selectedActions[resource]?.has(action) ?? false;
                                            return (
                                                <label
                                                    key={action}
                                                    className="flex cursor-pointer items-center gap-2 text-sm text-secondary"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleAction(resource, action)}
                                                        className="size-4 rounded border-primary"
                                                    />
                                                    {action}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="submit"
                            color="primary"
                            size="md"
                            isDisabled={busy || !roleName.trim()}
                            isLoading={busy}
                            className="self-start"
                        >
                            Create role
                        </Button>
                    </form>
                ) : activeOrgId ? (
                    <p className="text-sm text-tertiary">Your role cannot create custom roles (needs ac:create).</p>
                ) : null}
            </section>
        </div>
    );
}
