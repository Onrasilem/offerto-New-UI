import React from 'react';
import { View, TextInput, Text } from 'react-native';
import { theme } from './UI';

export const ValidatedInput = ({
  value,
  onChangeText,
  onBlur,
  error,
  touched,
  placeholder,
  label,
  keyboardType = 'default',
  style,
  ...props
}) => {
  const hasError = error && touched;

  return (
    <View style={{ marginBottom: theme.space.md }}>
      {label && (
        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.color.primary, marginBottom: theme.space.xs }}>
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        keyboardType={keyboardType}
        style={[
          {
            borderWidth: 1,
            borderColor: hasError ? theme.color.danger : theme.color.border,
            borderRadius: theme.radius.sm,
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            fontSize: 14,
            color: theme.color.primary,
            backgroundColor: hasError ? '#FEE2E2' : theme.color.bg,
          },
          style,
        ]}
        placeholderTextColor={theme.color.muted}
        {...props}
      />
      {hasError && (
        <Text style={{ fontSize: 12, color: theme.color.danger, marginTop: theme.space.xs }}>
          {error}
        </Text>
      )}
    </View>
  );
};
