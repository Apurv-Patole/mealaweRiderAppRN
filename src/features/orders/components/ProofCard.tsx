import { User } from 'lucide-react-native';
import { Image, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { formatClockFromIso } from '@/lib/dates';
import { resolveImageUrl } from '@/lib/imageUrl';
import { useColors } from '@/theme';

import type { RiderOrder } from '../orderModel';
import { stepTimeIso } from '../orderProgress';

const PROOF_HEIGHT = 200;

function ProofImage({ label, url, time }: { label: string; url: string; time?: string }) {
  const colors = useColors();
  return (
    <View className="gap-2">
      <AppText variant="label">
        {label}
        {time ? <AppText variant="caption" tone="muted">{`  ·  ${time}`}</AppText> : null}
      </AppText>
      <Image
        source={{ uri: resolveImageUrl(url) }}
        accessibilityLabel={label}
        resizeMode="cover"
        style={{ height: PROOF_HEIGHT, borderRadius: 14, backgroundColor: colors.muted }}
      />
    </View>
  );
}

/** For a delivered order: who it was handed to and the pickup and delivery photos. Renders nothing when there is none. */
export function ProofCard({ order }: { order: RiderOrder }) {
  const colors = useColors();
  const delivered = order.lifecycle === 'done';
  if (!delivered || (!order.deliveryProofUrl && !order.pickupProofUrl && !order.handOverTo)) return null;

  return (
    <Card className="gap-4">
      {order.handOverTo ? (
        <View className="flex-row items-center gap-2">
          <User size={18} color={colors.mutedForeground} />
          <AppText tone="muted">Handed to</AppText>
          <AppText variant="label">{order.handOverTo}</AppText>
        </View>
      ) : null}
      {order.deliveryProofUrl ? (
        <ProofImage label="Delivery proof" url={order.deliveryProofUrl} time={formatClockFromIso(stepTimeIso(order, 5) ?? '')} />
      ) : null}
      {order.pickupProofUrl ? <ProofImage label="Pickup proof" url={order.pickupProofUrl} /> : null}
    </Card>
  );
}
