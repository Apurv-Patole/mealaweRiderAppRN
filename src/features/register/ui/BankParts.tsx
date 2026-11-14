import { LockOpen } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import type { DocumentFile } from '../leadForm';
import { pickAndReport } from '../usePickDocument';
import { OutlinedButton, UploadedPhotoCard } from './DocumentSlots';
import { labelFrontSvg } from './svgSourcesDocs';
import { docHintSvg, galleryTallSvg, lockToggleSvg, paperclipSvg, qrSvg, takePhotoSmallSvg } from './svgSourcesBank';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

type OnChange = (file: DocumentFile | undefined) => void;

/** A small solid button inside a field, for example "Verify" at the right end of the IFSC box. */
export function InFieldButton({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone: 'green' | 'lime';
  onPress: () => void;
}) {
  const C = useRegisterColors();
  const lime = tone === 'lime';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={{
        paddingHorizontal: lime ? 12 : 10,
        paddingVertical: lime ? 8 : 6,
        borderRadius: 6,
        backgroundColor: lime ? C.limeBright : C.green,
      }}>
      <AppText variant="caption" style={{ color: lime ? C.limePillInk : C.onGreen, fontFamily: lime ? FONT_FAMILY.bold : FONT_FAMILY.regular, fontSize: 12, lineHeight: 16 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** The lock at the right end of the account number field: tap to show or hide the digits. */
export function VisibilityLock({ hidden, onToggle }: { hidden: boolean; onToggle: () => void }) {
  const C = useRegisterColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hidden ? 'Show account number' : 'Hide account number'}
      hitSlop={10}
      onPress={onToggle}
      style={{ height: 25.5, width: 13.33, alignItems: 'center', justifyContent: 'center' }}>
      {hidden ? <SvgXml xml={lockToggleSvg} width={13.33} height={25.5} /> : <LockOpen size={14} color={C.placeholder} strokeWidth={2} />}
    </Pressable>
  );
}

/** "Passbook copy or cancelled cheque": a dashed-top row with a compact photo tile. */
export function PassbookProof({ file, onChange }: { file: DocumentFile | undefined; onChange: OnChange }) {
  const C = useRegisterColors();
  return (
    <View style={{ gap: 8, paddingTop: 9, borderTopWidth: 1, borderTopColor: C.border, borderStyle: 'dashed' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SvgXml xml={paperclipSvg} width={9.38} height={15} />
          <AppText style={{ flex: 1, color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 14, lineHeight: 20 }}>Passbook copy or cancelled cheque</AppText>
        </View>
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, backgroundColor: C.tile }}>
          <AppText variant="caption" style={{ color: C.muted, fontSize: 11, lineHeight: 16 }}>
            Optional
          </AppText>
        </View>
      </View>
      {file ? (
        <UploadedPhotoCard label="Passbook or cheque" labelIconXml={labelFrontSvg} file={file} nameHint="bank-proof" onChange={onChange} />
      ) : (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: 13,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: C.border,
            backgroundColor: C.canvas,
          }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SvgXml xml={docHintSvg} width={16} height={20} />
            <AppText variant="caption" style={{ flex: 1, color: C.body, fontSize: 11, lineHeight: 13.75 }}>
              Clear photo of account number & IFSC
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <OutlinedButton fill={false} xml={takePhotoSmallSvg} width={13.33} height={12} label="Take photo" onPress={() => void pickAndReport('camera', 'bank-proof', onChange)} />
            <OutlinedButton fill={false} xml={galleryTallSvg} width={10.67} height={13.33} label="Gallery" onPress={() => void pickAndReport('library', 'bank-proof', onChange)} />
          </View>
        </View>
      )}
    </View>
  );
}

/** "UPI QR Code": an optional screenshot of the rider's payment QR. */
export function UpiQrTile({ file, onChange }: { file: DocumentFile | undefined; onChange: OnChange }) {
  const C = useRegisterColors();
  if (file) return <UploadedPhotoCard label="UPI QR code" labelIconXml={labelFrontSvg} file={file} nameHint="upi-qr" onChange={onChange} />;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: 13,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.canvas,
      }}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View
          style={{ width: 28.83, height: 36, borderRadius: 4, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
          <SvgXml xml={qrSvg} width={15} height={15} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="caption" style={{ color: C.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 16 }}>
            UPI QR Code
          </AppText>
          <AppText variant="caption" style={{ color: C.body, fontSize: 11, lineHeight: 16 }}>
            Optional screenshot of your payment QR
          </AppText>
        </View>
      </View>
      <OutlinedButton fill={false} xml={takePhotoSmallSvg} width={13.33} height={12} label="Upload QR" onPress={() => void pickAndReport('library', 'upi-qr', onChange)} />
    </View>
  );
}
