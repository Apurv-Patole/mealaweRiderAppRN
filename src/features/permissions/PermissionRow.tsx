import { View } from 'react-native';

import { AppText, Button, Card, StatusChip } from '@/components/ui';
import type { StatusTone } from '@/theme';

import {
  actionFor,
  isActionable,
  statusLabel,
  type PermissionAction,
  type PermissionItem,
  type PermissionStatus,
  type PermissionStatuses,
} from './permissionState';

const TONE: Record<PermissionStatus, StatusTone> = {
  granted: 'done',
  blocked: 'cancelled',
  denied: 'ready',
  undetermined: 'offline',
  unknown: 'offline',
};

const ACTION_LABEL: Record<Exclude<PermissionAction, 'none'>, string> = {
  request: 'Allow',
  openSettings: 'Open Settings',
  openBatterySettings: 'Open battery settings',
};

interface PermissionRowProps {
  item: PermissionItem;
  statuses: PermissionStatuses;
  onAct: () => void;
}

export function PermissionRow({ item, statuses, onAct }: PermissionRowProps) {
  const status = statuses[item.key];
  const action = actionFor(item.key, status);
  const actionable = isActionable(item.key, statuses);

  return (
    <Card className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <AppText variant="title" className="flex-1">
          {item.title}
        </AppText>
        <StatusChip tone={TONE[status]} label={statusLabel(status)} />
      </View>
      <AppText tone="muted">{item.why}</AppText>
      {!item.required ? (
        <AppText variant="caption" tone="muted">
          Recommended
        </AppText>
      ) : null}
      {action !== 'none' ? (
        <Button
          label={ACTION_LABEL[action]}
          size="md"
          variant={status === 'granted' || !item.required ? 'outline' : 'primary'}
          disabled={!actionable}
          onPress={onAct}
        />
      ) : null}
      {!actionable ? (
        <AppText variant="caption" tone="muted">
          Allow location while using the app first.
        </AppText>
      ) : null}
    </Card>
  );
}
