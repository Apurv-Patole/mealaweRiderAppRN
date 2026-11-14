import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { StatusBar } from 'expo-status-bar';

import { AppText } from '@/components/ui';
import { enterDemo } from '@/features/demo';
import { LoginButton } from '@/features/auth/login/LoginButton';
import { LoginLayout, type LoginChip } from '@/features/auth/login/LoginLayout';
import { LoginLegal } from '@/features/auth/login/LoginLegal';
import { OtpCodeField } from '@/features/auth/login/OtpCodeField';
import { OtpHeading } from '@/features/auth/login/OtpHeading';
import { ResendLink } from '@/features/auth/login/ResendLink';
import { PhoneField } from '@/features/auth/login/PhoneField';
import { chipBoltSvg, chipShieldSvg, chipWalletSvg } from '@/features/auth/login/svgSources';
import { FONT_FAMILY } from '@/theme';
import { env } from '@/config';
import { OTP, PHONE } from '@/config/constants';
import { digitsOnly, fetchProfile, firstError, otpSchema, phoneSchema, sendOtp, verifyOtp } from '@/features/auth';
import { resendDeadline, secondsUntil } from '@/features/auth/resend';
import { useNow } from '@/hooks/useNow';
import { HttpError } from '@/services/http';
import { useAppFlagsStore, useAuthStore } from '@/store';
import { haptics } from '@/utils/haptics';
import { useLoginColors } from '@/features/auth/login/useLoginColors';

type Step = 'phone' | 'otp';

/** The demo needs no server, so it is offered in dev and non-production builds only. */
const SHOW_DEMO = __DEV__ || env.envName !== 'production';

const CHIPS: readonly LoginChip[] = [
  { iconXml: chipBoltSvg, label: 'Live orders' },
  { iconXml: chipWalletSvg, label: 'Daily earnings' },
  { iconXml: chipShieldSvg, label: 'Secure' },
];

function messageFor(error: unknown): string {
  if (error instanceof HttpError || error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export default function LoginScreen() {
  const loginColors = useLoginColors();
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const replayOnboarding = useAppFlagsStore((state) => state.replayOnboarding);

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const now = useNow(1000, step === 'otp');
  const secondsLeft = secondsUntil(resendAt, now);

  async function requestOtp() {
    const problem = firstError(phoneSchema, phone);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await sendOtp(phone);
      setOtp('');
      setStep('otp');
      setResendAt(resendDeadline(Date.now(), OTP.resendSeconds));
    } catch (caught: unknown) {
      haptics.error();
      setError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  }

  async function confirmOtp(code: string) {
    const problem = firstError(otpSchema, code);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = await verifyOtp(phone, code);
      // The token must be live before the profile call so the request carries it.
      await setSession(token, null);
      const profile = await fetchProfile(phone).catch(() => null);
      if (profile) useAuthStore.getState().setRider(profile);
      haptics.confirm();
    } catch (caught: unknown) {
      haptics.error();
      setOtp('');
      setError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  }

  function onOtpChange(code: string) {
    setOtp(code);
    setError(null);
    // Verify as soon as the last digit is typed (or autofilled from the SMS).
    if (code.length === OTP.length && !busy) void confirmOtp(code);
  }

  function goBack() {
    if (step === 'otp') {
      setStep('phone');
      setError(null);
      return;
    }
    replayOnboarding();
  }

  const footer =
    step === 'phone' ? (
      <>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <AppText style={{ color: loginColors.muted, fontSize: 14, lineHeight: 21 }}>New rider?</AppText>
          <AppText
            accessibilityRole="link"
            onPress={() => router.push('/register')}
            style={{ color: loginColors.greenInk, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 21 }}>
            Register here
          </AppText>
        </View>
        {SHOW_DEMO ? <LoginButton label="Try the demo" tone="tonal" disabled={busy} onPress={() => void enterDemo()} /> : null}
      </>
    ) : null;

  return (
    <>
      <StatusBar style="light" />
      <LoginLayout
        title={step === 'phone' ? 'Hey rider!' : undefined}
        subtitle={step === 'phone' ? 'Sign in with your phone number to start your shift.' : undefined}
        heading={
          step === 'otp' ? (
            <OtpHeading codeLength={OTP.length} phone={phone} disabled={busy} onChangeNumber={goBack} />
          ) : undefined
        }
        chips={step === 'phone' ? CHIPS : []}
        onBack={goBack}
        footer={footer}>
        {step === 'phone' ? (
          <PhoneField
            testID="phone-input"
            label="Phone number"
            value={phone}
            onChangeText={(value) => setPhone(digitsOnly(value, PHONE.length))}
            keyboardType="number-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            placeholder="e.g. 9876543210"
            error={error}
            editable={!busy}
            returnKeyType="done"
            onSubmitEditing={() => void requestOtp()}
          />
        ) : (
          <OtpCodeField value={otp} onChange={onOtpChange} length={OTP.length} error={error} editable={!busy} />
        )}

        {step === 'otp' ? <ResendLink secondsLeft={secondsLeft} disabled={busy} onPress={() => void requestOtp()} /> : null}

        <LoginButton
          label={step === 'phone' ? 'Send code' : 'Verify and continue'}
          loading={busy}
          onPress={() => void (step === 'phone' ? requestOtp() : confirmOtp(otp))}
        />

        {step === 'phone' ? <LoginLegal /> : null}
      </LoginLayout>
    </>
  );
}
