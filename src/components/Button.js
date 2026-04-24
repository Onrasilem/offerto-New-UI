/**
 * Modern Button Component
 * Professional, accessible, ready for designer customization
 */

import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
  ...props
}) => {
  const buttonStyles = getButtonStyles(variant, size, fullWidth, disabled || loading);
  const textStyles = getTextStyles(variant, size);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[buttonStyles.container, style]}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textStyles.color} size="small" />
      ) : (
        <>
          {icon && <Text style={[textStyles, { marginRight: theme.spacing.sm }]}>{icon}</Text>}
          <Text style={[textStyles, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// Button variant styles
const getButtonStyles = (variant, size, fullWidth, disabled) => {
  const base = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
  };

  // Size configurations
  const sizes = {
    sm: { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
    md: { paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 },
    lg: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 52 },
  };

  // Variant configurations
  const variants = {
    primary: {
      backgroundColor: theme.colors.primary[500],
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: theme.colors.gray[100],
      borderWidth: 0,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.border.dark,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
    },
    danger: {
      backgroundColor: theme.colors.error.main,
      borderWidth: 0,
    },
    success: {
      backgroundColor: theme.colors.success.main,
      borderWidth: 0,
    },
  };

  return {
    container: {
      ...base,
      ...sizes[size],
      ...variants[variant],
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.5 : 1,
    },
  };
};

// Text styles for each variant
const getTextStyles = (variant, size) => {
  const sizes = {
    sm: { fontSize: 14, fontWeight: theme.typography.fontWeight.medium },
    md: { fontSize: 16, fontWeight: theme.typography.fontWeight.semibold },
    lg: { fontSize: 18, fontWeight: theme.typography.fontWeight.semibold },
  };

  const variants = {
    primary: { color: theme.colors.text.inverse },
    secondary: { color: theme.colors.text.primary },
    outline: { color: theme.colors.text.primary },
    ghost: { color: theme.colors.primary[500] },
    danger: { color: theme.colors.text.inverse },
    success: { color: theme.colors.text.inverse },
  };

  return {
    ...sizes[size],
    ...variants[variant],
  };
};

export default Button;
