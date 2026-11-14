import { View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import { kpiActiveSvg, kpiDeliveredSvg, kpiKmSvg, kpiOrdersSvg } from '../home/homeSvgSources';
import { HOME_METRICS } from '../home/homeTheme';
import type { SlotStat } from '../orderStats';
import { useHomeColors } from '@/features/orders/home/useHomeColors';

interface Tile {
  iconXml: string;
  value: string;
  label: string;
}

function Stat({ tile, divided }: { tile: Tile; divided: boolean }) {
  const C = useHomeColors();
  return (
    <View
      accessible
      accessibilityLabel={`${tile.value} ${tile.label}`}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderLeftWidth: divided ? 1 : 0,
        borderLeftColor: C.kpiDivider,
      }}>
      <View style={{ width: 24, height: 24, marginBottom: 8, alignItems: 'center', justifyContent: 'center' }}>
        <SvgXml xml={tile.iconXml} width={20} height={20} />
      </View>
      <AppText style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 24, lineHeight: 24, letterSpacing: -0.6 }}>{tile.value}</AppText>
      <AppText variant="caption" numberOfLines={1} style={{ color: C.muted, fontSize: 11, lineHeight: 16.5, paddingTop: 5 }}>
        {tile.label}
      </AppText>
    </View>
  );
}

/** The day's totals in one strip: orders, active, delivered and distance ridden. */
export function StatsGrid({ stats, distanceKm }: { stats: readonly SlotStat[]; distanceKm: number }) {
  const C = useHomeColors();
  const total = stats.reduce((sum, stat) => sum + stat.total, 0);
  const active = stats.reduce((sum, stat) => sum + stat.pending, 0);
  const done = stats.reduce((sum, stat) => sum + stat.done, 0);

  const tiles: Tile[] = [
    { iconXml: kpiOrdersSvg, value: String(total), label: 'Orders' },
    { iconXml: kpiActiveSvg, value: String(active), label: 'Active' },
    { iconXml: kpiDeliveredSvg, value: String(done), label: 'Delivered' },
    { iconXml: kpiKmSvg, value: distanceKm.toFixed(1), label: 'Km ridden' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        padding: 17,
        borderRadius: HOME_METRICS.radius,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.card,
      }}>
      {tiles.map((tile, index) => (
        <Stat key={tile.label} tile={tile} divided={index > 0} />
      ))}
    </View>
  );
}
