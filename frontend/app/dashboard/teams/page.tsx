"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/application/native-select";
import { authClient } from "@/lib/auth-client";

type TeamRow = {
    id: string;
    name: string;
    organizationId: string;
};

type MemberRow = {
    id: string;
    userId: string;
    role: string;
    user?: {
        id?: string;
        name?: string;
        email?: string;
    };
};

type TeamMemberRow = {
    id?: string;
    teamId?: string;
    userId: string;
    user?: {
        id?: string;
        name?: string;
        email?: string;
    };
};

export default function TeamsPage() {
    const { data: session } = authClient.useSession();
    const [teams, setTeams] = useState<TeamRow[]>([]);
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string>("");
    const [teamMembers, setTeamMembers] = useState<TeamMemberRow[]>([]);
    const [teamName, setTeamName] = useState("");
    const [addUserId, setAddUserId] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [canCreate, setCanCreate] = useState(false);
    const [canUpdate, setCanUpdate] = useState(false);
    const [canDelete, setCanDelete] = useState(false);

    const activeOrgId = session?.session.activeOrganizationId ?? null;
    const currentUserId = session?.user.id ?? null;
    const activeTeamId =
        (session?.session as { activeTeamId?: string | null } | undefined)?.activeTeamId ?? null;

    const memberOptions = useMemo(() => {
        const onTeam = new Set(teamMembers.map((tm) => tm.userId));
        return members
            .filter((m) => !onTeam.has(m.userId))
            .map((m) => ({
                value: m.userId,
                label: m.user?.name || m.user?.email || m.userId,
            }));
    }, [members, teamMembers]);

    const refreshTeams = useCallback(async () => {
        if (!activeOrgId) {
            setTeams([]);
            return;
        }
        const { data, error: listError } = await authClient.organization.listTeams({
            query: { organizationId: activeOrgId },
        });
        if (listError) {
            setError(listError.message ?? "Could not load teams");
            return;
        }
        const list = (data as TeamRow[]) ?? [];
        setTeams(list);
        setSelectedTeamId((current) => {
            if (current && list.some((t) => t.id === current)) return current;
            return list[0]?.id ?? "";
        });
    }, [activeOrgId]);

    const refreshOrgMembers = useCallback(async () => {
        if (!activeOrgId) {
            setMembers([]);
            return;
        }
        const { data, error: membersError } = await authClient.organization.listMembers({
            query: { organizationId: activeOrgId },
        });
        if (membersError) {
            setError(membersError.message ?? "Could not load members");
            return;
        }
        const payload = data as { members?: MemberRow[] } | MemberRow[] | null;
        setMembers(Array.isArray(payload) ? payload : (payload?.members ?? []));
    }, [activeOrgId]);

    const refreshTeamMembers = useCallback(async () => {
        if (!selectedTeamId || !currentUserId) {
            setTeamMembers([]);
            return;
        }
        const { data, error: tmError } = await authClient.organization.listTeamMembers({
            query: { teamId: selectedTeamId },
        });
        if (tmError) {
            // Better Auth only lists members if the current user is already on the team.
            // Admins/owners with team:update can join so they can manage membership.
            if (canUpdate) {
                const { error: joinError } = await authClient.organization.addTeamMember({
                    teamId: selectedTeamId,
                    userId: currentUserId,
                    organizationId: activeOrgId ?? undefined,
                });
                if (!joinError) {
                    const retry = await authClient.organization.listTeamMembers({
                        query: { teamId: selectedTeamId },
                    });
                    if (!retry.error) {
                        setTeamMembers((retry.data as TeamMemberRow[]) ?? []);
                        return;
                    }
                }
            }
            setError(tmError.message ?? "Could not load team members");
            setTeamMembers([]);
            return;
        }
        setTeamMembers((data as TeamMemberRow[]) ?? []);
    }, [selectedTeamId, currentUserId, canUpdate, activeOrgId]);

    const refreshPermissions = useCallback(async () => {
        if (!activeOrgId) {
            setCanCreate(false);
            setCanUpdate(false);
            setCanDelete(false);
            return;
        }
        const [create, update, remove] = await Promise.all([
            authClient.organization.hasPermission({
                permissions: { team: ["create"] },
                organizationId: activeOrgId,
            }),
            authClient.organization.hasPermission({
                permissions: { team: ["update"] },
                organizationId: activeOrgId,
            }),
            authClient.organization.hasPermission({
                permissions: { team: ["delete"] },
                organizationId: activeOrgId,
            }),
        ]);
        setCanCreate(Boolean(create.data?.success));
        setCanUpdate(Boolean(update.data?.success));
        setCanDelete(Boolean(remove.data?.success));
    }, [activeOrgId]);

    useEffect(() => {
        void refreshTeams();
        void refreshOrgMembers();
        void refreshPermissions();
    }, [refreshTeams, refreshOrgMembers, refreshPermissions]);

    useEffect(() => {
        void refreshTeamMembers();
    }, [refreshTeamMembers]);

    async function createTeam(e: React.FormEvent) {
        e.preventDefault();
        if (!activeOrgId || !currentUserId) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        const { data, error: createError } = await authClient.organization.createTeam({
            name: teamName.trim(),
            organizationId: activeOrgId,
        });
        if (createError) {
            setBusy(false);
            setError(createError.message ?? "Could not create team");
            return;
        }
        const createdId = (data as TeamRow | null)?.id;
        if (createdId) {
            // Creator is not auto-added for non-default teams; add so listTeamMembers works.
            await authClient.organization.addTeamMember({
                teamId: createdId,
                userId: currentUserId,
                organizationId: activeOrgId,
            });
            setSelectedTeamId(createdId);
        }
        setBusy(false);
        setTeamName("");
        setMessage("Team created");
        await refreshTeams();
    }

    async function deleteTeam(teamId: string) {
        if (!window.confirm("Delete this team?")) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: deleteError } = await authClient.organization.removeTeam({
            teamId,
            organizationId: activeOrgId ?? undefined,
        });
        setBusy(false);
        if (deleteError) {
            setError(deleteError.message ?? "Could not delete team");
            return;
        }
        setMessage("Team deleted");
        if (selectedTeamId === teamId) setSelectedTeamId("");
        await refreshTeams();
    }

    async function setActiveTeam(teamId: string) {
        setBusy(true);
        setError(null);
        const { error: activeError } = await authClient.organization.setActiveTeam({ teamId });
        setBusy(false);
        if (activeError) {
            setError(activeError.message ?? "Could not set active team");
            return;
        }
        setMessage("Active team updated");
        setSelectedTeamId(teamId);
    }

    async function addMemberToTeam(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedTeamId || !addUserId) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: addError } = await authClient.organization.addTeamMember({
            teamId: selectedTeamId,
            userId: addUserId,
            organizationId: activeOrgId ?? undefined,
        });
        setBusy(false);
        if (addError) {
            setError(addError.message ?? "Could not add team member");
            return;
        }
        setAddUserId("");
        setMessage("Member added to team");
        await refreshTeamMembers();
    }

    async function removeFromTeam(userId: string) {
        if (!selectedTeamId) return;
        setBusy(true);
        setError(null);
        setMessage(null);
        const { error: removeError } = await authClient.organization.removeTeamMember({
            teamId: selectedTeamId,
            userId,
            organizationId: activeOrgId ?? undefined,
        });
        setBusy(false);
        if (removeError) {
            setError(removeError.message ?? "Could not remove team member");
            return;
        }
        setMessage("Member removed from team");
        await refreshTeamMembers();
    }

    const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
            {message ? <p className="text-sm text-success-primary">{message}</p> : null}
            {error ? <p className="text-sm text-error-primary">{error}</p> : null}

            {!activeOrgId ? (
                <p className="text-sm text-tertiary">
                    Set an active organization on the Organizations page before managing teams.
                </p>
            ) : null}

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Teams</h2>
                    <p className="text-sm text-tertiary">Sub-groups within the active organization.</p>
                </div>
                {teams.length === 0 ? (
                    <p className="text-md text-tertiary">No teams yet.</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {teams.map((team) => (
                            <li
                                key={team.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3 ring-1 ring-secondary"
                            >
                                <button
                                    type="button"
                                    className="text-left"
                                    onClick={() => setSelectedTeamId(team.id)}
                                >
                                    <p className="font-medium text-primary">{team.name}</p>
                                    <p className="text-sm text-tertiary">
                                        {team.id === selectedTeamId ? "Selected" : "Select"}
                                        {team.id === activeTeamId ? " · Active session team" : ""}
                                    </p>
                                </button>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        color="secondary"
                                        size="sm"
                                        isDisabled={busy || team.id === activeTeamId}
                                        onPress={() => void setActiveTeam(team.id)}
                                    >
                                        Set active
                                    </Button>
                                    {canDelete ? (
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            isDisabled={busy}
                                            onPress={() => void deleteTeam(team.id)}
                                        >
                                            Delete
                                        </Button>
                                    ) : null}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-medium tracking-tight text-primary">Create team</h2>
                </div>
                <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={(e) => void createTeam(e)}>
                    <Input
                        isRequired
                        label="Team name"
                        name="teamName"
                        value={teamName}
                        onChange={setTeamName}
                        placeholder="Engineering"
                        className="flex-1"
                        isDisabled={!activeOrgId || !canCreate}
                    />
                    <Button
                        type="submit"
                        color="primary"
                        size="md"
                        isDisabled={busy || !activeOrgId || !canCreate || !teamName.trim()}
                        isLoading={busy}
                    >
                        Create
                    </Button>
                </form>
                {!canCreate && activeOrgId ? (
                    <p className="text-sm text-tertiary">Your role cannot create teams.</p>
                ) : null}
            </section>

            {selectedTeam ? (
                <section className="flex flex-col gap-4 rounded-2xl bg-primary p-4 shadow-sm ring-1 ring-secondary sm:p-6">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-display text-xl font-medium tracking-tight text-primary">
                            {selectedTeam.name} members
                        </h2>
                        <p className="text-sm text-tertiary">Org members must be added to the team explicitly.</p>
                    </div>

                    {teamMembers.length === 0 ? (
                        <p className="text-md text-tertiary">No members on this team yet.</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {teamMembers.map((tm) => (
                                <li
                                    key={tm.userId}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary px-4 py-3 ring-1 ring-secondary"
                                >
                                    <div>
                                        <p className="font-medium text-primary">
                                            {tm.user?.name || tm.user?.email || tm.userId}
                                        </p>
                                        <p className="font-mono text-sm text-tertiary">{tm.user?.email ?? tm.userId}</p>
                                    </div>
                                    {canUpdate ? (
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            isDisabled={busy}
                                            onPress={() => void removeFromTeam(tm.userId)}
                                        >
                                            Remove
                                        </Button>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    )}

                    {canUpdate ? (
                        <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={(e) => void addMemberToTeam(e)}>
                            <NativeSelect
                                label="Add org member"
                                value={addUserId}
                                onChange={setAddUserId}
                                options={memberOptions}
                                placeholder={memberOptions.length ? "Select member" : "No members available"}
                                isDisabled={busy || memberOptions.length === 0}
                                className="flex-1"
                            />
                            <Button
                                type="submit"
                                color="secondary"
                                size="md"
                                isDisabled={busy || !addUserId}
                                isLoading={busy}
                            >
                                Add
                            </Button>
                        </form>
                    ) : null}
                </section>
            ) : null}
        </div>
    );
}
