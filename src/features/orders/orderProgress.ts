import type { RiderOrder } from './orderModel';

/** The five stages an order passes through, as in the old rider app's progress bar (pure, no React Native imports). */
export interface ProgressStep {
  index: number;
  label: string;
}

export const PROGRESS_STEPS: readonly ProgressStep[] = [
  { index: 1, label: 'Assigned' },
  { index: 2, label: 'Ready' },
  { index: 3, label: 'Picked up' },
  { index: 4, label: 'On the way' },
  { index: 5, label: 'Delivered' },
];

/** Statuses (normalised) whose history entry marks each stage. Stage 1 uses the first history entry. */
const STEP_STATUSES: Record<number, readonly string[]> = {
  2: ['readytodelivery', 'readyfordelivery'],
  3: ['handedovertodeliveryboy', 'outfordelivery'],
  4: ['ontheway'],
  5: ['delivered', 'deliverycompleted'],
};

/** Which stage the order is at, from 1 (assigned) to 5 (delivered). */
export function currentStep(order: Pick<RiderOrder, 'statusKey'>): number {
  switch (order.statusKey) {
    case 'readytodelivery':
    case 'readyfordelivery':
      return 2;
    case 'handedovertodeliveryboy':
    case 'outfordelivery':
      return 3;
    case 'ontheway':
      return 4;
    case 'delivered':
    case 'deliverycompleted':
      return 5;
    default:
      return 1;
  }
}

/** The ISO time recorded for a stage, or null. Delivery falls back to the time the proof photo was taken. */
export function stepTimeIso(order: Pick<RiderOrder, 'statusHistory' | 'proofCapturedAt'>, index: number): string | null {
  const history = order.statusHistory;
  if (index === 1) return history[0]?.at || null;
  const matches = STEP_STATUSES[index] ?? [];
  const entry = [...history].reverse().find((candidate) => matches.includes(candidate.statusKey));
  const at = entry?.at || (index === 5 ? order.proofCapturedAt : null);
  return at || null;
}

export interface NextStep {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Whether the Navigate button should point at the kitchen, the customer, or neither. */
  navigateTo: 'kitchen' | 'customer' | null;
}

/** What the rider should do now, in plain words. */
export function nextStep(
  order: Pick<RiderOrder, 'statusKey' | 'lifecycle'> & { kitchen?: { name: string }; customer?: { name: string; address: string } },
): NextStep {
  if (order.lifecycle === 'cancelled') {
    return { eyebrow: 'Order status', title: 'Order cancelled', subtitle: 'No further action is needed for this order.', navigateTo: null };
  }
  switch (currentStep(order)) {
    case 2:
      return {
        eyebrow: 'Next step',
        title: 'Pick up the order',
        subtitle: `${order.kitchen?.name || 'The kitchen'} marked it ready. Collect it, then photograph the handover.`,
        navigateTo: 'kitchen',
      };
    case 3: {
      const where = [order.customer?.name, order.customer?.address].filter(Boolean).join(', ');
      return {
        eyebrow: 'Next step',
        title: 'Head to the customer',
        subtitle: `${where ? `${where}. ` : ''}Tap start when you leave.`,
        navigateTo: null,
      };
    }
    case 4:
      return {
        eyebrow: 'Next step',
        title: order.customer?.name ? `Deliver to ${order.customer.name}` : 'Deliver to the customer',
        subtitle: 'Mark delivered when the order is in their hands. You will take a photo next.',
        navigateTo: null,
      };
    case 5:
      return { eyebrow: 'Order status', title: 'Delivered', subtitle: 'Great work. This order is complete.', navigateTo: null };
    default:
      return { eyebrow: 'Next step', title: 'Waiting for the kitchen', subtitle: 'The kitchen is still preparing this order.', navigateTo: 'kitchen' };
  }
}
