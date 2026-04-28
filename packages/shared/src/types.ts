import { z } from 'zod';

/**
 * Demo-only domain schemas for the Bowtie SaaS module.
 * Methodology terminology and structural rules align with CLAUDE.md and
 * docs/03_WORKFLOWS_AND_VALIDATION.md, even though storage is in-memory.
 */

// -- Roles & RBAC ----------------------------------------------------------

export const RoleSchema = z.enum(['risk_manager', 'barrier_owner', 'approver', 'auditor']);
export type Role = z.infer<typeof RoleSchema>;

// -- Approval lifecycle (six stages — never skip) --------------------------

export const ApprovalStateSchema = z.enum([
  'draft',
  'internal_review',
  'sme_review',
  'risk_manager_review',
  'approved',
  'published',
]);
export type ApprovalState = z.infer<typeof ApprovalStateSchema>;

// -- Status & health -------------------------------------------------------

export const HealthStatusSchema = z.enum(['green', 'yellow', 'red', 'gray']);
export type HealthStatus = z.infer<typeof HealthStatusSchema>;

export const CriticalitySchema = z.enum(['critical', 'high', 'medium', 'low']);
export type Criticality = z.infer<typeof CriticalitySchema>;

// -- Barriers --------------------------------------------------------------

export const BarrierTypeSchema = z.enum([
  'preventive',
  'mitigative',
  'recovery',
  'control',
]);
export type BarrierType = z.infer<typeof BarrierTypeSchema>;

export const BarrierFunctionSchema = z.enum([
  'hardware',
  'human',
  'organizational',
  'procedural',
  'instrumented',
]);
export type BarrierFunction = z.infer<typeof BarrierFunctionSchema>;

export const GapRecordSchema = z.object({
  ownerId: z.string(),
  targetResolutionDate: z.string(),
  linkedActionId: z.string().nullable(),
  notes: z.string().optional(),
});
export type GapRecord = z.infer<typeof GapRecordSchema>;

export const BarrierSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  bowtieIds: z.array(z.string()),
  name: z.string(),
  type: BarrierTypeSchema,
  function: BarrierFunctionSchema,
  criticality: CriticalitySchema,
  ownerId: z.string().nullable(),
  description: z.string().optional(),
  performanceStandardId: z.string().nullable(),
  healthScore: z.number().min(0).max(100), // canonical 0–100 metric
  status: HealthStatusSchema,
  /** Compensated red stays red — never auto-promoted. */
  withCompensatory: z.boolean().default(false),
  compensatoryNotes: z.string().optional(),
  lastVerifiedAt: z.string().nullable(),
  nextVerificationDue: z.string().nullable(),
  failedTests: z.number().default(0),
  openCriticalFindings: z.number().default(0),
  evidenceUrl: z.string().nullable().optional(),
  /** AI origin tracking — blocks approval gate while reviewer_decision is null. */
  aiOriginSuggestionId: z.string().nullable().default(null),
  /** Documented-gap pattern: required when something is intentionally missing. */
  gapRecord: GapRecordSchema.nullable().default(null),
});
export type Barrier = z.infer<typeof BarrierSchema>;

// -- Degradation Factor / Degradation Control ------------------------------
// Never "Escalation Factor" / "EFB". This is intentional and load-bearing.

export const DegradationFactorSchema = z.object({
  id: z.string(),
  barrierId: z.string(),
  description: z.string(),
  /** A DF must have one or more Degradation Controls to be valid. */
  degradationControlIds: z.array(z.string()),
  aiOriginSuggestionId: z.string().nullable().default(null),
});
export type DegradationFactor = z.infer<typeof DegradationFactorSchema>;

export const DegradationControlSchema = z.object({
  id: z.string(),
  degradationFactorId: z.string(),
  name: z.string(),
  function: BarrierFunctionSchema,
  ownerId: z.string().nullable(),
  status: HealthStatusSchema,
  aiOriginSuggestionId: z.string().nullable().default(null),
});
export type DegradationControl = z.infer<typeof DegradationControlSchema>;

// -- Threats & Consequences ------------------------------------------------

export const ThreatSchema = z.object({
  id: z.string(),
  bowtieId: z.string(),
  description: z.string(),
  /** Ordered chain of barrier IDs between threat and Top Event. */
  preventiveBarrierIds: z.array(z.string()),
});
export type Threat = z.infer<typeof ThreatSchema>;

export const ConsequenceSchema = z.object({
  id: z.string(),
  bowtieId: z.string(),
  description: z.string(),
  severity: z.enum(['catastrophic', 'major', 'moderate', 'minor', 'negligible']),
  mitigativeBarrierIds: z.array(z.string()),
});
export type Consequence = z.infer<typeof ConsequenceSchema>;

// -- Bowtie ---------------------------------------------------------------

export const BowtieSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  title: z.string(),
  hazard: z.string(),
  topEvent: z.string(),
  assetOrProcess: z.string(),
  ownerId: z.string(),
  approvalState: ApprovalStateSchema,
  /** Four-level risk — never two-level shortcut. */
  riskBeforeBarriers: z.number(), // inherent
  riskCurrent: z.number(),
  riskAfterBarriers: z.number(), // residual
  riskTarget: z.number(),
  threatIds: z.array(z.string()),
  consequenceIds: z.array(z.string()),
  preventiveBarrierIds: z.array(z.string()),
  mitigativeBarrierIds: z.array(z.string()),
  lastRevisedAt: z.string(),
  nextReviewDue: z.string(),
  /** True if a published Bowtie has open changes pending an MOC link. */
  changesPendingMoc: z.boolean().default(false),
  publishedAt: z.string().nullable().default(null),
  /** Soft-archive — hidden from default lists. Pattern from CLAUDE.md §4.4. */
  archivedAt: z.string().nullable().optional(),
});
export type Bowtie = z.infer<typeof BowtieSchema>;

// -- Risks ----------------------------------------------------------------

export const RiskSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  title: z.string(),
  category: z.enum(['safety', 'environmental', 'asset', 'reputation', 'financial', 'patient_safety']),
  inherentRisk: z.number(),
  currentRisk: z.number(),
  residualRisk: z.number(),
  targetRisk: z.number(),
  ownerId: z.string(),
  bowtieIds: z.array(z.string()),
  treatmentPlan: z.string(),
  acceptanceStatus: z.enum(['accepted', 'alarp_justified', 'pending', 'unacceptable']),
});
export type Risk = z.infer<typeof RiskSchema>;

// -- Actions --------------------------------------------------------------

export const ActionSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  title: z.string(),
  source: z.enum(['audit', 'incident', 'verification', 'review', 'ai_suggestion', 'moc']),
  bowtieId: z.string().nullable(),
  barrierId: z.string().nullable(),
  ownerId: z.string(),
  dueDate: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  status: z.enum(['open', 'in_progress', 'pending_review', 'closed', 'overdue']),
  evidence: z.string().nullable(),
  effectivenessReview: z.string().nullable(),
});
export type Action = z.infer<typeof ActionSchema>;

// -- Verifications --------------------------------------------------------

export const VerificationSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  date: z.string(),
  barrierId: z.string(),
  performedById: z.string(),
  method: z.enum(['inspection', 'test', 'drill', 'audit', 'document_review']),
  result: z.enum(['pass', 'fail', 'partial', 'inconclusive']),
  evidence: z.string().nullable(),
  nextDue: z.string(),
  comments: z.string().optional(),
});
export type Verification = z.infer<typeof VerificationSchema>;

// -- Performance Standards ------------------------------------------------

export const PerformanceStandardSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  name: z.string(),
  category: z.enum(['functionality', 'availability', 'reliability', 'survivability', 'response_time']),
  applicableBarrierIds: z.array(z.string()),
  criteria: z.string(),
  source: z.string(),
  version: z.string(),
  effectiveDate: z.string(),
});
export type PerformanceStandard = z.infer<typeof PerformanceStandardSchema>;

// -- Incidents ------------------------------------------------------------

export const IncidentSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  title: z.string(),
  date: z.string(),
  severity: z.enum(['catastrophic', 'major', 'moderate', 'minor', 'near_miss']),
  description: z.string(),
  bowtieId: z.string().nullable(),
  barrierFailures: z.array(z.string()),
  learnings: z.string(),
  linkedActionIds: z.array(z.string()),
});
export type Incident = z.infer<typeof IncidentSchema>;

// -- MOC ------------------------------------------------------------------

export const MocSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  title: z.string(),
  changeType: z.enum(['process', 'organizational', 'technology', 'procedure']),
  status: z.enum(['proposed', 'in_review', 'approved', 'implemented', 'closed']),
  affectedBowtieIds: z.array(z.string()),
  affectedBarrierIds: z.array(z.string()),
  initiatedAt: z.string(),
  ownerId: z.string(),
  riskAssessmentSummary: z.string(),
});
export type Moc = z.infer<typeof MocSchema>;

// -- Audits ---------------------------------------------------------------

export const AuditSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  title: z.string(),
  scope: z.string(),
  date: z.string(),
  auditorId: z.string(),
  findings: z.number(),
  status: z.enum(['planned', 'in_progress', 'reporting', 'closed']),
});
export type Audit = z.infer<typeof AuditSchema>;

// -- Templates ------------------------------------------------------------

export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string(),
  description: z.string(),
  hazard: z.string(),
  topEvent: z.string(),
  threatCount: z.number(),
  consequenceCount: z.number(),
  barrierCount: z.number(),
});
export type Template = z.infer<typeof TemplateSchema>;

// -- AI suggestions -------------------------------------------------------
// Canonical 6-field schema (07_AI_AGENT.md §4) adapted for the demo.

/**
 * Coach-rule category — the kind of methodology check that produced this
 * suggestion. Optional for backward compatibility with seed data that
 * predates the AI Coach (Slice 10).
 */
export const AiSuggestionCategorySchema = z.enum([
  'missing_barrier',
  'top_event_quality',
  'barrier_independence',
  'risk_acceptance_warning',
  'suggest_df',
  'suggest_ps',
  'stale_verification',
  'insufficient_diversity',
]);
export type AiSuggestionCategory = z.infer<typeof AiSuggestionCategorySchema>;

export const AiSuggestionSchema = z.object({
  id: z.string(),
  promptHash: z.string(),
  modelId: z.string(),
  /** Bowtie this suggestion is scoped to (when applicable). */
  bowtieId: z.string().nullable().optional(),
  /** Coach-rule category (optional for legacy seed entries). */
  category: AiSuggestionCategorySchema.optional(),
  context: z.object({
    type: z.enum(['barrier', 'top_event', 'threat', 'consequence', 'risk_acceptance', 'degradation_factor', 'performance_standard']),
    targetId: z.string().nullable(),
  }),
  /** The 6 canonical fields. */
  output: z.object({
    title: z.string(),
    rationale: z.string(),
    suggested: z.string(),
    confidence: z.enum(['low', 'medium', 'high']),
    severity: z.enum(['info', 'warning', 'blocker']),
    citations: z.array(z.string()),
  }),
  reviewerDecision: z.enum(['accepted', 'rejected']).nullable(),
  reviewerId: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  rejectionReason: z.string().nullable().optional(),
  createdAt: z.string(),
});
export type AiSuggestion = z.infer<typeof AiSuggestionSchema>;

// -- Users ----------------------------------------------------------------

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: RoleSchema,
  initials: z.string(),
});
export type User = z.infer<typeof UserSchema>;

// -- Scenario container ---------------------------------------------------

export const ScenarioSchema = z.object({
  id: z.string(),
  industry: z.enum(['offshore_oil', 'chemical_plant', 'hospital']),
  name: z.string(),
  description: z.string(),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

// -- Wizard draft (Builder Wizard) ----------------------------------------
// Persisted alongside DemoState so unfinished bowties survive reloads.

export const WizardSeveritySchema = z.enum(['catastrophic', 'major', 'moderate', 'minor', 'negligible']);

export const WizardThreatDraftSchema = z.object({
  draftId: z.string(),
  description: z.string(),
  preventiveBarrierDraftIds: z.array(z.string()),
});
export type WizardThreatDraft = z.infer<typeof WizardThreatDraftSchema>;

export const WizardConsequenceDraftSchema = z.object({
  draftId: z.string(),
  description: z.string(),
  severity: WizardSeveritySchema,
  mitigativeBarrierDraftIds: z.array(z.string()),
});
export type WizardConsequenceDraft = z.infer<typeof WizardConsequenceDraftSchema>;

export const WizardBarrierDraftSchema = z.object({
  draftId: z.string(),
  name: z.string(),
  type: BarrierTypeSchema,
  function: BarrierFunctionSchema,
  criticality: CriticalitySchema,
  ownerId: z.string().nullable(),
  performanceStandardId: z.string().nullable(),
});
export type WizardBarrierDraft = z.infer<typeof WizardBarrierDraftSchema>;

export const WizardDegradationFactorDraftSchema = z.object({
  draftId: z.string(),
  barrierDraftId: z.string(),
  description: z.string(),
});
export type WizardDegradationFactorDraft = z.infer<typeof WizardDegradationFactorDraftSchema>;

export const WizardDegradationControlDraftSchema = z.object({
  draftId: z.string(),
  factorDraftId: z.string(),
  name: z.string(),
});
export type WizardDegradationControlDraft = z.infer<typeof WizardDegradationControlDraftSchema>;

export const WizardActionDraftSchema = z.object({
  draftId: z.string(),
  title: z.string(),
  ownerId: z.string().nullable(),
  dueDate: z.string(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
});
export type WizardActionDraft = z.infer<typeof WizardActionDraftSchema>;

export const WizardDraftSchema = z.object({
  step: z.number().int().min(1).max(12),
  scenarioId: z.string(),
  ownerId: z.string(),
  title: z.string(),
  hazard: z.string(),
  topEvent: z.string(),
  assetOrProcess: z.string(),
  threats: z.array(WizardThreatDraftSchema),
  consequences: z.array(WizardConsequenceDraftSchema),
  preventiveBarriers: z.array(WizardBarrierDraftSchema),
  mitigativeBarriers: z.array(WizardBarrierDraftSchema),
  degradationFactors: z.array(WizardDegradationFactorDraftSchema),
  degradationControls: z.array(WizardDegradationControlDraftSchema),
  riskBeforeBarriers: z.number(),
  riskCurrent: z.number(),
  riskAfterBarriers: z.number(),
  riskTarget: z.number(),
  actions: z.array(WizardActionDraftSchema),
  startedAt: z.string(),
});
export type WizardDraft = z.infer<typeof WizardDraftSchema>;

// -- Demo state container -------------------------------------------------

export const DemoStateSchema = z.object({
  schemaVersion: z.number(),
  currentUserId: z.string(),
  scenarios: z.array(ScenarioSchema),
  users: z.array(UserSchema),
  bowties: z.array(BowtieSchema),
  threats: z.array(ThreatSchema),
  consequences: z.array(ConsequenceSchema),
  barriers: z.array(BarrierSchema),
  degradationFactors: z.array(DegradationFactorSchema),
  degradationControls: z.array(DegradationControlSchema),
  risks: z.array(RiskSchema),
  actions: z.array(ActionSchema),
  verifications: z.array(VerificationSchema),
  performanceStandards: z.array(PerformanceStandardSchema),
  incidents: z.array(IncidentSchema),
  mocs: z.array(MocSchema),
  audits: z.array(AuditSchema),
  templates: z.array(TemplateSchema),
  aiSuggestions: z.array(AiSuggestionSchema),
  wizardDraft: WizardDraftSchema.nullable(),
});
export type DemoState = z.infer<typeof DemoStateSchema>;
