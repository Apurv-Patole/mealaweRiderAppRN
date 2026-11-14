import { Text, type TextProps } from 'react-native';

import { typography } from '@/theme/typography';

import { HEADING_VARIANTS, MAX_FONT_SCALE, type TextVariant } from './textA11y';

export type { TextVariant };
export type TextTone = 'default' | 'muted' | 'primary' | 'danger' | 'inverse';

const TONE_CLASS: Record<TextTone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  danger: 'text-danger',
  inverse: 'text-primary-foreground',
};

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  className?: string;
}

/** The one text component: Plus Jakarta Sans type scale from the variant, colour from the tone. */
export function AppText({ variant = 'body', tone = 'default', className = '', style, ...props }: AppTextProps) {
  return (
    <Text
      accessibilityRole={HEADING_VARIANTS.includes(variant) ? 'header' : undefined}
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      className={`${TONE_CLASS[tone]} ${className}`}
      style={[typography[variant], style]}
      {...props}
    />
  );
}
