import { createAccessControl } from 'better-auth/plugins/access'
import {
  defaultStatements,
  adminAc,
  ownerAc,
  memberAc,
} from 'better-auth/plugins/organization/access'

/**
 * Organization access-control statements.
 * Kept in sync with `backend/src/auth/permissions.ts`.
 */
export const statement = {
  ...defaultStatements,
} as const

export const ac = createAccessControl(statement)

export const owner = ac.newRole({
  ...ownerAc.statements,
})

export const admin = ac.newRole({
  ...adminAc.statements,
})

export const member = ac.newRole({
  ...memberAc.statements,
})

export const roles = {
  owner,
  admin,
  member,
} as const

export type OrgRole = keyof typeof roles

export const ORG_ROLE_OPTIONS: { value: OrgRole; label: string }[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
]

export const PERMISSION_MATRIX: {
  resource: keyof typeof statement
  actions: readonly string[]
}[] = [
  { resource: 'organization', actions: statement.organization },
  { resource: 'member', actions: statement.member },
  { resource: 'invitation', actions: statement.invitation },
  { resource: 'team', actions: statement.team },
  { resource: 'ac', actions: statement.ac },
]

export function roleHasPermission(
  role: string,
  resource: keyof typeof statement,
  action: string,
): boolean {
  const predefined = roles[role as OrgRole]
  if (!predefined) return false
  const allowed = (predefined.statements as unknown as Record<string, readonly string[]>)[
    resource
  ] ?? []
  return allowed.includes(action)
}
