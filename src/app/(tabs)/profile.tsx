import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { CalendarCheck, CreditCard, LogOut, Package, Pencil, ShieldCheck } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dialog } from '@/components/dialog/dialog';
import { AppText } from '@/components/ui';
import { env } from '@/config';
import { logout } from '@/features/auth';
import { useHomeColors } from '@/features/orders/home/useHomeColors';
import { PERMISSION_ITEMS, statusLabel, type PermissionStatus } from '@/features/permissions/permissionState';
import { usePermissions } from '@/features/permissions/usePermissions';
import { ProfileHero } from '@/features/profile/components/ProfileHero';
import {
  AppearanceTabs,
  PermissionChip,
  ProfileCard,
  ProfileRow,
  SectionHeading,
  type ChipTone,
} from '@/features/profile/components/ProfileParts';
import { useProfileColors } from '@/features/profile/useProfileColors';
import { useAuthStore, useThemeStore, type ThemePreference } from '@/store';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const PERMISSION_TONE: Record<PermissionStatus, ChipTone> = {
  granted: 'done',
  blocked: 'cancelled',
  denied: 'ready',
  undetermined: 'offline',
  unknown: 'offline',
};

/** How far the first card rides up over the green hero. */
const HERO_OVERLAP = 35;

export default function ProfileScreen() {
  const router = useRouter();
  const home = useHomeColors();
  const c = useProfileColors();
  const insets = useSafeAreaInsets();
  const { statuses, ready } = usePermissions();
  const rider = useAuthStore((state) => state.rider);
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  const name = rider?.name || 'Rider';
  const requiredPermissions = PERMISSION_ITEMS.filter((item) => item.required);

  async function confirmSignOut() {
    const confirmed = await dialog.confirm({
      title: 'Sign out?',
      message: 'You will need to sign in again with a new code.',
      icon: LogOut,
      tone: 'danger',
      confirmLabel: 'Sign out',
      cancelLabel: 'Stay signed in',
    });
    if (confirmed) void logout().finally(() => useAuthStore.getState().clearSession());
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: home.canvas }} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <ProfileHero name={name} phoneNo={rider?.phoneNo} routeNo={rider?.routeNo} isActive={rider?.isActive !== false} topInset={insets.top} />

      <View style={{ marginTop: -HERO_OVERLAP, paddingHorizontal: 16, gap: 20 }}>
        <ProfileCard>
          <ProfileRow
            icon={Pencil}
            tone="edit"
            tile={48}
            padding={15}
            title="Edit profile"
            subtitle="Photo, contact, bank and UPI, address"
            onPress={() => router.push('/edit-profile')}
          />
        </ProfileCard>

        <View style={{ gap: 8 }}>
          <SectionHeading>My work</SectionHeading>
          <ProfileCard>
            <ProfileRow icon={CreditCard} tone="wallet" title="Wallet and earnings" subtitle="Balance, incentives and salary" onPress={() => router.push('/wallet')} />
            <ProfileRow
              icon={CalendarCheck}
              tone="mint"
              divider
              title="Attendance history"
              subtitle="Your shifts, start and end times"
              onPress={() => router.push('/history/attendance')}
            />
            <ProfileRow
              icon={Package}
              tone="blue"
              divider
              title="Order history"
              subtitle="Past deliveries and their status"
              onPress={() => router.push('/history/orders')}
            />
          </ProfileCard>
        </View>

        <View style={{ gap: 8 }}>
          <SectionHeading>App permissions</SectionHeading>
          <ProfileCard style={{ padding: 17, gap: 16 }}>
            <View style={{ borderBottomWidth: 1, borderBottomColor: home.border, marginHorizontal: -17, paddingHorizontal: 17 }}>
              <ProfileRow
                icon={ShieldCheck}
                tone={ready ? 'mint' : 'wallet'}
                padding={0}
                title={ready ? 'All set' : 'Needs attention'}
                subtitle={ready ? 'Everything the app needs is allowed' : 'Some permissions are missing'}
                onPress={() => router.push('/permissions')}
              />
              <View style={{ height: 13 }} />
            </View>
            <View style={{ gap: 12, paddingTop: 2 }}>
              {requiredPermissions.map((item) => (
                <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <AppText variant="caption" style={{ flex: 1, color: home.muted, fontFamily: FONT_FAMILY.medium, fontSize: 12, lineHeight: 16 }}>
                    {item.title}
                  </AppText>
                  <PermissionChip tone={PERMISSION_TONE[statuses[item.key]]} label={statusLabel(statuses[item.key])} />
                </View>
              ))}
            </View>
          </ProfileCard>
        </View>

        <View style={{ gap: 8 }}>
          <SectionHeading>Appearance</SectionHeading>
          <AppearanceTabs options={THEME_OPTIONS} value={preference} onChange={setPreference} />
        </View>

        <View style={{ gap: 16, paddingTop: 8 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={() => {
              haptics.tap();
              void confirmSignOut();
            }}
            style={({ pressed }) => ({
              height: 48,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: c.signOut,
              opacity: pressed ? 0.7 : 1,
            })}>
            <AppText style={{ color: c.signOut, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20, letterSpacing: 0.35 }}>Sign out</AppText>
          </Pressable>
          <AppText variant="caption" style={{ textAlign: 'center', color: c.footer, fontFamily: FONT_FAMILY.medium, fontSize: 12, lineHeight: 16 }}>
            Mealawe Rider · Version {Constants.expoConfig?.version ?? '0.0.0'} ({env.envName})
          </AppText>
        </View>
      </View>
    </ScrollView>
  );
}
