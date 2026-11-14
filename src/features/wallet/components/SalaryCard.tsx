import { View } from 'react-native';

import { AppText, Button, Card, StatusChip } from '@/components/ui';
import { formatRupees } from '@/features/orders/orderModel';

import { canViewNextMonth, formatShortDate, monthLabel, type SalaryRecord } from '../walletModel';

interface SalaryCardProps {
  month: string;
  salary: SalaryRecord | null;
  loading: boolean;
  onMove: (delta: -1 | 1) => void;
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <AppText tone={strong ? 'default' : 'muted'} variant={strong ? 'title' : 'body'}>
        {label}
      </AppText>
      <AppText variant={strong ? 'title' : 'label'}>{value}</AppText>
    </View>
  );
}

/** A month's salary: base, incentives, deductions, the total, and whether it has been paid. */
export function SalaryCard({ month, salary, loading, onMove }: SalaryCardProps) {
  const canGoNext = canViewNextMonth(month, new Date());

  return (
    <Card className="gap-4">
      <View className="flex-row items-center justify-between gap-2">
        <View className="w-24">
          <Button label="Earlier" size="md" variant="outline" onPress={() => onMove(-1)} />
        </View>
        <AppText variant="title" className="flex-1 text-center">
          {monthLabel(month)}
        </AppText>
        <View className="w-24">
          <Button label="Later" size="md" variant="outline" disabled={!canGoNext} onPress={() => onMove(1)} />
        </View>
      </View>

      {loading ? (
        <AppText tone="muted">Loading…</AppText>
      ) : !salary ? (
        <AppText tone="muted">No salary has been recorded for this month yet.</AppText>
      ) : (
        <View className="gap-3">
          <Line label="Base salary" value={formatRupees(salary.baseSalary)} />
          <Line label="Incentives" value={`+${formatRupees(salary.totalIncentiveEarned)}`} />
          <Line label="Deductions" value={salary.totalDeductions > 0 ? `-${formatRupees(salary.totalDeductions)}` : formatRupees(0)} />
          <View className="h-px bg-border" />
          <Line label="Total" value={formatRupees(salary.totalAmount)} strong />
          <View className="flex-row items-center gap-2">
            <StatusChip tone={salary.status === 'paid' ? 'done' : 'ready'} label={salary.status === 'paid' ? 'Paid' : 'Not paid yet'} />
            {salary.status === 'paid' && salary.paidAt ? (
              <AppText variant="caption" tone="muted">
                on {formatShortDate(salary.paidAt)}
              </AppText>
            ) : null}
          </View>
          {salary.notes ? (
            <AppText variant="caption" tone="muted">
              {salary.notes}
            </AppText>
          ) : null}
        </View>
      )}
    </Card>
  );
}
