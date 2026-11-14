import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { digitsOnly } from '@/features/auth';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import { mergeDetected } from '../addressDetect';
import { detectAddressFromLocation } from '../detectPincode';
import type { AddressDraft, LeadErrors } from '../leadForm';
import { RegisterCard } from '../ui/RegisterCard';
import { RegisterField } from '../ui/RegisterField';
import { MintBanner, SwitchRow } from '../ui/RegisterParts';
import { detectLocateSvg, fieldPinSvg, tilePersonSvg } from '../ui/svgSources';
import type { StepProps } from './types';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

const PINCODE_LENGTH = 6;

interface AddressCardProps {
  title: string;
  subtitle: string;
  prefix: 'residenceAddress' | 'permanentAddress';
  address: AddressDraft;
  errors: LeadErrors;
  onChange: (address: AddressDraft) => void;
}

type DetectState = 'idle' | 'busy' | 'denied' | 'unavailable';

const DETECT_MESSAGE: Record<'denied' | 'unavailable', string> = {
  denied: 'Allow location access to detect your pincode, or type it in.',
  unavailable: 'Could not detect your pincode here. Please type it in.',
};

/** "Detect pincode" in the pincode label row: locates the phone and fills the pincode (and blank city and state). */
function DetectPincode({ busy, onPress }: { busy: boolean; onPress: () => void }) {
  const C = useRegisterColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Detect pincode from my location"
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: busy ? 0.6 : 1 }}>
      <SvgXml xml={detectLocateSvg} width={14.6} height={14.6} />
      <AppText variant="caption" style={{ color: C.greenDeep, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
        {busy ? 'Detecting…' : 'Detect pincode'}
      </AppText>
    </Pressable>
  );
}

function AddressCard({ title, subtitle, prefix, address, errors, onChange }: AddressCardProps) {
  const [detect, setDetect] = useState<DetectState>('idle');
  const set = (patch: Partial<AddressDraft>) => onChange({ ...address, ...patch });

  async function detectPincode() {
    setDetect('busy');
    const result = await detectAddressFromLocation();
    if (result.status === 'ok') {
      haptics.confirm();
      onChange(mergeDetected(address, result.patch));
      setDetect('idle');
      return;
    }
    haptics.error();
    setDetect(result.status);
  }

  const pincodeError = errors[`${prefix}.pincode`] ?? (detect === 'denied' || detect === 'unavailable' ? DETECT_MESSAGE[detect] : null);

  return (
    <RegisterCard title={title} subtitle={subtitle} icon={{ xml: tilePersonSvg, width: 16, height: 16 }}>
      <RegisterField
        variant="compact"
        label="Flat / House No. & Building"
        placeholder="Flat 302, Sai Vihar Apts"
        value={address.line1}
        onChangeText={(line1) => set({ line1 })}
        autoComplete="street-address"
      />
      <RegisterField
        variant="compact"
        label="Street, Colony & Landmark"
        placeholder="Near Balewadi High Street"
        value={address.line2}
        onChangeText={(line2) => set({ line2 })}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <RegisterField
            variant="compact"
            label="City"
            placeholder="Pune"
            value={address.city}
            onChangeText={(city) => set({ city })}
            autoCapitalize="words"
          />
        </View>
        <View style={{ flex: 1 }}>
          <RegisterField
            variant="compact"
            label="State"
            placeholder="Maharashtra"
            value={address.state}
            onChangeText={(state) => set({ state })}
            autoCapitalize="words"
          />
        </View>
      </View>
      <RegisterField
        variant="compact"
        label="Pincode (6 digits)"
        labelAction={<DetectPincode busy={detect === 'busy'} onPress={() => void detectPincode()} />}
        icon={{ xml: fieldPinSvg, width: 11.67, height: 16.67, left: 18.17 }}
        paddingLeft={41}
        letterSpacing={0.7}
        placeholder="411045"
        value={address.pincode}
        onChangeText={(value) => {
          setDetect('idle');
          set({ pincode: digitsOnly(value, PINCODE_LENGTH) });
        }}
        keyboardType="number-pad"
        autoComplete="postal-code"
        error={pincodeError}
      />
    </RegisterCard>
  );
}

/** Step 2: where the rider lives now, and whether their permanent address is the same (Figma "Reg (2)"). */
export function AddressStep({ draft, errors, update }: StepProps) {
  const C = useRegisterColors();
  return (
    <>
      <AddressCard
        title="Current Residence"
        subtitle="Base location for shifts"
        prefix="residenceAddress"
        address={draft.residenceAddress}
        errors={errors}
        onChange={(residenceAddress) => update({ residenceAddress })}
      />

      <View
        style={{
          padding: 17,
          gap: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.card,
          shadowColor: C.ink,
          shadowOpacity: 0.04,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        }}>
        <SwitchRow
          title="Permanent address is the same as current address"
          description="Turn off if your permanent hometown address differs"
          value={draft.permanentSameAsResidence}
          onChange={(permanentSameAsResidence) => update({ permanentSameAsResidence })}
        />
        <MintBanner
          before="Deliveries will be assigned within"
          emphasis="5–7 km"
          after="of your current address to optimize your route speed and daily earnings."
        />
      </View>

      {draft.permanentSameAsResidence ? null : (
        <AddressCard
          title="Permanent Address"
          subtitle="Your hometown address"
          prefix="permanentAddress"
          address={draft.permanentAddress}
          errors={errors}
          onChange={(permanentAddress) => update({ permanentAddress })}
        />
      )}
    </>
  );
}
