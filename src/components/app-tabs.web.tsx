import { Link, Slot, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const navigationItems = [
  { href: '/', label: 'Início', icon: '⌂', route: '/' },
  { href: '/patients', label: 'Pacientes', icon: '＋', route: '/patients' },
] as const;

export default function AppTabs() {
  const colors = useTheme();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const compact = width < 900;

  return (
    <View style={[styles.shell, { backgroundColor: colors.background }]}>
      <View style={[styles.sidebar, compact && styles.sidebarCompact, { backgroundColor: colors.backgroundElement, borderRightColor: colors.border }]}>
        <View style={styles.brandRow}>
          <View style={[styles.brandMark, { backgroundColor: colors.primary }]}>
            <Text style={styles.brandMarkText}>M</Text>
          </View>
          {!compact && (
            <View style={styles.brandCopy}>
              <Text style={[styles.brandName, { color: colors.text }]}>MediConnect</Text>
              <Text style={[styles.brandCaption, { color: colors.textSecondary }]}>Gestão em saúde</Text>
            </View>
          )}
        </View>

        {!compact && <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MENU PRINCIPAL</Text>}
        <View style={styles.navList}>
          {navigationItems.map((item) => {
            const active = item.route === '/' ? pathname === '/' : pathname.startsWith('/patients');
            return (
              <Link key={item.href} href={item.href} asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityState={{ selected: active }}
                  style={({ pressed }) => [
                    styles.navItem,
                    compact && styles.navItemCompact,
                    active && { backgroundColor: colors.backgroundSelected },
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.navIcon, { color: active ? colors.primary : colors.textSecondary }]}>{item.icon}</Text>
                  {!compact && <Text style={[styles.navLabel, { color: active ? colors.primary : colors.textSecondary }]}>{item.label}</Text>}
                </Pressable>
              </Link>
            );
          })}
        </View>

        {!compact && (
          <View style={[styles.sidebarFooter, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerTitle, { color: colors.text }]}>MediConnect 2.0</Text>
            <Text style={[styles.footerCaption, { color: colors.textSecondary }]}>Acompanhamento organizado de pacientes</Text>
          </View>
        )}
      </View>

      <View style={styles.main}>
        <View style={styles.topbar}>
          <Text style={[styles.topbarTitle, { color: colors.text }]}>Área de trabalho</Text>
          <Text style={[styles.topbarCaption, { color: colors.textSecondary }]}>Sistema de gestão de pacientes</Text>
        </View>
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, minHeight: '100vh' as any, flexDirection: 'row' },
  sidebar: { width: 248, minHeight: '100vh' as any, borderRightWidth: 1, paddingHorizontal: Spacing.three, paddingVertical: Spacing.four },
  sidebarCompact: { width: 76, paddingHorizontal: Spacing.two, alignItems: 'center' },
  brandRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 38 },
  brandMark: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  brandCopy: { flex: 1, gap: 2 },
  brandName: { fontSize: 17, fontWeight: '800' },
  brandCaption: { fontSize: 11 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 12, marginLeft: 10 },
  navList: { gap: 6, width: '100%' },
  navItem: { minHeight: 46, borderRadius: Radius.medium, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  navItemCompact: { width: 48, justifyContent: 'center', paddingHorizontal: 0 },
  navIcon: { width: 22, textAlign: 'center', fontSize: 22, fontWeight: '600' },
  navLabel: { fontSize: 14, fontWeight: '600' },
  pressed: { opacity: 0.72 },
  sidebarFooter: { marginTop: 'auto', borderTopWidth: 1, paddingTop: 18, gap: 5 },
  footerTitle: { fontSize: 12, fontWeight: '700' },
  footerCaption: { fontSize: 11, lineHeight: 16 },
  main: { flex: 1, minWidth: 0 },
  topbar: { minHeight: 66, borderBottomWidth: 0, paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  topbarTitle: { fontSize: 14, fontWeight: '700' },
  topbarCaption: { fontSize: 12 },
  content: { flex: 1, minWidth: 0 },
});
