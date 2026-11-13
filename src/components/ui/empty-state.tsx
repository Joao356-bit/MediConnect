import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = { title: string; description: string; action?: React.ReactNode };

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const colors = useTheme();
  return (
    <AppCard style={styles.card}>
      <View style={[styles.icon, { backgroundColor: colors.backgroundSelected }]}>
        <Text style={[styles.iconText, { color: colors.primary }]}>i</Text>
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      {action}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', paddingVertical: Spacing.five, gap: Spacing.two },
  icon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 22, fontWeight: '700' },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  description: { fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 360 },
});
