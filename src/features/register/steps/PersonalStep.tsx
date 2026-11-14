import { View } from 'react-native';

import { AppText } from '@/components/ui';
import { PHONE } from '@/config/constants';
import { digitsOnly } from '@/features/auth';
import { FONT_FAMILY } from '@/theme';

import { BLOOD_GROUPS, formatDobInput } from '../leadForm';
import { BloodGroupGrid } from '../ui/BloodGroupGrid';
import { RegisterCard } from '../ui/RegisterCard';
import { RegisterField } from '../ui/RegisterField';
import { formatPhoneDisplay } from '../ui/registerFormat';
import { fieldCalendarSvg, fieldIdCardSvg, fieldMailSvg, fieldShieldSvg, tileHealthSvg, tilePersonSvg } from '../ui/svgSources';
import type { StepProps } from './types';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

const DIAL_CODE = '+91';

/** The +91 prefix with a flag and a divider, drawn inside the phone field. */
function DialPrefix() {
  const C = useRegisterColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 24,
        paddingRight: 9,
        borderRightWidth: 1,
        borderRightColor: C.fieldBorder,
      }}>
      <AppText style={{ fontSize: 16, lineHeight: 24 }}>🇮🇳</AppText>
      <AppText style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20 }}>{DIAL_CODE}</AppText>
    </View>
  );
}

/** Step 1: who the rider is, how to reach them, and who to call in an emergency (Figma "Reg (1)"). */
export function PersonalStep({ draft, errors, update }: StepProps) {
  const C = useRegisterColors();
  return (
    <>
      <RegisterCard title="Personal Information" subtitle="Basic verification data" icon={{ xml: tilePersonSvg, width: 16, height: 16 }}>
        <RegisterField
          label="Full legal name"
          required
          icon={{ xml: fieldIdCardSvg, width: 20, height: 20, left: 14 }}
          paddingLeft={41}
          placeholder="e.g. Ramesh Kumar"
          value={draft.name}
          onChangeText={(name) => update({ name })}
          autoCapitalize="words"
          autoComplete="name"
          hint="As printed on Aadhaar card"
          hintWithInfoIcon
          error={errors.name}
        />
        <RegisterField
          label="Registered mobile number"
          required
          leading={<DialPrefix />}
          paddingLeft={97}
          letterSpacing={0.35}
          placeholder="98765 43210"
          value={formatPhoneDisplay(draft.phoneNo)}
          onChangeText={(value) => update({ phoneNo: digitsOnly(value, PHONE.length) })}
          keyboardType="number-pad"
          autoComplete="tel"
          error={errors.phoneNo}
        />
        <RegisterField
          label="Email address (optional)"
          labelHint="For digital payout receipts"
          icon={{ xml: fieldMailSvg, width: 20, height: 16, left: 14 }}
          paddingLeft={41}
          placeholder="name@example.com"
          value={draft.email}
          onChangeText={(email) => update({ email })}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
        />
      </RegisterCard>

      <RegisterCard title="Medical & Emergency Contact" subtitle="For rider insurance & road safety" icon={{ xml: tileHealthSvg, width: 16, height: 20 }}>
        <RegisterField
          label="Date of birth (optional)"
          icon={{ xml: fieldCalendarSvg, width: 18, height: 20, left: 15 }}
          paddingLeft={41}
          placeholder="DD / MM / YYYY"
          value={draft.dateOfBirth}
          onChangeText={(value) => update({ dateOfBirth: formatDobInput(value) })}
          keyboardType="number-pad"
          hint="Must be at least 18 years of age to register"
          error={errors.dateOfBirth}
        />
        <BloodGroupGrid
          label="Blood group (optional)"
          labelHint="Insurance card"
          options={BLOOD_GROUPS}
          value={draft.bloodGroup}
          onChange={(bloodGroup) => update({ bloodGroup })}
        />
        <RegisterField
          label="Emergency phone number (optional)"
          icon={{ xml: fieldShieldSvg, width: 16, height: 20, left: 16 }}
          leading={<AppText style={{ color: C.muted, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20 }}>{DIAL_CODE}</AppText>}
          leadingLeft={40}
          paddingLeft={81}
          letterSpacing={0.35}
          placeholder="10-digit number"
          value={draft.emergencyContactNo}
          onChangeText={(value) => update({ emergencyContactNo: digitsOnly(value, PHONE.length) })}
          keyboardType="number-pad"
          hint="Contacted only during road emergency or SOS alert"
          error={errors.emergencyContactNo}
        />
      </RegisterCard>
    </>
  );
}
