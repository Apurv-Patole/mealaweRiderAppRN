import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import { SUPPORT_TEL_URL } from '@/config/support';
import { tintSvg } from '@/features/orders/home/svgTint';
import { useOrdersStore } from '@/features/orders/ordersStore';
import { canSubmitCancel, CANCEL_REASONS } from '@/features/trip/cancelReason';
import { callAdminSvg, closeSheetSvg, reasonCallSvg, reasonKitchenSvg, reasonLocationSvg, reasonOtherSvg, reasonVehicleSvg, selectedCheckSvg, sendChatSvg } from '@/features/trip/ui/cancelSvgSources';
import { requestCancel } from '@/features/trip/tripActions';
import { HttpError } from '@/services/http';
import { FONT_FAMILY } from '@/theme';
import { haptics } from '@/utils/haptics';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

/** The colours written inside the exported reason icons; `ThemedSvg` turns them light in dark mode. */
const INK_HEX = '#171c19';
const ICON_GREEN = '#037f56';
/** Where the dimmed page behind the sheet still shows, as in the design (about 172 pt on an 844 pt screen). */
const MIN_PEEK = 120;

/** Icons for the five reasons, in the same order as `CANCEL_REASONS`. Each is drawn dark and turns green when chosen. */
const REASON_ICONS = [
  { xml: tintSvg(reasonCallSvg, ICON_GREEN, INK_HEX), width: 20, height: 20 },
  { xml: reasonLocationSvg, width: 15, height: 18.33 },
  { xml: reasonKitchenSvg, width: 20, height: 20 },
  { xml: reasonVehicleSvg, width: 20, height: 20 },
  { xml: reasonOtherSvg, width: 20, height: 20 },
] as const;

function messageFor(error: unknown): string {
  return error instanceof HttpError || error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

function ReasonOption({ label, icon, selected, onPress }: { label: string; icon: (typeof REASON_ICONS)[number]; selected: boolean; onPress: () => void }) {
  const C = useRegisterColors();
  const xml = selected ? tintSvg(icon.xml, INK_HEX, ICON_GREEN) : icon.xml;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? C.green : C.border,
        backgroundColor: selected ? C.mintBannerBg : C.card,
      }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 20, height: 20, alignItems: 'center', justifyContent: 'center' }}>
          <SvgXml xml={xml} width={icon.width} height={icon.height} />
        </View>
        <AppText style={{ flex: 1, color: selected ? C.greenInk : C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 14.5, lineHeight: 21.75 }}>{label}</AppText>
      </View>
      {selected ? <SvgXml xml={selectedCheckSvg} width={20} height={20} /> : null}
    </Pressable>
  );
}

/** Asks admin to cancel or reassign an order the rider cannot deliver, as a sheet over the order. Admin's decision arrives as a notification. */
export default function CancelRequestScreen() {
  const C = useRegisterColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const order = useOrdersStore(
    (state) => state.orders.find((candidate) => candidate.id === id) ?? state.lateOrders.find((candidate) => candidate.id === id),
  );

  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportUrl = SUPPORT_TEL_URL;
  const close = () => router.back();
  const canSend = canSubmitCancel(reason, note);

  async function submit() {
    if (!order || busy) return;
    setBusy(true);
    setError(null);
    try {
      await requestCancel(order, reason, note);
      haptics.confirm();
      setSent(true);
    } catch (caught: unknown) {
      haptics.error();
      setError(messageFor(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      <Stack.Screen options={{ headerShown: false, presentation: 'transparentModal', animation: 'slide_from_bottom' }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={close}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(23,28,25,0.55)' }}
      />

      <KeyboardAvoidingView behavior="padding">
        <View style={{ maxHeight: height - MIN_PEEK, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: C.card, overflow: 'hidden' }}>
          <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: C.fieldBorder }} />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 24), gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <AppText variant="h1" accessibilityRole="header" style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 22, lineHeight: 27.5 }}>
                  Ask admin
                </AppText>
                <AppText style={{ color: C.muted, fontSize: 13.5, lineHeight: 19, paddingTop: 4 }}>
                  {order
                    ? `Tell us why you cannot deliver order #${order.orderNo}. The admin will get back to you.`
                    : 'This order is no longer on your list.'}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                onPress={close}
                style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' }}>
                <SvgXml xml={closeSheetSvg} width={16} height={16} />
              </Pressable>
            </View>

            {!order ? null : sent ? (
              <View style={{ gap: 16 }}>
                <View style={{ gap: 4, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.canvas }}>
                  <AppText variant="title" style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 16, lineHeight: 24 }}>
                    Request sent
                  </AppText>
                  <AppText style={{ color: C.body, fontSize: 14, lineHeight: 21 }}>
                    Mealawe support will review it and you will get a notification with their decision. Keep the order safe until then.
                  </AppText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to order"
                  onPress={close}
                  style={{ height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: C.green }}>
                  <AppText style={{ color: C.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 22.5 }}>Back to order</AppText>
                </Pressable>
              </View>
            ) : (
              <>
                <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
                  {CANCEL_REASONS.map((label, index) => (
                    <ReasonOption
                      key={label}
                      label={label}
                      icon={REASON_ICONS[index] ?? REASON_ICONS[REASON_ICONS.length - 1]!}
                      selected={reason === label}
                      onPress={() => setReason(reason === label ? '' : label)}
                    />
                  ))}
                </View>

                <View style={{ gap: 6 }}>
                  <AppText style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20 }}>
                    Add a note <AppText style={{ color: C.muted, fontFamily: FONT_FAMILY.regular, fontSize: 14, lineHeight: 20 }}>(optional)</AppText>
                  </AppText>
                  <TextInput
                    accessibilityLabel="Add a note, optional"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    textAlignVertical="top"
                    placeholder="e.g. Phone is switched off since 2:40 PM"
                    placeholderTextColor={C.placeholder}
                    style={{
                      minHeight: 64,
                      padding: 13,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: C.fieldBorder,
                      backgroundColor: C.card,
                      color: C.ink,
                      fontFamily: FONT_FAMILY.regular,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  />
                </View>

                {error ? (
                  <AppText accessibilityLiveRegion="polite" style={{ color: C.required, fontSize: 13, lineHeight: 19 }}>
                    {error}
                  </AppText>
                ) : null}

                <View style={{ gap: 10 }}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send request"
                    accessibilityState={{ disabled: !canSend || busy, busy }}
                    disabled={!canSend || busy}
                    onPress={() => void submit()}
                    style={({ pressed }) => ({
                      height: 48,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      borderRadius: 12,
                      backgroundColor: C.green,
                      opacity: !canSend || busy ? 0.5 : pressed ? 0.88 : 1,
                    })}>
                    <SvgXml xml={sendChatSvg} width={14.67} height={13.65} />
                    <AppText style={{ color: C.onGreen, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 22.5 }}>
                      {busy ? 'Sending…' : 'Send Request'}
                    </AppText>
                  </Pressable>
                  {supportUrl ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Call admin"
                      onPress={() => void Linking.openURL(supportUrl)}
                      style={({ pressed }) => ({
                        height: 48,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: C.green,
                        opacity: pressed ? 0.88 : 1,
                      })}>
                      <SvgXml xml={callAdminSvg} width={16} height={16} />
                      <AppText style={{ color: C.greenInk, fontFamily: FONT_FAMILY.bold, fontSize: 15, lineHeight: 22.5 }}>Call admin</AppText>
                    </Pressable>
                  ) : null}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
