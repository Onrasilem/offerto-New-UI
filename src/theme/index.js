import { Platform } from 'react-native';

// Design system tokens — from Offerto Final.html
// Accent: Cobalt blue #2563EB

export const DS = {
  colors: {
    bg: '#F7F8FC',
    surface: '#FFFFFF',
    border: '#E8EAF0',
    borderLight: '#F1F3F8',

    textPrimary: '#0C0F1A',
    textSecondary: '#6B7280',
    textTertiary: '#A0A8B8',

    accent: '#2563EB',
    accentSoft: '#EFF6FF',
    accentDark: '#1D4ED8',

    success: '#10B981',
    successSoft: '#ECFDF5',
    successText: '#065F46',

    warning: '#F59E0B',
    warningSoft: '#FFFBEB',
    warningText: '#92400E',

    danger: '#EF4444',
    dangerSoft: '#FFF1F2',
    dangerText: '#9F1239',

    info: '#3B82F6',
    infoSoft: '#EFF6FF',
  },
  radius: { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, full: 9999 },
  shadow: {
    xs: {
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    sm: {
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    },
    md: {
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10, shadowRadius: 16, elevation: 5,
    },
    lg: {
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12, shadowRadius: 32, elevation: 8,
    },
  },
};

export const STATUS_MAP = {
  concept:    { label: 'Concept',    bg: DS.colors.border,      color: DS.colors.textSecondary },
  Concept:    { label: 'Concept',    bg: DS.colors.border,      color: DS.colors.textSecondary },
  verzonden:  { label: 'Verzonden',  bg: DS.colors.infoSoft,    color: DS.colors.info },
  Verzonden:  { label: 'Verzonden',  bg: DS.colors.infoSoft,    color: DS.colors.info },
  getekend:   { label: 'Getekend',   bg: DS.colors.successSoft, color: DS.colors.success },
  Getekend:   { label: 'Getekend',   bg: DS.colors.successSoft, color: DS.colors.success },
  betaald:    { label: 'Betaald',    bg: DS.colors.successSoft, color: DS.colors.successText },
  Betaald:    { label: 'Betaald',    bg: DS.colors.successSoft, color: DS.colors.successText },
  openstaand: { label: 'Openstaand', bg: DS.colors.warningSoft, color: DS.colors.warning },
  verlopen:   { label: 'Verlopen',   bg: DS.colors.dangerSoft,  color: DS.colors.danger },
  Verlopen:   { label: 'Verlopen',   bg: DS.colors.dangerSoft,  color: DS.colors.danger },
  factuur:    { label: 'Factuur',    bg: DS.colors.accentSoft,  color: DS.colors.accent },
  offerte:    { label: 'Offerte',    bg: DS.colors.accentSoft,  color: DS.colors.accent },
};

// Legacy aliases for backward compatibility
export const colors = {
  primary: {
    50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE',
    500: DS.colors.accent, 600: '#1D4ED8', 700: '#1E40AF',
  },
  success: { light: DS.colors.successSoft, main: DS.colors.success, dark: '#059669' },
  warning: { light: DS.colors.warningSoft, main: DS.colors.warning, dark: '#D97706' },
  error:   { light: DS.colors.dangerSoft,  main: DS.colors.danger,  dark: '#DC2626' },
  info:    { light: DS.colors.infoSoft,    main: DS.colors.info,    dark: '#2563EB' },
  gray: {
    50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB',
    300: '#D1D5DB', 400: '#9CA3AF', 500: '#6B7280',
    600: '#4B5563', 700: '#374151', 800: '#1F2937', 900: '#111827',
  },
  background: DS.colors.bg,
  surface: DS.colors.surface,
  overlay: 'rgba(0,0,0,0.5)',
  text: {
    primary: DS.colors.textPrimary,
    secondary: DS.colors.textSecondary,
    disabled: DS.colors.textTertiary,
    inverse: '#FFFFFF',
  },
  border: {
    light: DS.colors.borderLight,
    main: DS.colors.border,
    dark: '#D1D5DB',
  },
};

export const typography = {
  fontFamily: {
    regular: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    medium:  Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    bold:    Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  fontSize: { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 30 },
  fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  '2xl': 24, '3xl': 32, '4xl': 40, '5xl': 48,
};

export const borderRadius = {
  none: 0, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999,
};

export const shadows = DS.shadow;

export const theme = {
  colors, typography, spacing, borderRadius, shadows, DS,
  color: {
    primary: DS.colors.accent,
    primaryDark: DS.colors.accentDark,
    primaryLight: DS.colors.accentSoft,
    success: DS.colors.success,
    warning: DS.colors.warning,
    danger: DS.colors.danger,
    info: DS.colors.info,
    surface: DS.colors.surface,
    bg: DS.colors.bg,
    text: DS.colors.textPrimary,
    textMuted: DS.colors.textSecondary,
    border: DS.colors.border,
    borderDark: '#D1D5DB',
  },
  space: spacing,
  text: { h1: 30, h2: 24, h3: 20, body: 16, small: 14, xsmall: 12 },
  radius: borderRadius,
  shadow: shadows,
  font: typography.fontWeight,
};

export default theme;
