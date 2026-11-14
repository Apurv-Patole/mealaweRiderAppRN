import { FlashList } from '@shopify/flash-list';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Button, Card, FilterChip, StatusChip } from '@/components/ui';
import { useColors } from '@/theme';
import { formatRupees } from '@/features/orders/orderModel';
import { IncentiveCard } from '@/features/wallet/components/IncentiveCard';
import { LedgerRow } from '@/features/wallet/components/LedgerRow';
import { SalaryCard } from '@/features/wallet/components/SalaryCard';
import { useWalletStore } from '@/features/wallet/walletStore';
import type { LedgerEntry } from '@/features/wallet/walletModel';

type Tab = 'history' | 'salary' | 'incentives';

const TABS: readonly { value: Tab; label: string }[] = [
  { value: 'history', label: 'History' },
  { value: 'salary', label: 'Salary' },
  { value: 'incentives', label: 'Incentives' },
];

export default function WalletScreen() {
  const colors = useColors();
  const [tab, setTab] = useState<Tab>('history');
  const [refreshing, setRefreshing] = useState(false);
  const wallet = useWalletStore();

  // Show fresh numbers every time the tab opens: new incentives are credited while the rider is away.
  useFocusEffect(
    useCallback(() => {
      const store = useWalletStore.getState();
      if (store.balance === null) void store.refreshAll();
      else {
        void store.loadBalance();
        void store.loadIncentives();
        void store.loadLedger(true);
      }
    }, []),
  );

  async function refresh() {
    setRefreshing(true);
    await useWalletStore.getState().refreshAll();
    setRefreshing(false);
  }

  const held = wallet.incentives.filter((record) => record.status === 'holding').reduce((sum, record) => sum + record.total, 0);

  const header = (
    <View className="gap-4 pb-3">
      <View
        className="gap-1 rounded-3xl p-5"
        style={{ backgroundColor: colors.primary }}
        accessible
        accessibilityLabel={`Wallet balance ${wallet.balance === null ? 'loading' : formatRupees(wallet.balance)}`}>
        <AppText variant="caption" style={{ color: colors.primaryForeground, opacity: 0.85 }}>
          Wallet balance
        </AppText>
        <AppText variant="display" style={{ color: colors.primaryForeground, fontSize: 36, lineHeight: 44 }}>
          {wallet.balance === null ? '…' : formatRupees(wallet.balance)}
        </AppText>
        {held > 0 ? (
          <AppText style={{ color: colors.primaryForeground, opacity: 0.9 }}>
            {formatRupees(held)} more is on hold and joins your wallet after 7 days.
          </AppText>
        ) : null}
      </View>

      {wallet.failed ? (
        <Card className="gap-2">
          <StatusChip tone="ready" label="Offline?" />
          <AppText>We could not refresh your wallet. What you see may be out of date.</AppText>
          <Button label="Try again" size="md" variant="outline" onPress={() => void refresh()} />
        </Card>
      ) : null}

      <View className="flex-row gap-2">
        {TABS.map((option) => (
          <FilterChip key={option.value} label={option.label} selected={tab === option.value} onPress={() => setTab(option.value)} />
        ))}
      </View>

      {tab === 'salary' ? (
        <SalaryCard
          month={wallet.salaryMonth}
          salary={wallet.salary}
          loading={wallet.salaryLoading}
          onMove={(delta) => void wallet.moveSalaryMonth(delta)}
        />
      ) : null}

      {tab === 'incentives' ? (
        wallet.incentives.length === 0 ? (
          <Card>
            <AppText tone="muted">
              {wallet.incentivesLoading
                ? 'Loading…'
                : 'No incentives yet. They appear here after you end a shift. Each one is held for 7 days, then added to your wallet.'}
            </AppText>
          </Card>
        ) : (
          <View className="gap-3">
            {wallet.incentives.map((record) => (
              <IncentiveCard key={record.id} record={record} />
            ))}
          </View>
        )
      ) : null}
    </View>
  );

  const data: LedgerEntry[] = tab === 'history' ? wallet.ledger : [];
  const empty =
    tab === 'history' ? (
      <Card>
        <AppText tone="muted">{wallet.ledgerLoading ? 'Loading…' : 'No wallet activity yet.'}</AppText>
      </Card>
    ) : null;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: true, title: 'Wallet and earnings' }} />
      <FlashList<LedgerEntry>
        data={data}
        keyExtractor={(entry) => entry.id}
        renderItem={({ item }) => (
          <View className="pb-3">
            <LedgerRow entry={item} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        onEndReached={() => void wallet.loadLedger()}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={() => void refresh()}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
}
