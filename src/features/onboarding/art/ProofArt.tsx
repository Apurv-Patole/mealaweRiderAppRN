import { Image, View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { FONT_FAMILY } from '@/theme';

import { PROOF_BADGE_GAP, PROOF_LIVE, PROOF_MAP, PROOF_PHOTO, PROOF_PICKUP, PROOF_PIN, PROOF_PIN_DOT, PROOF_RIDER } from './heroLayout';
import { SvgAsset } from './HeroStage';
import { iconArrowSvg, iconCheckSmallSvg, iconReceiptSvg, pinBodySvg, pinDotSvg, proofBaseSvg, proofRoadASvg, proofRoadBSvg, proofRoadCSvg, proofRoadDSvg, proofRoadESvg, proofRoadFSvg, proofRoadGSvg, proofRouteSvg } from './svgSourcesProof';
import { useOnboardingColors } from '@/features/onboarding/useOnboardingColors';

const PHOTO = require('./proof-handover.jpg') as number;

const SHADOW = { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, shadowOpacity: 0.1, elevation: 3 } as const;

/** Slide 2 map: a flat pale base, white roads, and the dotted route from pickup to the customer. */
export function ProofBackdrop() {
  return (
    <>
      <SvgAsset roads xml={proofBaseSvg} rect={{ left: 0, top: 0, width: 390, height: 844 }} />
      <SvgAsset roads xml={proofRoadASvg} rect={PROOF_MAP.roadA} />
      <SvgAsset roads xml={proofRoadBSvg} rect={PROOF_MAP.roadB} />
      <SvgAsset roads xml={proofRoadCSvg} rect={PROOF_MAP.roadC} />
      <SvgAsset roads xml={proofRoadDSvg} rect={PROOF_MAP.roadD} />
      <SvgAsset roads xml={proofRoadESvg} rect={PROOF_MAP.roadE} />
      <SvgAsset roads xml={proofRoadFSvg} rect={PROOF_MAP.roadF} />
      <SvgAsset roads xml={proofRoadGSvg} rect={PROOF_MAP.roadG} />
      <SvgAsset roads xml={proofRouteSvg} rect={PROOF_MAP.route} />
    </>
  );
}

/** Slide 2 hero (Figma node 2003:95): proof-of-handover photo, pickup marker, live rider and destination pin. */
export function ProofHero() {
  const C = useOnboardingColors();
  return (
    <>
      <View accessible accessibilityLabel="Rider handing over an order" style={{ position: 'absolute', left: PROOF_PHOTO.left, top: PROOF_PHOTO.top }}>
        <View
          style={[
            {
              width: PROOF_PHOTO.width,
              height: PROOF_PHOTO.height,
              borderRadius: PROOF_PHOTO.radius,
              borderWidth: 1,
              borderColor: C.pillBorder,
              overflow: 'hidden',
              backgroundColor: C.sheet,
            },
            SHADOW,
          ]}>
          <Image source={PHOTO} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        </View>
        <View
          accessible
          accessibilityLabel="Proof saved"
          style={{
            alignSelf: 'flex-start',
            marginTop: PROOF_BADGE_GAP,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: C.green,
            backgroundColor: C.proofBadge,
          }}>
          <SvgXml xml={iconCheckSmallSvg} width={14} height={14} />
          <AppText variant="caption" style={{ marginLeft: 6, color: C.greenInk, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 18 }}>
            Proof saved
          </AppText>
        </View>
      </View>

      <View
        accessible
        accessibilityLabel="Live for the customer"
        style={{
          position: 'absolute',
          right: PROOF_LIVE.right,
          bottom: PROOF_LIVE.gapAboveSheet,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 15,
          paddingVertical: 9,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: C.liveBadgeBorder,
          backgroundColor: C.liveBadgeGlass,
          shadowColor: '#000000',
          shadowOpacity: 0.05,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.green }} />
        <AppText variant="caption" style={{ marginLeft: 8, color: C.ink, fontFamily: FONT_FAMILY.semibold, fontSize: 12, lineHeight: 18 }}>
          Live for the customer
        </AppText>
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          {
            position: 'absolute',
            left: PROOF_PICKUP.left,
            top: PROOF_PICKUP.top,
            width: PROOF_PICKUP.size,
            height: PROOF_PICKUP.size,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.6)',
            backgroundColor: C.green,
            alignItems: 'center',
            justifyContent: 'center',
          },
          SHADOW,
        ]}>
        <SvgXml xml={iconReceiptSvg} width={24} height={24} />
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ position: 'absolute', left: PROOF_PIN.left, top: PROOF_PIN.top, width: PROOF_PIN.width, height: PROOF_PIN.height }}>
        <SvgXml xml={pinBodySvg} width={PROOF_PIN.width} height={PROOF_PIN.height} />
        <View style={{ position: 'absolute', left: PROOF_PIN_DOT.offset, top: PROOF_PIN_DOT.offset }}>
          <SvgXml xml={pinDotSvg} width={PROOF_PIN_DOT.size} height={PROOF_PIN_DOT.size} />
        </View>
      </View>

      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          position: 'absolute',
          left: PROOF_RIDER.left,
          top: PROOF_RIDER.top,
          width: PROOF_RIDER.halo,
          height: PROOF_RIDER.halo,
          borderRadius: PROOF_RIDER.halo / 2,
          backgroundColor: C.limeHalo,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: C.limeHalo,
          shadowOpacity: 0.4,
          shadowRadius: 15,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
        }}>
        <View
          style={{
            width: PROOF_RIDER.core,
            height: PROOF_RIDER.core,
            borderRadius: PROOF_RIDER.core / 2,
            borderWidth: 2,
            borderColor: C.sheet,
            backgroundColor: C.green,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View style={{ transform: [{ rotate: '-45deg' }] }}>
            <SvgXml xml={iconArrowSvg} width={14} height={14} />
          </View>
        </View>
      </View>
    </>
  );
}
