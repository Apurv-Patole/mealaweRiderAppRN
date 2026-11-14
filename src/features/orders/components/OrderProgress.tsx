import { View } from 'react-native';
import { SvgXml } from '@/components/ThemedSvg';

import { AppText } from '@/components/ui';
import { formatClockFromIso } from '@/lib/dates';
import { FONT_FAMILY } from '@/theme';

import { DashedLine } from '../home/DashedLine';
import { checkStepSvg } from '../home/detailSvgSources';
import { HOME_METRICS } from '../home/homeTheme';
import type { RiderOrder } from '../orderModel';
import { currentStep, PROGRESS_STEPS, stepTimeIso } from '../orderProgress';
import { useDetailColors, useHomeColors } from '@/features/orders/home/useHomeColors';

const DOT = 24;

type StepState = 'done' | 'active' | 'pending';

/** A finished step is a green tick, the current one a ringed dot, the rest empty rings. */
function Dot({ state }: { state: StepState }) {
  const D = useDetailColors();
  const C = useHomeColors();
  if (state === 'done') {
    return (
      <View style={{ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }}>
        <SvgXml xml={checkStepSvg} width={14} height={14} />
      </View>
    );
  }
  const active = state === 'active';
  return (
    <View
      style={{
        width: DOT,
        height: DOT,
        borderRadius: DOT / 2,
        borderWidth: 2,
        borderColor: active ? C.greenInk : D.pending,
        backgroundColor: C.card,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {active ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.green }} /> : null}
    </View>
  );
}

/** One half-connector next to a dot: solid green once the step before it is done, dashed grey otherwise. */
function Line({ solid, hidden }: { solid: boolean; hidden: boolean }) {
  const D = useDetailColors();
  const C = useHomeColors();
  if (hidden) return <View style={{ flex: 1 }} />;
  if (solid) return <View style={{ flex: 1, height: 2, backgroundColor: C.green }} />;
  return <DashedLine color={D.pending} dash={4} pairs={20} style={{ flex: 1 }} />;
}

/** The five stages of an order as a row of dots with labels; finished stages show the time they happened. `deliveredAt` fills in the last time when the server has not reported it yet. */
export function OrderProgress({ order, deliveredAt = null }: { order: RiderOrder; deliveredAt?: string | null }) {
  const D = useDetailColors();
  const C = useHomeColors();
  const cancelled = order.lifecycle === 'cancelled';
  const step = currentStep(order);
  const last = PROGRESS_STEPS.length - 1;

  const stateOf = (index: number): StepState => (cancelled ? 'pending' : step > index ? 'done' : step === index ? 'active' : 'pending');

  return (
    <View
      accessible
      accessibilityLabel={`Order progress: step ${step} of ${PROGRESS_STEPS.length}`}
      style={{
        paddingTop: 21,
        paddingBottom: 17,
        paddingHorizontal: 17,
        borderRadius: HOME_METRICS.radius,
        borderWidth: 1,
        borderColor: C.border,
        backgroundColor: C.card,
        shadowColor: '#000000',
        shadowOpacity: 0.05,
        shadowRadius: 1,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}>
      <View style={{ flexDirection: 'row' }}>
        {PROGRESS_STEPS.map((candidate, position) => {
          const state = stateOf(candidate.index);
          const previousDone = position > 0 && stateOf(PROGRESS_STEPS[position - 1]?.index ?? 0) === 'done';
          const time = formatClockFromIso(stepTimeIso(order, candidate.index) ?? (candidate.index === PROGRESS_STEPS.length ? deliveredAt : null) ?? '');
          return (
            <View key={candidate.index} style={{ flex: 1, alignItems: 'center' }}>
              <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
                <Line solid={previousDone} hidden={position === 0} />
                <Dot state={state} />
                <Line solid={state === 'done'} hidden={position === last} />
              </View>
              <AppText
                variant="caption"
                numberOfLines={2}
                style={{
                  marginTop: 8,
                  textAlign: 'center',
                  color: state === 'active' ? C.title : state === 'done' ? D.stepInk : D.subtle,
                  fontFamily: state === 'active' ? FONT_FAMILY.bold : state === 'done' ? FONT_FAMILY.medium : FONT_FAMILY.regular,
                  fontSize: 11,
                  lineHeight: 13.75,
                }}>
                {candidate.label}
              </AppText>
              {time && state !== 'pending' ? (
                <AppText
                  variant="caption"
                  style={{
                    marginTop: 2,
                    textAlign: 'center',
                    color: state === 'active' ? D.stepInk : D.subtle,
                    fontFamily: state === 'active' ? FONT_FAMILY.medium : FONT_FAMILY.regular,
                    fontSize: 10,
                    lineHeight: 12.5,
                  }}>
                  {time}
                </AppText>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
