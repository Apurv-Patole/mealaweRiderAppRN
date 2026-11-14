import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';

import { shadow } from '@/theme/shadows';
import { useScheme } from '@/theme';

interface CardProps extends ViewProps {
  children: ReactNode;
  className?: string;
}

/** Rounded surface: 16 px radius, hairline border, soft lift on light backgrounds, 16 px padding. */
export function Card({ children, className = '', style, ...props }: CardProps) {
  const scheme = useScheme();

  return (
    <View
      className={`rounded-2xl border border-border bg-card p-4 ${className}`}
      style={[scheme === 'light' ? shadow.card : null, style]}
      {...props}>
      {children}
    </View>
  );
}
