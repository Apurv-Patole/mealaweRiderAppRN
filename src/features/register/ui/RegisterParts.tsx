import { Linking, Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { PRIVACY_POLICY_URL } from '@/features/auth/LegalNote';
import { FONT_FAMILY } from '@/theme';

import { arrowLeftSmallSvg, bannerInfoSvg, trustShieldSvg } from './svgSources';
import { trustLockSvg } from './svgSourcesDocs';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

/** Pale-green reassurance strip under the heading on the first step. */
export function TrustBanner({ message }: { message: string }) {
  const C = useRegisterColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, backgroundColor: C.trustBg }}>
      <SvgXml xml={trustShieldSvg} width={13.33} height={16.67} />
      <AppText variant="caption" style={{ flex: 1, color: C.ink, fontSize: 11, lineHeight: 16 }}>
        {message}
      </AppText>
    </View>
  );
}

/** "By continuing you agree to Mealawe's privacy policy..." with the policy opening in the browser. */
export function RegisterLegal({ action }: { action: 'continuing' | 'submitting' }) {
  const C = useRegisterColors();
  return (
    <View style={{ paddingHorizontal: 8 }}>
      <AppText variant="caption" style={{ color: C.muted, fontSize: 11, lineHeight: 17.88, textAlign: 'center' }}>
        By {action}, you agree to Mealawe&apos;s{' '}
        <AppText
          variant="caption"
          accessibilityRole="link"
          onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
          style={{ color: C.greenDeep, fontFamily: FONT_FAMILY.semibold, fontSize: 11, lineHeight: 17.88, textDecorationLine: 'underline' }}>
          privacy policy
        </AppText>{' '}
        and confirm that submitted data matches your official records.
      </AppText>
    </View>
  );
}

interface FooterLinkProps {
  /** Plain text before the link, for example "Already have an account?". */
  lead?: string;
  label: string;
  disabled?: boolean;
  /** "back" puts a small left arrow before the label and drops the underline ("Back to Personal Details"). */
  style?: 'link' | 'back';
  onPress: () => void;
}

/** The quiet line under the main button: optional lead-in text and an underlined green action. */
export function FooterLink({ lead, label, disabled = false, style = 'link', onPress }: FooterLinkProps) {
  const C = useRegisterColors();
  if (style === 'back') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        disabled={disabled}
        hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
        onPress={onPress}
        style={{ height: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: disabled ? 0.5 : 1 }}>
        <SvgXml xml={arrowLeftSmallSvg} width={10.67} height={10.67} />
        <AppText style={{ color: C.body, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20 }}>{label}</AppText>
      </Pressable>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lead ? `${lead} ${label}` : label}
      disabled={disabled}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, opacity: disabled ? 0.5 : 1 }}>
      {lead ? <AppText style={{ color: C.body, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20 }}>{lead} </AppText> : null}
      <AppText style={{ color: C.greenDeep, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20, textDecorationLine: 'underline' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

interface SwitchRowProps {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

const SWITCH = { width: 48, height: 24, thumb: 20 } as const;

/** A titled toggle: heading and helper text on the left, a 48 x 24 switch on the right. */
export function SwitchRow({ title, description, value, onChange }: SwitchRowProps) {
  const C = useRegisterColors();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View style={{ flex: 1, gap: 6 }}>
        <AppText style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 19.25 }}>{title}</AppText>
        <AppText variant="caption" style={{ color: C.body, fontSize: 12, lineHeight: 18 }}>
          {description}
        </AppText>
      </View>
      <View style={{ paddingTop: 2 }}>
        <View
          style={{
            width: SWITCH.width,
            height: SWITCH.height,
            borderRadius: SWITCH.height / 2,
            backgroundColor: value ? C.green : C.switchOff,
            justifyContent: 'center',
          }}>
          <View
            style={{
              position: 'absolute',
              top: 2,
              left: value ? SWITCH.width - SWITCH.thumb - 2 : 2,
              width: SWITCH.thumb,
              height: SWITCH.thumb,
              borderRadius: SWITCH.thumb / 2,
              backgroundColor: C.card,
            }}
          />
        </View>
      </View>
    </Pressable>
  );
}

/** Mint information strip with a leading icon. `emphasis` is shown bold inside the sentence. */
export function MintBanner({ before, emphasis, after }: { before: string; emphasis: string; after: string }) {
  const C = useRegisterColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: 13,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.mintBannerBorder,
        backgroundColor: C.mintBannerBg,
      }}>
      <SvgXml xml={bannerInfoSvg} width={16.67} height={18.67} />
      <AppText variant="caption" style={{ flex: 1, color: C.mintBannerInk, fontSize: 12, lineHeight: 19.5 }}>
        {before}{' '}
        <AppText variant="caption" style={{ color: C.greenDeep, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 19.5 }}>
          {emphasis}
        </AppText>{' '}
        {after}
      </AppText>
    </View>
  );
}

/** Grey security note with a lock, shown at the bottom of the ID documents step. */
export function TrustNote({ message }: { message: string }) {
  const C = useRegisterColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 13,
        paddingVertical: 11,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.tile,
      }}>
      <SvgXml xml={trustLockSvg} width={13.33} height={17.5} />
      <AppText variant="caption" style={{ flex: 1, color: C.body, fontSize: 11, lineHeight: 16 }}>
        {message}
      </AppText>
    </View>
  );
}
