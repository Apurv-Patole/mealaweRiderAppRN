import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { AppText, Button, Screen } from '@/components/ui';
import { PermissionRow } from '@/features/permissions/PermissionRow';
import { PERMISSION_ITEMS } from '@/features/permissions/permissionState';
import { usePermissions } from '@/features/permissions/usePermissions';
import { useAppFlagsStore } from '@/store';

/**
 * Permission wizard. Shown once after the first sign-in and reachable again from
 * Profile. Skipping is allowed here: starting a shift (Stage 2) checks the
 * required permissions again at the moment they are needed.
 */
export default function PermissionsScreen() {
  const router = useRouter();
  const markPrompted = useAppFlagsStore((state) => state.markPermissionsPrompted);
  const { statuses, ready, loading, act } = usePermissions();

  function finish() {
    markPrompted();
    router.replace('/(tabs)/orders');
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <View className="gap-2">
        <AppText variant="h1">Before you start</AppText>
        <AppText tone="muted">
          Mealawe Rider needs these to confirm your attendance, track deliveries and alert you about orders.
        </AppText>
      </View>

      {PERMISSION_ITEMS.map((item) => (
        <PermissionRow key={item.key} item={item} statuses={statuses} onAct={() => void act(item.key)} />
      ))}

      <View className="gap-2 pt-2">
        <Button label={ready ? 'Continue' : 'Continue anyway'} variant={ready ? 'primary' : 'outline'} loading={loading} onPress={finish} />
        {!ready && !loading ? (
          <AppText variant="caption" tone="muted" className="text-center">
            You will need all three required permissions before you can start a shift.
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}
