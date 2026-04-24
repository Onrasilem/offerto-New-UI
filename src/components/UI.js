// src/components/UI.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Keyboard,
  Platform, KeyboardAvoidingView, ScrollView, Modal, FlatList, Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** ==== Modern Theme Tokens - Market Ready ==== */
export const theme = {
  // Modern color palette
  color: {
    primary:    '#2563EB',      // Vibrant blue
    primaryDark:'#1E40AF',      // Darker blue for hover
    primaryLight:'#DBEAFE',     // Light blue for backgrounds
    success:    '#10B981',      // Green
    warning:    '#F59E0B',      // Amber
    danger:     '#EF4444',      // Red
    info:       '#06B6D4',      // Cyan
    surface:    '#FFFFFF',      // Card/surface white
    bg:         '#F9FAFB',      // Page background (light gray)
    text:       '#111827',      // Primary text (dark)
    textMuted:  '#6B7280',      // Muted text (gray)
    border:     '#E5E7EB',      // Border color (light gray)
    borderDark: '#D1D5DB',      // Darker border
  },
  // Spacing scale (8px base)
  space: { 
    xs: 4,   // Extra small
    sm: 8,   // Small
    md: 12,  // Medium
    lg: 16,  // Large
    xl: 24,  // Extra large
    xxl: 32, // 2x large
  },
  // Typography
  text: { 
    h1: 28,      // Headings
    h2: 24,      // Subheadings
    h3: 20,      // Section titles
    body: 16,    // Body text
    small: 14,   // Small text
    xsmall: 12,  // Very small
  },
  // Rounded corners (modern)
  radius: { 
    sm: 4,       // Extra small
    md: 8,       // Medium (default)
    lg: 12,      // Large
    xl: 16,      // Extra large
    full: 9999,  // Fully rounded
  },
  // Shadows (depth)
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4 },
  },
  // Font weights
  font: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const pickerStyles = {
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: theme.color.border,
    borderRadius: theme.radius.lg,
    color: theme.color.text,
    backgroundColor: theme.color.surface,
    fontWeight: '500',
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: theme.color.border,
    borderRadius: theme.radius.lg,
    color: theme.color.text,
    backgroundColor: theme.color.surface,
    fontWeight: '500',
  },
};

/** ==== Basics ==== */
export const Label = ({ children }) => (
  <Text style={{ fontSize: theme.text.small, fontWeight: theme.font.semibold, marginBottom: theme.space.sm, color: theme.color.text }}>{children}</Text>
);

export const Field = ({ label, children }) => (
  <View style={{ marginBottom: theme.space.md }}>
    {label ? <Label>{label}</Label> : null}
    {children}
  </View>
);

export const TextBox = ({
  value, onChangeText, placeholder, keyboardType = 'default',
  editable = true, multiline = false
}) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    keyboardType={keyboardType}
    multiline={multiline}
    editable={editable}
    placeholderTextColor={theme.color.textMuted}
    style={{
      fontSize: theme.text.body,
      padding: theme.space.md,
      borderWidth: 1.5,
      borderColor: editable ? theme.color.border : theme.color.bg,
      borderRadius: theme.radius.lg,
      backgroundColor: editable ? theme.color.surface : theme.color.bg,
      color: theme.color.text,
      fontWeight: '500',
      minHeight: multiline ? 100 : undefined,
      ...theme.shadow.sm,
    }}
  />
);

export const Button = ({ title, onPress, variant = 'primary', disabled = false, size = 'md' }) => {
  const isPrimary = variant === 'primary';
  const bg = isPrimary ? (disabled ? theme.color.primaryDark : theme.color.primary) : theme.color.surface;
  const fg = isPrimary ? '#fff' : theme.color.primary;
  const borderColor = isPrimary ? 'transparent' : theme.color.primary;
  const paddingVertical = size === 'sm' ? 10 : size === 'lg' ? 16 : 12;
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={{
        backgroundColor: bg,
        paddingVertical,
        paddingHorizontal: theme.space.lg,
        borderRadius: theme.radius.lg,
        borderWidth: isPrimary ? 0 : 1.5,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.6 : 1,
        ...theme.shadow.sm,
      }}
    >
      <Text style={{ color: fg, fontWeight: theme.font.bold, fontSize: theme.text.body, textAlign: 'center' }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export const Card = ({ children, title, right }) => (
  <View style={{
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    marginBottom: theme.space.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    ...theme.shadow.sm,
  }}>
    {(title || right) ? (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.space.md }}>
        {title ? <Text style={{ fontSize: theme.text.h3, fontWeight: theme.font.semibold, color: theme.color.text }}>{title}</Text> : <View />}
        {right}
      </View>
    ) : null}
    {children}
  </View>
);

export const Row = ({ left, right }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.space.sm }}>
    <Text style={{ color: theme.color.textMuted, fontSize: theme.text.body }}>{left}</Text>
    <Text style={{ fontWeight: theme.font.bold, color: theme.color.text, fontSize: theme.text.body }}>{right}</Text>
  </View>
);

/** ==== Chip ==== */
export const Chip = ({ label, active = false, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={{
      paddingHorizontal: theme.space.md,
      paddingVertical: theme.space.sm,
      borderRadius: theme.radius.full,
      borderWidth: 1.5,
      borderColor: active ? theme.color.primary : theme.color.border,
      backgroundColor: active ? theme.color.primary : theme.color.surface,
      marginRight: theme.space.md,
      marginBottom: theme.space.md,
      ...theme.shadow.sm,
    }}
  >
    <Text style={{ color: active ? '#fff' : theme.color.text, fontSize: theme.text.small, fontWeight: theme.font.semibold }}>{label}</Text>
  </TouchableOpacity>
);

/** ==== Checkbox ==== */
export function Checkbox({ checked, onToggle, label }) {
  return (
    <TouchableOpacity onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md, paddingVertical: theme.space.sm }}>
      <View style={{
        width: 22,
        height: 22,
        borderRadius: theme.radius.md,
        borderWidth: 1.5,
        borderColor: checked ? theme.color.primary : theme.color.border,
        backgroundColor: checked ? theme.color.primary : theme.color.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadow.sm,
      }}>
        {checked ? <Text style={{ color: '#fff', fontWeight: theme.font.bold }}>✓</Text> : null}
      </View>
      <Text style={{ color: theme.color.text, fontSize: theme.text.body, fontWeight: '500' }}>{label}</Text>
    </TouchableOpacity>
  );
}

/** ==== Keyboard inset helper + wrapper ==== */
function useKeyboardInset() {
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardWillShow', (e) => setKb((e.endCoordinates?.height || 0)));
    const s2 = Keyboard.addListener('keyboardWillHide', () => setKb(0));
    const s3 = Keyboard.addListener('keyboardDidShow', (e) => setKb((e.endCoordinates?.height || 0)));
    const s4 = Keyboard.addListener('keyboardDidHide', () => setKb(0));
    return () => { s1.remove(); s2.remove(); s3.remove(); s4.remove(); };
  }, []);
  return kb;
}

export function ScreenWrapper({ children, headerOffset = 0 }) {
  const kb = useKeyboardInset();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
          contentContainerStyle={{ 
            padding: theme.space.lg, 
            paddingTop: headerOffset ? headerOffset + theme.space.lg : theme.space.lg,
            paddingBottom: theme.space.xl + kb,
          }} 
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** ==== Custom Modal Select (werkt altijd) ==== */
function ModalSelect({ value, onChange, placeholder, options }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
        style={{
          borderWidth: 1.5,
          borderColor: theme.color.border,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.color.surface,
          paddingVertical: theme.space.md,
          paddingHorizontal: theme.space.md,
          marginBottom: theme.space.md,
          ...theme.shadow.sm,
        }}
      >
        <Text style={{ color: selected ? theme.color.text : theme.color.textMuted, fontSize: theme.text.body, fontWeight: '500' }}>
          {selected ? selected.label : (placeholder || 'Selecteer…')}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', padding: theme.space.lg, justifyContent: 'center' }} onPress={() => setOpen(false)}>
          <Pressable style={{ backgroundColor: theme.color.surface, borderRadius: theme.radius.xl, overflow: 'hidden', maxHeight: '70%', ...theme.shadow.lg }} onPress={(e) => e.stopPropagation()}>
            <View style={{ padding: theme.space.md, borderBottomWidth: 1.5, borderBottomColor: theme.color.border, backgroundColor: theme.color.bg }}>
              <Text style={{ fontWeight: theme.font.semibold, fontSize: theme.text.h3, color: theme.color.text }}>{placeholder || 'Selecteer'}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(it, idx) => String(it.value ?? idx)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { onChange(item.value); setOpen(false); }}
                  style={({ pressed }) => ({
                    paddingVertical: theme.space.md,
                    paddingHorizontal: theme.space.md,
                    backgroundColor: pressed ? theme.color.bg : theme.color.surface,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.color.border,
                  })}
                >
                  <Text style={{ color: theme.color.text, fontSize: theme.text.body, fontWeight: '500' }}>{item.label}</Text>
                </Pressable>
              )}
            />
            <View style={{ padding: theme.space.md, backgroundColor: theme.color.bg, borderTopWidth: 1, borderTopColor: theme.color.border }}>
              <Button title="Annuleren" variant="secondary" onPress={() => setOpen(false)} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

/** ==== Pickers (bouwen op ModalSelect) ==== */
export const VatPicker = ({ value, onValueChange }) => (
  <ModalSelect
    value={typeof value === 'number' ? value : null}
    onChange={onValueChange}
    placeholder="Kies BTW"
    options={[
      { label: '6%',  value: 6 },
      { label: '12%', value: 12 },
      { label: '21%', value: 21 },
    ]}
  />
);


export const UnitPicker = ({ value, onValueChange }) => (
  <ModalSelect
    value={value ?? null}
    onChange={onValueChange}
    placeholder="Kies eenheid"
    options={[
      { label: 'stuk',  value: 'st'  },
      { label: 'uur',   value: 'uur' },
      { label: 'm²',    value: 'm2'  },
      { label: 'm³',    value: 'm3'  },
      { label: 'meter', value: 'm'   },
    ]}
  />
);
