import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { theme } from './UI';

export const LoadingButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;
  
  const getBackgroundColor = () => {
    if (variant === 'secondary') {
      return isDisabled ? theme.color.border : theme.color.surface;
    }
    return isDisabled ? theme.color.textMuted : theme.color.primary;
  };

  const getTextColor = () => {
    if (variant === 'secondary') {
      return theme.color.primary;
    }
    return theme.color.surface;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: theme.color.border,
          borderRadius: theme.radius.sm,
          paddingVertical: theme.space.md,
          paddingHorizontal: theme.space.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space.sm,
        },
        style,
      ]}
      {...props}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
        />
      )}
      <Text
        style={{
          color: getTextColor(),
          fontWeight: '600',
          fontSize: 14,
        }}
      >
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};
