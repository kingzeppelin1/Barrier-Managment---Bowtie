import type {
  AiSuggestion,
  Barrier,
  Bowtie,
  Consequence,
  DegradationControl,
  DegradationFactor,
  PerformanceStandard,
  Risk,
  Threat,
  Verification,
} from '@bowtie/shared';

/**
 * Inputs the AI Coach needs to evaluate a single bowtie.
 *
 * The provider is given the read-only slice of the demo state that's
 * relevant to the bowtie under review. The provider returns a list of
 * suggestions; each suggestion's id is deterministic so re-running on
 * the same state doesn't create duplicates.
 */
export interface CoachInput {
  bowtie: Bowtie;
  threats: Threat[];
  consequences: Consequence[];
  barriers: Barrier[];
  degradationFactors: DegradationFactor[];
  degradationControls: DegradationControl[];
  performanceStandards: PerformanceStandard[];
  verifications: Verification[];
  risks: Risk[];
  /** Reference timestamp — passed in so tests / re-runs are deterministic. */
  now?: Date;
}

export interface AIProvider {
  readonly name: 'mock' | 'anthropic';
  evaluate(input: CoachInput): Promise<AiSuggestion[]>;
}
