import { useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { digitsOnly } from '@/features/auth';
import { FONT_FAMILY } from '@/theme';

import { isValidIfsc, isValidUpiId, withDocument, type DocumentFile, type DocumentKey } from '../leadForm';
import { InFieldButton, PassbookProof, UpiQrTile, VisibilityLock } from '../ui/BankParts';
import { RegisterCard } from '../ui/RegisterCard';
import { RegisterField } from '../ui/RegisterField';
import { TrustNote } from '../ui/RegisterParts';
import { holderCheckSvg, tileUpiSvg } from '../ui/svgSourcesBank';
import { tileCardSvg } from '../ui/svgSourcesDocs';
import type { StepProps } from './types';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

const IFSC_LENGTH = 11;
const ACCOUNT_NO_MAX = 18;
const CARD_PADDING = 16;
/** Verify buttons only check the format; nothing is looked up on a server. */
type FormatCheck = 'idle' | 'valid' | 'invalid';

/** The design's lime "SPEED" pill beside the UPI card title. */
function SpeedPill() {
  const C = useRegisterColors();
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: C.limePill }}>
      <AppText variant="caption" style={{ color: C.limePillInk, fontFamily: FONT_FAMILY.semibold, fontSize: 11, lineHeight: 16, letterSpacing: 0.55 }}>
        SPEED
      </AppText>
    </View>
  );
}

/** The UPI card: its own header (tile, title, pill, line of copy), the UPI ID field and the QR tile. */
function UpiCard({ upiId, documents, onUpiChange, onDocument }: {
  upiId: string;
  documents: StepProps['draft']['documents'];
  onUpiChange: (value: string) => void;
  onDocument: (file: DocumentFile | undefined) => void;
}) {
  const C = useRegisterColors();
  const [check, setCheck] = useState<FormatCheck>('idle');

  function verify() {
    setCheck(isValidUpiId(upiId) ? 'valid' : 'invalid');
  }

  return (
    <View
      style={{
        padding: 17,
        gap: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.card,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
        overflow: 'hidden',
      }}>
      <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ width: 32.66, height: 40, borderRadius: 8, backgroundColor: C.upiTile, alignItems: 'center', justifyContent: 'center' }}>
          <SvgXml xml={tileUpiSvg} width={16} height={20} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <AppText variant="title" style={{ color: C.ink, fontFamily: FONT_FAMILY.bold, fontSize: 16, lineHeight: 20 }}>
              Instant UPI Payout
            </AppText>
            <SpeedPill />
          </View>
          <AppText variant="caption" style={{ color: C.body, fontSize: 11, lineHeight: 16 }}>
            Recommended for daily fuel incentives and instant micro-transfers
          </AppText>
        </View>
      </View>

      <View style={{ gap: 14 }}>
        <RegisterField
          label="UPI ID (VPA)"
          placeholder="mobile@upi or name@okaxis"
          value={upiId}
          onChangeText={(value) => {
            setCheck('idle');
            onUpiChange(value.replace(/\s/g, ''));
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          paddingRight={113}
          trailingRight={6}
          trailing={<InFieldButton label="Verify UPI" tone="lime" onPress={verify} />}
          hint={check === 'valid' ? 'UPI ID format looks right' : 'Works with GPay, PhonePe, Paytm, BHIM'}
          hintTone={check === 'valid' ? 'success' : 'muted'}
          error={check === 'invalid' ? 'Enter a UPI ID like name@okaxis' : null}
        />
        <UpiQrTile file={documents.upiQrUrl} onChange={onDocument} />
      </View>
    </View>
  );
}

/** Step 4: where weekly earnings are paid: bank account details and a UPI ID (Figma "Reg (4)"). */
export function BankStep({ draft, errors, update }: StepProps) {
  const [accountHidden, setAccountHidden] = useState(true);
  const [ifscCheck, setIfscCheck] = useState<FormatCheck>('idle');
  const setDoc = (key: DocumentKey) => (file: DocumentFile | undefined) =>
    update({ documents: withDocument(draft.documents, key, file) });

  const ifscError = errors.bankIfscCode ?? (ifscCheck === 'invalid' ? 'Enter a valid IFSC code, for example SBIN0001234' : null);

  return (
    <>
      <RegisterCard
        title="Direct Bank Transfer"
        subtitle="NEFT/RTGS/IMPS primary deposit"
        icon={{ xml: tileCardSvg, width: 16.45, height: 13.45 }}
        tag="100% Secure & encrypted"
        padding={CARD_PADDING}
        shadow={false}>
        <View style={{ gap: 14 }}>
          <RegisterField
            label="Account holder name"
            placeholder="As printed on your passbook"
            value={draft.bankAccountHolder}
            onChangeText={(bankAccountHolder) => update({ bankAccountHolder })}
            autoCapitalize="words"
            paddingRight={41}
            trailing={draft.bankAccountHolder.trim().length >= 2 ? <SvgXml xml={holderCheckSvg} width={18.33} height={17.5} /> : undefined}
            hint="Must match the registered legal identity document name"
          />
          <RegisterField
            label="Bank name"
            placeholder="e.g. State Bank of India"
            value={draft.bankName}
            onChangeText={(bankName) => update({ bankName })}
            autoCapitalize="words"
          />
          <RegisterField
            label="Bank account number"
            placeholder="e.g. 109283746501"
            value={draft.bankAccountNo}
            onChangeText={(value) => update({ bankAccountNo: digitsOnly(value, ACCOUNT_NO_MAX) })}
            keyboardType="number-pad"
            secureTextEntry={accountHidden}
            paddingRight={41}
            trailing={<VisibilityLock hidden={accountHidden} onToggle={() => setAccountHidden((hidden) => !hidden)} />}
          />
          <RegisterField
            label="Confirm account number"
            placeholder="Re-enter account number"
            value={draft.bankAccountNoConfirm}
            onChangeText={(value) => update({ bankAccountNoConfirm: digitsOnly(value, ACCOUNT_NO_MAX) })}
            keyboardType="number-pad"
            secureTextEntry={accountHidden}
            error={errors.bankAccountNoConfirm}
          />
          <RegisterField
            label="IFSC code"
            placeholder="E.G. SBIN0001234"
            value={draft.bankIfscCode}
            onChangeText={(value) => {
              setIfscCheck('idle');
              update({ bankIfscCode: value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, IFSC_LENGTH) });
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            paddingRight={65}
            trailingRight={6}
            trailing={<InFieldButton label="Verify" tone="green" onPress={() => setIfscCheck(isValidIfsc(draft.bankIfscCode) ? 'valid' : 'invalid')} />}
            hint={ifscCheck === 'valid' ? 'IFSC format looks right' : undefined}
            hintTone="success"
            error={ifscError}
          />
          <RegisterField
            label="Branch name"
            placeholder="e.g. Balewadi, Pune"
            value={draft.bankBranch}
            onChangeText={(bankBranch) => update({ bankBranch })}
            autoCapitalize="words"
          />
          <PassbookProof file={draft.documents.bankProofUrl} onChange={setDoc('bankProofUrl')} />
        </View>
      </RegisterCard>

      <UpiCard upiId={draft.upiId} documents={draft.documents} onUpiChange={(upiId) => update({ upiId })} onDocument={setDoc('upiQrUrl')} />

      <TrustNote message="Documents are stored securely complying with Mealawe privacy protocol. They will never be shared publicly." />
    </>
  );
}
