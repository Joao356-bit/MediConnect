import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatusBadgeProps = { label: string; status: 'success' | 'warning' | 'danger' | 'neutral' };

export function StatusBadge({ label, status }: StatusBadgeProps) {
  const colors = useTheme();
  const palette = {
    success: { background: colors.successBackground, foreground: colors.success },
    warning: { background: colors.warningBackground, foreground: colors.warning },
    danger: { background: colors.dangerBackground, foreground: colors.danger },
    neutral: { background: colors.surfaceMuted, foreground: colors.textSecondary },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}>
      <View style={[styles.dot, { backgroundColor: palette.foreground }]} />
      <Text style={[styles.label, { color: palette.foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '600' },
});
