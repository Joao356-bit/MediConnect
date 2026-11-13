import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppInputProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
};

export function AppInput({ label, error, hint, onFocus, onBlur, style, ...props }: AppInputProps) {
  const colors = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.textSecondary}
        onFocus={(event) => { setFocused(true); onFocus?.(event); }}
        onBlur={(event) => { setFocused(false); onBlur?.(event); }}
        style={[
          styles.input,
          { backgroundColor: colors.backgroundElement, borderColor: error ? colors.danger : focused ? colors.primary : colors.border, color: colors.text },
          style,
        ]}
      />
      {!!error && <Text style={[styles.helper, { color: colors.danger }]}>{error}</Text>}
      {!error && !!hint && <Text style={[styles.helper, { color: colors.textSecondary }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { minHeight: 46, borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: 11, fontSize: 15, outlineStyle: 'none' } as any,
  helper: { fontSize: 12, lineHeight: 17 },
});
