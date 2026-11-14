import { ChevronDown, ChevronUp, Package } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { useColors } from '@/theme';
import { haptics } from '@/utils/haptics';

import { formatRupees, type OrderLine, type RiderOrder } from '../orderModel';

function LineRow({ line }: { line: OrderLine }) {
  return (
    <View className="flex-row items-center gap-3">
      <AppText className="flex-1">{line.name}</AppText>
      <AppText tone="muted">×{line.count}</AppText>
      {line.total > 0 ? <AppText variant="label">{formatRupees(line.total)}</AppText> : null}
    </View>
  );
}

/** What is in the order, folded away until tapped: package, items and add-ons with prices, and the total. */
export function ItemsCard({ order }: { order: RiderOrder }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const count = order.itemLines.length + order.addOns.length;
  const nothing = count === 0 && !order.packageName;

  return (
    <Card className="gap-0 p-0">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Order items, ${count} ${count === 1 ? 'line' : 'lines'}`}
        onPress={() => {
          haptics.tap();
          setOpen((current) => !current);
        }}
        className="flex-row items-center gap-3 p-4">
        <Package size={20} color={colors.primary} />
        <AppText variant="label" className="flex-1">
          Order items
        </AppText>
        {count > 0 ? (
          <View style={{ minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}>
            <AppText variant="caption" tone="primary">
              {count}
            </AppText>
          </View>
        ) : null}
        {open ? <ChevronUp size={20} color={colors.mutedForeground} /> : <ChevronDown size={20} color={colors.mutedForeground} />}
      </Pressable>

      {open ? (
        <View className="gap-3 border-t border-border p-4">
          {nothing ? <AppText tone="muted">No items listed.</AppText> : null}
          {order.packageName ? <AppText>Package: {order.packageName}</AppText> : null}
          {order.itemLines.map((line) => (
            <LineRow key={line.name} line={line} />
          ))}
          {order.addOns.length > 0 ? (
            <>
              <AppText variant="overline" tone="muted">
                ADD-ONS
              </AppText>
              {order.addOns.map((line) => (
                <LineRow key={line.name} line={line} />
              ))}
            </>
          ) : null}
          <View className="flex-row items-center justify-between border-t border-border pt-3">
            <AppText variant="label">Total</AppText>
            <AppText variant="title">{formatRupees(order.totalAmount)}</AppText>
          </View>
        </View>
      ) : null}
    </Card>
  );
}
