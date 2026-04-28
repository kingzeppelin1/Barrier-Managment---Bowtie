import type { Role } from '@bowtie/shared';

/**
 * Demo-only RBAC matrix. Mirrors docs/03_WORKFLOWS_AND_VALIDATION.md §3 in
 * shape but is intentionally simpler — there is no real auth, so this is
 * used only to gate UI visibility (buttons, edit affordances).
 *
 * The Auditor persona is read-only across the board.
 */

export type Permission =
  | 'bowtie:create'
  | 'bowtie:edit'
  | 'bowtie:submit_for_review'
  | 'bowtie:advance_review'
  | 'bowtie:approve'
  | 'bowtie:publish'
  | 'bowtie:archive'
  | 'barrier:edit'
  | 'barrier:assign_owner'
  | 'risk:edit'
  | 'risk:accept'
  | 'action:create'
  | 'action:close'
  | 'verification:record'
  | 'incident:create'
  | 'moc:create'
  | 'audit:record_findings'
  | 'ai_suggestion:review'
  | 'settings:edit_tenant'
  | 'demo:reset';

const RISK_MANAGER: Permission[] = [
  'bowtie:create',
  'bowtie:edit',
  'bowtie:submit_for_review',
  'bowtie:advance_review',
  'bowtie:archive',
  'barrier:edit',
  'barrier:assign_owner',
  'risk:edit',
  'risk:accept',
  'action:create',
  'action:close',
  'verification:record',
  'incident:create',
  'moc:create',
  'ai_suggestion:review',
  'settings:edit_tenant',
  'demo:reset',
];

const BARRIER_OWNER: Permission[] = [
  'bowtie:edit',
  'barrier:edit',
  'action:create',
  'action:close',
  'verification:record',
  'incident:create',
  'ai_suggestion:review',
  'demo:reset',
];

const APPROVER: Permission[] = [
  'bowtie:advance_review',
  'bowtie:approve',
  'bowtie:publish',
  'risk:accept',
  'ai_suggestion:review',
  'demo:reset',
];

const AUDITOR: Permission[] = [
  'audit:record_findings',
  // Read-only otherwise.
];

const PERMISSIONS: Record<Role, Permission[]> = {
  risk_manager: RISK_MANAGER,
  barrier_owner: BARRIER_OWNER,
  approver: APPROVER,
  auditor: AUDITOR,
};

export function can(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isReadOnly(role: Role): boolean {
  return role === 'auditor';
}

export const ROLE_LABEL: Record<Role, string> = {
  risk_manager: 'Risk Manager',
  barrier_owner: 'Barrier Owner',
  approver: 'Approver',
  auditor: 'Auditor (read-only)',
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  risk_manager: 'Owns risk register, drives bowtie reviews, accepts ALARP.',
  barrier_owner: 'Maintains barriers, records verifications, raises actions.',
  approver: 'Advances bowties through review and signs off approval / publish.',
  auditor: 'Independent review — read-only across the platform.',
};
