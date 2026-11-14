import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CircleCheck } from 'lucide-react-native';

import { AppText, AuthLayout, Button, Card, IconTile } from '@/components/ui';
import { submitLead } from '@/features/register/leadApi';
import {
  emptyDraft,
  firstInvalidStep,
  LEAD_STEPS,
  validateStep,
  type LeadDraft,
  type LeadErrors,
  type LeadStep,
} from '@/features/register/leadForm';
import { AddressStep } from '@/features/register/steps/AddressStep';
import { BankStep } from '@/features/register/steps/BankStep';
import { KycStep } from '@/features/register/steps/KycStep';
import { PersonalStep } from '@/features/register/steps/PersonalStep';
import type { StepProps } from '@/features/register/steps/types';
import { FooterLink, RegisterLegal, TrustBanner } from '@/features/register/ui/RegisterParts';
import { RegisterShell } from '@/features/register/ui/RegisterShell';
import { backLabel, STEP_HEADINGS, STEP_PRIMARY_LABEL } from '@/features/register/ui/registerContent';
import { haptics } from '@/utils/haptics';

const STEP_VIEWS: Record<LeadStep, (props: StepProps) => React.JSX.Element> = {
  personal: PersonalStep,
  address: AddressStep,
  kyc: KycStep,
  bank: BankStep,
};

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function RegisterScreen() {
  const router = useRouter();
  const [draft, setDraft] = useState<LeadDraft>(emptyDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<LeadErrors>({});
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const step = LEAD_STEPS[stepIndex] ?? 'personal';
  const isLast = stepIndex === LEAD_STEPS.length - 1;
  const StepView = STEP_VIEWS[step];

  function update(patch: Partial<LeadDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function goTo(index: number) {
    setErrors({});
    setSubmitError(null);
    setStepIndex(index);
  }

  async function next() {
    const stepErrors = validateStep(step, draft);
    if (Object.keys(stepErrors).length > 0) {
      haptics.error();
      setErrors(stepErrors);
      return;
    }
    if (!isLast) {
      goTo(stepIndex + 1);
      return;
    }

    // Final step: check the whole form again, and jump back to the first problem.
    const invalid = firstInvalidStep(draft);
    if (invalid) {
      haptics.error();
      setStepIndex(LEAD_STEPS.indexOf(invalid.step));
      setErrors(invalid.errors);
      return;
    }

    setBusy(true);
    setSubmitError(null);
    try {
      await submitLead(draft);
      haptics.confirm();
      setSubmitted(true);
    } catch (error: unknown) {
      haptics.error();
      setSubmitError(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <AuthLayout title="Application received" subtitle="We will be in touch soon." compact>
        <View className="items-center gap-4 py-4">
          <IconTile icon={CircleCheck} tone="done" size={36} tileSize={80} />
          <AppText className="text-center" tone="muted">
            Thank you, {draft.name.trim()}. Our team will review your details and contact you on {draft.phoneNo}.
          </AppText>
        </View>
        <Button label="Back to sign in" onPress={() => router.replace('/login')} />
      </AuthLayout>
    );
  }

  const heading = STEP_HEADINGS[step];

  function goBack() {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    goTo(stepIndex - 1);
  }

  return (
    <RegisterShell
      stepIndex={stepIndex}
      stepCount={LEAD_STEPS.length}
      title={heading.title}
      subtitle={heading.subtitle}
      onBack={goBack}
      banner={
        stepIndex === 0 ? <TrustBanner message="Instant Aadhaar eKYC verification ensures quick onboarding in 24 hours." /> : undefined
      }
      primaryLabel={STEP_PRIMARY_LABEL[step]}
      primaryBusy={busy}
      onPrimary={() => void next()}
      secondary={
        stepIndex === 0 ? (
          <FooterLink lead="Already have an account?" label="Sign in" disabled={busy} onPress={() => router.back()} />
        ) : (
          <FooterLink label={backLabel(step) ?? 'Back'} style="back" disabled={busy} onPress={goBack} />
        )
      }>
      <StepView draft={draft} errors={errors} update={update} />

      {submitError ? (
        <Card className="border-danger">
          <AppText tone="danger">{submitError}</AppText>
        </Card>
      ) : null}

      <RegisterLegal action={isLast ? 'submitting' : 'continuing'} />
    </RegisterShell>
  );
}
