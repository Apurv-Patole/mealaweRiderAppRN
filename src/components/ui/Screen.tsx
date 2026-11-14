import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useColors } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  /** Scroll the content. Off for screens that pin an action bar to the bottom. */
  scroll?: boolean;
  /** Safe-area edges to pad. Tab screens leave the bottom to the native tab bar. */
  edges?: readonly Edge[];
  className?: string;
  /** Pull to refresh (scrolling screens only). */
  onRefresh?: () => void;
  refreshing?: boolean;
}

/** Page background, safe-area padding and the 16 px gutter in one place. */
export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  className = '',
  onRefresh,
  refreshing = false,
}: ScreenProps) {
  const colors = useColors();

  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.background }}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={`gap-4 p-4 ${className}`}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
                progressBackgroundColor={colors.card}
              />
            ) : undefined}>
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 p-4 ${className}`}>{children}</View>
      )}
    </SafeAreaView>
  );
}
