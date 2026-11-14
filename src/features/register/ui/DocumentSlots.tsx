import { Image, Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import type { DocumentFile } from '../leadForm';
import { pickAndReport } from '../usePickDocument';
import { cameraCircleSvg, gallerySmallSvg, gallerySquareSvg, labelBackSvg, labelFrontSvg, overlayCheckSvg, retakeSvg, takePhotoSvg, trashSvg, uploadCameraSvg } from './svgSourcesDocs';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

type OnChange = (file: DocumentFile | undefined) => void;

const SLOT_RADIUS = 12;
const THUMB_HEIGHT = 96;
const BUTTON_RADIUS = 8;

function SmallTag({ text, tone }: { text: string; tone: 'green' | 'grey' }) {
  const C = useRegisterColors();
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: tone === 'green' ? C.requiredTagBg : C.tagGrey }}>
      <AppText variant="caption" style={{ color: tone === 'green' ? C.greenDeep : C.muted, fontSize: 11, lineHeight: 16 }}>
        {text}
      </AppText>
    </View>
  );
}

function ActionText({ xml, width, height, label, color, onPress }: { xml: string; width: number; height: number; label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
      <SvgXml xml={xml} width={width} height={height} />
      <AppText variant="caption" style={{ color, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** A photo that has been added: thumbnail with a tick, and Retake and Remove actions. */
export function UploadedPhotoCard({
  label,
  labelIconXml,
  file,
  nameHint,
  onChange,
}: {
  label: string;
  labelIconXml: string;
  file: DocumentFile;
  nameHint: string;
  onChange: OnChange;
}) {
  const C = useRegisterColors();
  return (
    <View style={{ gap: 12, padding: 13, borderRadius: SLOT_RADIUS, borderWidth: 1, borderColor: C.border, backgroundColor: C.canvas }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <SvgXml xml={labelIconXml} width={12.27} height={12.27} />
          <AppText variant="caption" style={{ color: C.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
            {label}
          </AppText>
        </View>
        <SmallTag text="✓ Photo attached" tone="green" />
      </View>
      <View
        style={{ height: THUMB_HEIGHT, borderRadius: BUTTON_RADIUS, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, overflow: 'hidden' }}>
        <Image source={{ uri: file.uri }} accessibilityLabel={`${label} photo`} style={{ width: '100%', height: '100%', opacity: 0.85 }} resizeMode="cover" />
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: C.photoOverlay, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
            <SvgXml xml={overlayCheckSvg} width={12.2} height={9} />
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingTop: 5, borderTopWidth: 1, borderTopColor: C.border }}>
        <ActionText xml={retakeSvg} width={10.97} height={10.94} label="Retake" color={C.greenDeep} onPress={() => void pickAndReport('camera', nameHint, onChange)} />
        <ActionText xml={trashSvg} width={11.3} height={12.37} label="Remove" color={C.required} onPress={() => onChange(undefined)} />
      </View>
    </View>
  );
}

/** Outlined 36 pt button with an icon. `fill` makes it share the row equally; off, it hugs its label. */
export function OutlinedButton({
  xml,
  width,
  height,
  label,
  fill = true,
  onPress,
}: {
  xml: string;
  width: number;
  height: number;
  label: string;
  fill?: boolean;
  onPress: () => void;
}) {
  const C = useRegisterColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        flex: fill ? 1 : undefined,
        height: 36,
        paddingHorizontal: fill ? 0 : 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: BUTTON_RADIUS,
        borderWidth: 1,
        borderColor: C.fieldBorder,
      }}>
      <SvgXml xml={xml} width={width} height={height} />
      <AppText variant="caption" style={{ color: C.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

interface DocumentSlotProps {
  side: 'front' | 'back';
  label: string;
  emptyTitle: string;
  emptyHint: string;
  nameHint: string;
  file: DocumentFile | undefined;
  onChange: OnChange;
}

/** One side of a two-sided ID: a dashed upload slot (take photo or gallery) that becomes a photo card once filled. */
export function DocumentSlot({ side, label, emptyTitle, emptyHint, nameHint, file, onChange }: DocumentSlotProps) {
  const C = useRegisterColors();
  const labelIcon = side === 'front' ? labelFrontSvg : labelBackSvg;
  if (file) return <UploadedPhotoCard label={label} labelIconXml={labelIcon} file={file} nameHint={nameHint} onChange={onChange} />;

  return (
    <View
      style={{
        gap: 12,
        padding: 14,
        borderRadius: SLOT_RADIUS,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: C.slotBorder,
        backgroundColor: C.card,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <SvgXml xml={labelIcon} width={12.27} height={12.27} />
          <AppText variant="caption" style={{ color: C.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
            {label}
          </AppText>
        </View>
        <SmallTag text="Optional" tone="grey" />
      </View>
      <View style={{ alignItems: 'center', gap: 4, paddingVertical: 8 }}>
        <View
          style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.canvas, alignItems: 'center', justifyContent: 'center' }}>
          <SvgXml xml={cameraCircleSvg} width={17} height={15.34} />
        </View>
        <AppText variant="caption" style={{ color: C.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
          {emptyTitle}
        </AppText>
        <AppText variant="caption" style={{ color: C.placeholder, fontSize: 11, lineHeight: 16 }}>
          {emptyHint}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 4 }}>
        <OutlinedButton xml={takePhotoSvg} width={13.6} height={12.27} label="Take photo" onPress={() => void pickAndReport('camera', nameHint, onChange)} />
        <OutlinedButton xml={gallerySmallSvg} width={13.79} height={13.79} label="Gallery" onPress={() => void pickAndReport('library', nameHint, onChange)} />
      </View>
    </View>
  );
}

interface DocumentUploadRowProps {
  /** For example "PAN photo"; also the label on the attached-photo card. */
  photoLabel: string;
  uploadLabel: string;
  nameHint: string;
  file: DocumentFile | undefined;
  onChange: OnChange;
}

/** A single-photo document: one wide "Upload ... photo" button plus a square gallery button. */
export function DocumentUploadRow({ photoLabel, uploadLabel, nameHint, file, onChange }: DocumentUploadRowProps) {
  const C = useRegisterColors();
  if (file) return <UploadedPhotoCard label={photoLabel} labelIconXml={labelFrontSvg} file={file} nameHint={nameHint} onChange={onChange} />;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={uploadLabel}
        onPress={() => void pickAndReport('camera', nameHint, onChange)}
        style={{
          flex: 1,
          height: 44,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 13,
          borderRadius: BUTTON_RADIUS,
          borderWidth: 1,
          borderColor: C.fieldBorder,
        }}>
        <SvgXml xml={uploadCameraSvg} width={15.3} height={13.8} />
        <AppText variant="caption" style={{ color: C.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
          {uploadLabel}
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${photoLabel} from gallery`}
        onPress={() => void pickAndReport('library', nameHint, onChange)}
        style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: BUTTON_RADIUS, borderWidth: 1, borderColor: C.fieldBorder }}>
        <SvgXml xml={gallerySquareSvg} width={15.5} height={15.5} />
      </Pressable>
    </View>
  );
}
