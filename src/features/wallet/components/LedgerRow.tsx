import { View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { formatShortDate, formatSignedRupees, ledgerKind, ledgerTitle, signedAmount, type LedgerEntry, type LedgerKind } from '../walletModel';
import { useStatusColors, type StatusTone } from '@/theme';

const TONE: Record<LedgerKind, StatusTone> = {
  incentive: 'done',
  credit: 'done',
  pending: 'ready',
  salary: 'onTheWay',
  deduction: 'cancelled',
  debit: 'cancelled',
};

interface LedgerRowProps {
  entry: LedgerEntry;
}

/** One wallet entry: what it was, when, and the amount with its sign. Held amounts show when they release. */
export function LedgerRow({ entry }: LedgerRowProps) {
  const kind = ledgerKind(entry);
  const colors = useStatusColors(TONE[kind]);
  const date = formatShortDate(entry.createdAt);
  const releases = entry.releasesAt ? formatShortDate(entry.releasesAt) : '';

  return (
    <Card className="gap-1">
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="title" className="flex-1">
          {ledgerTitle(entry)}
        </AppText>
        <AppText variant="title" style={{ color: colors.ink }}>
          {formatSignedRupees(signedAmount(entry))}
        </AppText>
      </View>
      <AppText variant="caption" tone="muted">
        {date}
        {kind === 'pending' && releases ? ` · Releases ${releases}` : ''}
        {kind !== 'pending' ? ` · Balance ${Math.round(entry.balanceAfter).toLocaleString('en-IN')}` : ''}
      </AppText>
    </Card>
  );
}
