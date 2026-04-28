import type { User } from '@bowtie/shared';

export const SEED_USERS: User[] = [
  { id: 'u-rm-001', name: 'Erin Walsh', email: 'erin.walsh@example.com', role: 'risk_manager', initials: 'EW' },
  { id: 'u-bo-001', name: 'Marcus Reed', email: 'marcus.reed@example.com', role: 'barrier_owner', initials: 'MR' },
  { id: 'u-bo-002', name: 'Priya Shah', email: 'priya.shah@example.com', role: 'barrier_owner', initials: 'PS' },
  { id: 'u-bo-003', name: 'Lisa Chen', email: 'lisa.chen@example.com', role: 'barrier_owner', initials: 'LC' },
  { id: 'u-ap-001', name: 'David Kim', email: 'david.kim@example.com', role: 'approver', initials: 'DK' },
  { id: 'u-au-001', name: 'Sam Foster', email: 'sam.foster@example.com', role: 'auditor', initials: 'SF' },
];

export const DEFAULT_USER_ID = 'u-rm-001';
