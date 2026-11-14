import { LEAD_STEPS, type LeadStep } from '../leadForm';

/** Heading and subtitle shown above each registration step. Step 1 copy is from the Figma design. */
export const STEP_HEADINGS: Record<LeadStep, { title: string; subtitle: string }> = {
  personal: {
    title: 'Tell us about yourself',
    subtitle: 'Apply to ride with Mealawe. Details will be verified against your government ID.',
  },
  address: {
    title: 'Where do you live?',
    subtitle: 'Provide your current residential address for delivery hub assignment.',
  },
  kyc: {
    title: 'Upload ID Document',
    subtitle: 'Government issued IDs are required for background verification and rider payouts.',
  },
  bank: {
    title: 'Bank account & UPI',
    subtitle: 'Where would you like to receive your weekly delivery earnings and shift incentives?',
  },
};

/** What the main button says on each step: where it leads, or "Submit application" on the last one. */
export const STEP_PRIMARY_LABEL: Record<LeadStep, string> = {
  personal: 'Continue to ID Address',
  address: 'Continue to ID Document',
  kyc: 'Continue to Bank & UPI',
  bank: 'Submit Application',
};

/** Names used in the "Back to ..." link on each step. */
const STEP_NAME: Record<LeadStep, string> = {
  personal: 'Personal Details',
  address: 'Address',
  kyc: 'ID Documents',
  bank: 'Bank and UPI',
};

/** The label for the back link on a step, naming the step it returns to; null on the first step. The last step reviews all. */
export function backLabel(step: LeadStep): string | null {
  if (step === 'bank') return 'Review previous steps';
  const index = LEAD_STEPS.indexOf(step);
  const previous = index > 0 ? LEAD_STEPS[index - 1] : undefined;
  return previous ? `Back to ${STEP_NAME[previous]}` : null;
}

/** What the percent label above the progress bar says: "25% Completed", and "100% Final" on the last step. */
export function progressLabel(percent: number): string {
  return percent >= 100 ? `${percent}% Final` : `${percent}% Completed`;
}
