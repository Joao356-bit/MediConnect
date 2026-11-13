import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppCardProps = PropsWithChildren<ViewProps> & { padded?: boolean; elevated?: boolean };

export function AppCard({ children, padded = true, elevated = true, style, ...props }: AppCardProps) {
  const colors = useTheme();
  return (
    <View
      {...props}
      style={[
        styles.card,
        { backgroundColor: colors.backgroundElement, borderColor: colors.border },
        padded && styles.padded,
        elevated && Shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.large, overflow: 'hidden' },
  padded: { padding: Spacing.four },
});
