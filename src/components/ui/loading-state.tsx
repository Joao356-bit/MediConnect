import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LoadingStateProps = { label?: string };

export function LoadingState({ label = 'Carregando...' }: LoadingStateProps) {
  const colors = useTheme();
  return (
    <View style={styles.container} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  label: { fontSize: 13 },
});
