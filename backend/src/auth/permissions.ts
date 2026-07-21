import { createAccessControl } from 'better-auth/plugins/access'
import {
  defaultStatements,
  adminAc,
  ownerAc,
  memberAc,
} from 'better-auth/plugins/organization/access'

/**
 * Organization access-control statements.
 * Kept in sync with `frontend/lib/auth-permissions.ts`.
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

/** Human-readable permission matrix for the Roles UI. */
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
