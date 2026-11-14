import { ChevronRight, CircleAlert, CircleCheck, HelpCircle, LogOut, type LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { shadow } from '@/theme/shadows';
import { useColors, type StatusTone } from '@/theme';
import { haptics } from '@/utils/haptics';

import {
  useDialogStore,
  type ConfirmRequest,
  type DialogTone,
  type NoticeRequest,
  type SheetRequest,
} from './dialogStore';

const BACKDROP = 'rgba(8, 12, 20, 0.55)';

const TONE_TILE: Record<DialogTone, StatusTone> = {
  default: 'assigned',
  danger: 'cancelled',
  success: 'done',
  error: 'cancelled',
};

const TONE_ICON: Record<DialogTone, LucideIcon> = {
  default: HelpCircle,
  danger: LogOut,
  success: CircleCheck,
  error: CircleAlert,
};

function Backdrop({ onPress, children, bottom = false }: { onPress: () => void; children: React.ReactNode; bottom?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: BACKDROP, justifyContent: bottom ? 'flex-end' : 'center' }}>
      <Pressable accessibilityLabel="Dismiss" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} onPress={onPress} />
      {children}
    </View>
  );
}

function ConfirmCard({ request, onClose }: { request: ConfirmRequest; onClose: () => void }) {
  const colors = useColors();
  const tone = request.tone ?? 'default';
  const answer = (confirmed: boolean) => {
    if (confirmed) haptics.tap();
    request.resolve(confirmed);
    onClose();
  };

  return (
    <Backdrop onPress={() => answer(false)}>
      <View
        accessibilityViewIsModal
        style={[
          { marginHorizontal: 24, padding: 24, borderRadius: 28, backgroundColor: colors.card, alignItems: 'center', gap: 16 },
          shadow.lifted,
        ]}>
        <IconTile icon={request.icon ?? TONE_ICON[tone]} tone={TONE_TILE[tone]} size={28} tileSize={64} />
        <View className="items-center gap-2">
          <AppText variant="h2" className="text-center">
            {request.title}
          </AppText>
          {request.message ? (
            <AppText tone="muted" className="text-center">
              {request.message}
            </AppText>
          ) : null}
        </View>
        <View className="w-full gap-2 pt-2">
          <Button label={request.confirmLabel} variant={tone === 'danger' ? 'danger' : 'primary'} onPress={() => answer(true)} />
          <Button label={request.cancelLabel} variant="ghost" size="md" onPress={() => answer(false)} />
        </View>
      </View>
    </Backdrop>
  );
}

function NoticeCard({ request, onClose }: { request: NoticeRequest; onClose: () => void }) {
  const colors = useColors();
  const done = () => {
    request.resolve();
    onClose();
  };

  return (
    <Backdrop onPress={done}>
      <View
        accessibilityViewIsModal
        accessibilityLiveRegion="assertive"
        style={[
          { marginHorizontal: 24, padding: 24, borderRadius: 28, backgroundColor: colors.card, alignItems: 'center', gap: 16 },
          shadow.lifted,
        ]}>
        <IconTile icon={request.icon ?? TONE_ICON[request.tone]} tone={TONE_TILE[request.tone]} size={28} tileSize={64} />
        <View className="items-center gap-2">
          <AppText variant="h2" className="text-center">
            {request.title}
          </AppText>
          {request.message ? (
            <AppText tone="muted" className="text-center">
              {request.message}
            </AppText>
          ) : null}
        </View>
        <View className="w-full pt-2">
          <Button label={request.okLabel} onPress={done} />
        </View>
      </View>
    </Backdrop>
  );
}

function SheetCard({ request, onClose }: { request: SheetRequest; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const answer = (value: string | null) => {
    if (value) haptics.tap();
    request.resolve(value);
    onClose();
  };

  return (
    <Backdrop bottom onPress={() => answer(null)}>
      <View
        accessibilityViewIsModal
        style={[
          {
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: insets.bottom + 20,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: colors.card,
            gap: 12,
          },
          shadow.lifted,
        ]}>
        <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
        <View className="gap-1 pb-1">
          <AppText variant="h2">{request.title}</AppText>
          {request.message ? <AppText tone="muted">{request.message}</AppText> : null}
        </View>
        {request.options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={option.hint ? `${option.label}. ${option.hint}` : option.label}
            onPress={() => answer(option.value)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: 16,
              backgroundColor: pressed ? colors.muted : colors.background,
              borderWidth: 1,
              borderColor: colors.border,
            })}>
            {option.icon ? <IconTile icon={option.icon} tone="done" /> : null}
            <View className="flex-1">
              <AppText variant="label">{option.label}</AppText>
              {option.hint ? (
                <AppText variant="caption" tone="muted">
                  {option.hint}
                </AppText>
              ) : null}
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}
        <Button label="Cancel" variant="ghost" size="md" onPress={() => answer(null)} />
      </View>
    </Backdrop>
  );
}

/** Renders whichever dialog was asked for through `dialog.*`. Mounted once, in the root layout. */
export function DialogHost() {
  const current = useDialogStore((state) => state.current);
  const close = useDialogStore((state) => state.close);

  if (!current) return null;

  const dismiss = () => {
    if (current.kind === 'confirm') current.resolve(false);
    else if (current.kind === 'sheet') current.resolve(null);
    else current.resolve();
    close();
  };

  return (
    <Modal transparent visible animationType={current.kind === 'sheet' ? 'slide' : 'fade'} statusBarTranslucent onRequestClose={dismiss}>
      {current.kind === 'confirm' ? <ConfirmCard request={current} onClose={close} /> : null}
      {current.kind === 'notice' ? <NoticeCard request={current} onClose={close} /> : null}
      {current.kind === 'sheet' ? <SheetCard request={current} onClose={close} /> : null}
    </Modal>
  );
}
