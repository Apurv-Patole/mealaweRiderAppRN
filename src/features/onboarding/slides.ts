/** Onboarding copy, kept apart from the screen so it is easy to review and translate. */
export type SlideIcon = 'shift' | 'proof' | 'earnings';

export interface OnboardingSlide {
  id: string;
  icon: SlideIcon;
  title: string;
  body: string;
}

export const ONBOARDING_SLIDES: readonly OnboardingSlide[] = [
  {
    id: 'shift',
    icon: 'shift',
    title: 'Start your shift on time',
    body: 'Take attendance at the kitchen with a selfie, and your shift starts. Early logins earn a bonus.',
  },
  {
    id: 'proof',
    icon: 'proof',
    title: 'Pick up and deliver with proof',
    body: 'Photograph each pickup and delivery. Customers see their order moving in real time.',
  },
  {
    id: 'earnings',
    icon: 'earnings',
    title: 'Track every rupee you earn',
    body: 'Incentives, deductions and salary in one wallet. Every credit shows with its balance.',
  },
];
