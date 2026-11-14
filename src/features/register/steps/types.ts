import type { LeadDraft, LeadErrors } from '../leadForm';

/** Props shared by every registration step. */
export interface StepProps {
  draft: LeadDraft;
  errors: LeadErrors;
  /** Merge a change into the draft (immutable: the screen builds a new draft). */
  update: (patch: Partial<LeadDraft>) => void;
}
