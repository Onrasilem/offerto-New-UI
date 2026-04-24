/**
 * Modern Card Component
 * Professional cards with variants and interactive states
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';

export const Card = ({
  children,
  variant = 'elevated',
  padding = 'md',
  onPress,
  style,
  ...props
}) => {
  const cardStyles = getCardStyles(variant, padding);
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      style={[cardStyles, style]}
      activeOpacity={onPress ? 0.8 : 1}
      {...props}
    >
      {children}
    </Container>
  );
};

const getCardStyles = (variant, padding) => {
  const base = {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
  };

  const paddings = {
    none: 0,
    sm: theme.spacing.sm,
    md: theme.spacing.lg,
    lg: theme.spacing['2xl'],
  };

  const variants = {
    elevated: {
      ...theme.shadows.md,
      borderWidth: 0,
    },
    outlined: {
      borderWidth: 1,
      borderColor: theme.colors.border.main,
    },
    filled: {
      backgroundColor: theme.colors.gray[50],
      borderWidth: 0,
    },
  };

  return {
    ...base,
    padding: paddings[padding],
    ...variants[variant],
  };
};

export default Card;
