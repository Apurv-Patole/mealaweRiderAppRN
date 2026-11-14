import { AppText } from './AppText';

/** The heading above a group of cards: sentence case, bold, no tracking. */
export function SectionTitle({ children }: { children: string }) {
  return (
    <AppText variant="title" accessibilityRole="header">
      {children}
    </AppText>
  );
}
