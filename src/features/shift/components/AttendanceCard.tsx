import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, View } from 'react-native';

import { SvgXml } from '@/components/ThemedSvg';
import { AppText } from '@/components/ui';
import { DashedLine } from '@/features/orders/home/DashedLine';
import { useHomeColors } from '@/features/orders/home/useHomeColors';
import { formatDistance, mapsDirectionsUrl } from '@/lib/geo';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';

import type { Gate } from '../attendanceGate';
import type { KitchenStop } from '../kitchen';
import type { SlotWindow } from '../slots';
import { useShiftColors } from '../useShiftColors';
import { cameraSvg, destinationSvg, infoBlueSvg, pillOpenSvg, pillOrdersSvg, pinSmallSvg } from '../ui/shiftSvgSources';

interface AttendanceCardProps {
  gate: Gate;
  slot: SlotWindow;
  nextOpening: SlotWindow | null;
  proximityM: number;
  busy: boolean;
  onTakeAttendance: () => void;
}

type PillTone = 'open' | 'attention' | 'neutral';

/** The white card every attendance state sits in. */
function GateFrame({ children }: { children: ReactNode }) {
  const home = useHomeColors();
  return (
    <View style={{ padding: 16, gap: 16, borderRadius: 16, borderWidth: 1, borderColor: home.border, backgroundColor: home.card }}>
      {children}
    </View>
  );
}

/** A rounded status pill: green when open, amber when something needs doing, grey when nothing can be done. */
function StatusPill({ label, tone, iconXml }: { label: string; tone: PillTone; iconXml?: string }) {
  const shift = useShiftColors();
  const home = useHomeColors();
  const look =
    tone === 'open'
      ? { bg: shift.pillOpenBg, ink: shift.pillInk, border: 'transparent' }
      : tone === 'attention'
        ? { bg: shift.noteBg, ink: shift.noteInk, border: 'transparent' }
        : { bg: home.initialsBg, ink: home.muted, border: 'transparent' };
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: look.bg,
        borderColor: look.border,
        borderWidth: 1,
      }}>
      {iconXml ? <SvgXml xml={iconXml} width={14} height={14} /> : null}
      <AppText variant="caption" style={{ color: look.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 11.5, lineHeight: 17.25, letterSpacing: -0.287 }}>
        {label}
      </AppText>
    </View>
  );
}

/** "3 orders waiting": the outlined pill at the right of the status row. */
function OrdersPill({ count }: { count: number }) {
  const shift = useShiftColors();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 13,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: shift.pillOutline,
      }}>
      <SvgXml xml={pillOrdersSvg} width={14} height={14} />
      <AppText variant="caption" style={{ color: shift.pillInk, fontFamily: FONT_FAMILY.semibold, fontSize: 11.5, lineHeight: 17.25, letterSpacing: -0.287 }}>
        {count} {count === 1 ? 'order' : 'orders'} waiting
      </AppText>
    </View>
  );
}

function StatusRow({ left, count }: { left: ReactNode; count: number | null }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      {left}
      {count !== null ? <OrdersPill count={count} /> : null}
    </View>
  );
}

/** First pickup: kitchen name and address, under a hairline. */
function KitchenHeader({ kitchen }: { kitchen: KitchenStop }) {
  const home = useHomeColors();
  const address = [kitchen.address1, kitchen.address2].filter(Boolean).join(', ');
  return (
    <View style={{ paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: home.border }}>
      <AppText variant="caption" style={{ color: home.muted, fontSize: 11, lineHeight: 16 }}>
        First pickup
      </AppText>
      <AppText variant="title" style={{ color: home.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 16, lineHeight: 24 }}>
        {kitchen.name}
      </AppText>
      {address ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
          <SvgXml xml={pinSmallSvg} width={14} height={14} />
          <AppText variant="caption" style={{ flex: 1, color: home.muted, fontSize: 11, lineHeight: 16 }}>
            {address}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

/** "You ---- 40 m ---- Pickup": a dashed track from the rider's position to the kitchen. */
function DistanceTrack({ distanceM }: { distanceM: number | null }) {
  const home = useHomeColors();
  const shift = useShiftColors();
  return (
    <View style={{ gap: 6, paddingHorizontal: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: home.greenInk, backgroundColor: home.card }} />
        <DashedLine color={shift.trackLine} dash={4} pairs={40} style={{ flex: 1, marginHorizontal: 10 }} />
        <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: shift.destination, alignItems: 'center', justifyContent: 'center' }}>
          <SvgXml xml={destinationSvg} width={14} height={14} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        <AppText variant="caption" style={{ color: home.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 18 }}>
          You
        </AppText>
        {distanceM !== null ? (
          <AppText variant="caption" style={{ color: shift.soft, fontSize: 12, lineHeight: 18 }}>
            {formatDistance(distanceM)}
          </AppText>
        ) : null}
        <AppText variant="caption" style={{ color: home.ink, fontFamily: FONT_FAMILY.bold, fontSize: 12, lineHeight: 18 }}>
          Pickup
        </AppText>
      </View>
    </View>
  );
}

/** The blue instruction box under the track. */
function NoteBox({ children }: { children: string }) {
  const shift = useShiftColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: shift.noteBorder, backgroundColor: shift.noteBg }}>
      <View style={{ paddingTop: 2 }}>
        <SvgXml xml={infoBlueSvg} width={16} height={16} />
      </View>
      <AppText style={{ flex: 1, color: shift.noteInk, fontSize: 12.5, lineHeight: 20.31 }}>{children}</AppText>
    </View>
  );
}

/** Plain body text inside a card. */
function Body({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  const home = useHomeColors();
  return <AppText style={{ color: muted ? home.muted : home.ink, fontSize: 14, lineHeight: 21 }}>{children}</AppText>;
}

/** The green main button, or its outlined sibling. */
function ActionButton({
  label,
  iconXml,
  busy = false,
  outlined = false,
  onPress,
}: {
  label: string;
  iconXml?: string;
  busy?: boolean;
  outlined?: boolean;
  onPress: () => void;
}) {
  const home = useHomeColors();
  const textColor = outlined ? home.greenInk : home.onGreen;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy, busy }}
      disabled={busy}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: outlined ? 1 : 0,
        borderColor: home.greenInk,
        backgroundColor: outlined ? 'transparent' : home.green,
        opacity: busy ? 0.6 : pressed ? 0.88 : 1,
      })}>
      {busy ? <ActivityIndicator color={textColor} /> : iconXml ? <SvgXml xml={iconXml} width={20} height={20} /> : null}
      <AppText style={{ color: textColor, fontFamily: FONT_FAMILY.bold, fontSize: 14.5, lineHeight: 21.75 }}>{label}</AppText>
    </Pressable>
  );
}

function NavigateButton({ kitchen }: { kitchen: KitchenStop }) {
  return <ActionButton outlined label="Navigate to kitchen" onPress={() => void Linking.openURL(mapsDirectionsUrl(kitchen.location))} />;
}

/** The "get online" card: shows what is needed and the one action that applies right now. */
export function AttendanceCard({ gate, slot, nextOpening, proximityM, busy, onTakeAttendance }: AttendanceCardProps) {
  const router = useRouter();

  switch (gate.kind) {
    case 'online':
      return null;

    case 'noRoute':
      return (
        <GateFrame>
          <StatusRow left={<StatusPill tone="attention" label="No route yet" />} count={null} />
          <Body>You do not have a delivery route assigned. Please contact Mealawe support.</Body>
        </GateFrame>
      );

    case 'noSlot':
      return (
        <GateFrame>
          <StatusRow left={<StatusPill tone="neutral" label="Attendance closed" />} count={null} />
          <Body>
            {nextOpening
              ? `Attendance for ${nextOpening.meal} opens at ${nextOpening.label.split(' - ')[0]}.`
              : 'There are no more meal slots today. A missed slot cannot be marked later.'}
          </Body>
        </GateFrame>
      );

    case 'needsPermissions':
      return (
        <GateFrame>
          <StatusRow left={<StatusPill tone="attention" label="Permissions needed" />} count={null} />
          <Body>Allow location (all the time) and notifications before you start your shift.</Body>
          <ActionButton label="Fix permissions" onPress={() => router.push('/permissions')} />
        </GateFrame>
      );

    case 'loadingOrders':
      return (
        <GateFrame>
          <StatusRow left={<StatusPill tone="neutral" label="Checking" />} count={null} />
          <Body muted>Looking up your first pickup…</Body>
        </GateFrame>
      );

    case 'gettingLocation':
      return (
        <GateFrame>
          <StatusRow left={<StatusPill tone="neutral" label="Finding you" />} count={gate.kitchen.orderCount} />
          <KitchenHeader kitchen={gate.kitchen} />
          <Body muted>Getting your location. Keep GPS on and wait a moment.</Body>
          <NavigateButton kitchen={gate.kitchen} />
        </GateFrame>
      );

    case 'tooFar':
      return (
        <GateFrame>
          <StatusRow left={<StatusPill tone="attention" label={`${formatDistance(gate.distanceM)} away`} />} count={gate.kitchen.orderCount} />
          <KitchenHeader kitchen={gate.kitchen} />
          <DistanceTrack distanceM={gate.distanceM} />
          <Body>
            Move within {proximityM} m of {gate.kitchen.name} to mark attendance for {slot.meal}.
          </Body>
          <NavigateButton kitchen={gate.kitchen} />
        </GateFrame>
      );

    case 'ready':
      return (
        <GateFrame>
          <StatusRow
            left={<StatusPill tone="open" label={`${slot.meal} is open`} iconXml={pillOpenSvg} />}
            count={gate.kitchen ? gate.kitchen.orderCount : null}
          />
          {gate.kitchen ? (
            <>
              <KitchenHeader kitchen={gate.kitchen} />
              <DistanceTrack distanceM={gate.distanceM} />
            </>
          ) : (
            <Body muted>No pickups assigned yet.</Body>
          )}
          <NoteBox>
            {`Take a selfie to start your shift. Your location is recorded with it.${
              gate.distanceM !== null ? ` You are ${formatDistance(gate.distanceM)} from the kitchen.` : ''
            }`}
          </NoteBox>
          <ActionButton label="Take attendance selfie" iconXml={cameraSvg} busy={busy} onPress={onTakeAttendance} />
        </GateFrame>
      );
  }
}
