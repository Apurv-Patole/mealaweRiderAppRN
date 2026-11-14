import { useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { digitsOnly } from '@/features/auth';

import { withDocument, type DocumentFile, type DocumentKey } from '../leadForm';
import { DocumentSlot, DocumentUploadRow } from '../ui/DocumentSlots';
import { aadhaarDisplay, AADHAAR_LENGTH, isCompleteAadhaar, normaliseLicence, normalisePan } from '../ui/idFormat';
import { RegisterCard } from '../ui/RegisterCard';
import { RegisterField } from '../ui/RegisterField';
import { TrustNote } from '../ui/RegisterParts';
import { checkCircleSvg, fieldIdSvg, lockSmallSvg, tileCardSvg, tileLicenceSvg, tilePanSvg } from '../ui/svgSourcesDocs';
import type { StepProps } from './types';
import { useRegisterColors } from '@/features/register/ui/useRegisterColors';

const CARD_PADDING = 16;
const ID_ICON = { xml: fieldIdSvg, width: 17, height: 17, left: 13.5 } as const;

/** "Encrypted" with a small lock, on the right of the Aadhaar number label. */
function EncryptedHint() {
  const C = useRegisterColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <SvgXml xml={lockSmallSvg} width={9.57} height={12.45} />
      <AppText variant="caption" style={{ color: C.muted, fontSize: 11, lineHeight: 16 }}>
        Encrypted
      </AppText>
    </View>
  );
}

/** Step 3: Aadhaar, PAN and driving licence numbers with their photos (Figma "Reg (3)"). */
export function KycStep({ draft, errors, update }: StepProps) {
  const [aadhaarFocused, setAadhaarFocused] = useState(false);
  const setDoc = (key: DocumentKey) => (file: DocumentFile | undefined) =>
    update({ documents: withDocument(draft.documents, key, file) });

  return (
    <>
      <RegisterCard
        title="Aadhaar Card"
        subtitle="Front and back copy"
        icon={{ xml: tileCardSvg, width: 16.45, height: 13.45 }}
        padding={CARD_PADDING}
        shadow={false}>
        <RegisterField
          label="12-digit Aadhaar number"
          labelAction={<EncryptedHint />}
          filled
          icon={ID_ICON}
          paddingLeft={41}
          paddingRight={41}
          trailing={isCompleteAadhaar(draft.aadharNo) && !errors.aadharNo ? <SvgXml xml={checkCircleSvg} width={16.67} height={16.67} /> : undefined}
          placeholder="1234 5678 9012"
          value={aadhaarDisplay(draft.aadharNo, aadhaarFocused)}
          onChangeText={(value) => update({ aadharNo: digitsOnly(value, AADHAAR_LENGTH) })}
          onFocus={() => setAadhaarFocused(true)}
          onBlur={() => setAadhaarFocused(false)}
          keyboardType="number-pad"
          error={errors.aadharNo}
        />
        <DocumentSlot
          side="front"
          label="Front Side"
          emptyTitle="Upload Aadhaar front"
          emptyHint="Clear photo of the side with your name"
          nameHint="aadhar-front"
          file={draft.documents.aadharFrontUrl}
          onChange={setDoc('aadharFrontUrl')}
        />
        <DocumentSlot
          side="back"
          label="Back Side"
          emptyTitle="Upload Aadhaar back"
          emptyHint="Clear address page photo"
          nameHint="aadhar-back"
          file={draft.documents.aadharBackUrl}
          onChange={setDoc('aadharBackUrl')}
        />
      </RegisterCard>

      <RegisterCard
        title="PAN Card"
        subtitle="Optional for onboarding, needed for payout."
        icon={{ xml: tilePanSvg, width: 18, height: 18 }}
        tag="Required for tax & TDS"
        tagTone="grey"
        padding={CARD_PADDING}
        shadow={false}>
        <RegisterField
          label="PAN Number"
          filled
          icon={ID_ICON}
          paddingLeft={41}
          placeholder="e.g. ABCDE1234F"
          value={draft.panNo}
          onChangeText={(panNo) => update({ panNo: normalisePan(panNo) })}
          autoCapitalize="characters"
          autoCorrect={false}
          error={errors.panNo}
        />
        <DocumentUploadRow
          photoLabel="PAN photo"
          uploadLabel="Upload PAN photo"
          nameHint="pan"
          file={draft.documents.panProofUrl}
          onChange={setDoc('panProofUrl')}
        />
      </RegisterCard>

      <RegisterCard
        title="Driving Licence"
        subtitle="Unlock fast delivery slot access"
        icon={{ xml: tileLicenceSvg, width: 15.25, height: 13.33 }}
        tag="For 2-Wheeler Riders"
        padding={CARD_PADDING}
        shadow={false}>
        <RegisterField
          label="Driving Licence Number"
          filled
          icon={ID_ICON}
          paddingLeft={41}
          placeholder="e.g. MH12 US2727"
          value={draft.drivingLicenceNo}
          onChangeText={(drivingLicenceNo) => update({ drivingLicenceNo: normaliseLicence(drivingLicenceNo) })}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <DocumentUploadRow
          photoLabel="Licence photo"
          uploadLabel="Upload Licence photo"
          nameHint="driving-licence"
          file={draft.documents.drivingLicenceUrl}
          onChange={setDoc('drivingLicenceUrl')}
        />
      </RegisterCard>

      <TrustNote message="Documents are stored securely complying with Mealawe privacy protocol. They will never be shared publicly." />
    </>
  );
}
