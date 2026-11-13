import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppHeaderProps = ViewProps & { title: string; subtitle?: string; action?: React.ReactNode };

export function AppHeader({ title, subtitle, action, style, ...props }: AppHeaderProps) {
  const colors = useTheme();
  return (
    <View {...props} style={[styles.container, style]}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {!!subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  copy: { flex: 1, gap: 5 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 21 },
});
