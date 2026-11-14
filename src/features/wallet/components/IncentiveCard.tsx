import { View } from 'react-native';

import { AppText, Card, StatusChip } from '@/components/ui';
import { formatRupees } from '@/features/orders/orderModel';

import { formatShortDate, holdingNote, type IncentiveRecord } from '../walletModel';

interface IncentiveCardProps {
  record: IncentiveRecord;
  /** Shows the part-by-part breakdown (the summary after a shift always does). */
  expanded?: boolean;
}

/** One shift's incentive: slot, date, total, when it reaches the wallet, and what it was made of. */
export function IncentiveCard({ record, expanded = true }: IncentiveCardProps) {
  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <AppText variant="title">
            {record.mealSlot} · {formatShortDate(record.date)}
          </AppText>
          <AppText variant="caption" tone="muted">
            {holdingNote(record)}
          </AppText>
        </View>
        <View className="items-end gap-1">
          <AppText variant="title">{formatRupees(record.total)}</AppText>
          <StatusChip
            tone={record.status === 'credited' ? 'done' : 'ready'}
            label={record.status === 'credited' ? 'Credited' : 'On hold'}
          />
        </View>
      </View>

      {expanded
        ? record.rows.map((row) => (
            <View key={row.key} className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <AppText>{row.label}</AppText>
                {row.detail ? (
                  <AppText variant="caption" tone="muted">
                    {row.detail}
                  </AppText>
                ) : null}
              </View>
              <AppText variant="label" tone={row.earned > 0 ? 'default' : 'muted'}>
                {formatRupees(row.earned)}
              </AppText>
            </View>
          ))
        : null}
    </Card>
  );
}
