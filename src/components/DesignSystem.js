// Shared design system primitives — translated from Offerto Final.html to React Native
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput,
} from 'react-native';
import { DS, STATUS_MAP } from '../theme';

// ── Badge ─────────────────────────────────────────────────
export function Badge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.concept;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

// ── Avatar ─────────────────────────────────────────────────
const AVATAR_COLORS = ['#4F46E5','#10B981','#F59E0B','#EF4444','#3B82F6','#8B5CF6','#EC4899'];
export function Avatar({ name = '?', size = 36, color }) {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  const bg = color || AVATAR_COLORS[idx];
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────
export function DSCard({ children, style, onPress, noBorder }) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, noBorder && { borderWidth: 0 }, style]}
    >
      {children}
    </Container>
  );
}

// ── Divider ───────────────────────────────────────────────
export function Divider() {
  return <View style={styles.divider} />;
}

// ── Primary Button ────────────────────────────────────────
export function PrimaryBtn({ label, onPress, full, small, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
      style={[
        styles.primaryBtn,
        small && styles.btnSmall,
        full && styles.btnFull,
        disabled && styles.btnDisabled,
      ]}
    >
      <Text style={[styles.primaryBtnText, small && styles.btnTextSmall]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Secondary Button ──────────────────────────────────────
export function SecondaryBtn({ label, onPress, full, small }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.secondaryBtn, small && styles.btnSmall, full && styles.btnFull]}
    >
      <Text style={[styles.secondaryBtnText, small && styles.btnTextSmall]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Section Header ─────────────────────────────────────────
export function SectionHeader({ title, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionLabel}>{title.toUpperCase()}</Text>
      {action ? (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ── Row item (for lists) ──────────────────────────────────
export function RowItem({ title, subtitle, right, onPress, leftSlot, chevron = true }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.rowItem}>
      {leftSlot && <View style={styles.rowLeft}>{leftSlot}</View>}
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {right && <View style={styles.rowRight}>{right}</View>}
      {chevron && !right && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

// ── Icon placeholder box ──────────────────────────────────
export function IconBox({ color, bg, size = 34, children }) {
  return (
    <View style={[styles.iconBox, { width: size, height: size, borderRadius: DS.radius.sm, backgroundColor: bg }]}>
      {children}
    </View>
  );
}

// ── Amount text ───────────────────────────────────────────
export function AmountText({ value, large, color }) {
  return (
    <Text style={[large ? styles.amountLarge : styles.amount, color && { color }]}>
      {value}
    </Text>
  );
}

// ── Screen container ──────────────────────────────────────
export function Screen({ children, style, white }) {
  return (
    <View style={[styles.screen, white && { backgroundColor: '#fff' }, style]}>
      {children}
    </View>
  );
}

// ── Search bar ─────────────────────────────────────────────
export function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.searchBar}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || 'Zoeken...'}
        placeholderTextColor={DS.colors.textTertiary}
        style={styles.searchInput}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: DS.radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },

  avatar: {
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { color: '#fff', fontWeight: '700' },

  card: {
    backgroundColor: DS.colors.surface,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: DS.colors.border,
    overflow: 'hidden',
  },

  divider: { height: 1, backgroundColor: DS.colors.borderLight },

  primaryBtn: {
    backgroundColor: DS.colors.accent,
    borderRadius: DS.radius.sm,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    borderRadius: DS.radius.sm,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: DS.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: { color: DS.colors.accent, fontSize: 16, fontWeight: '600' },
  btnSmall: { paddingVertical: 10, paddingHorizontal: 16 },
  btnTextSmall: { fontSize: 14 },
  btnFull: { flex: 1 },
  btnDisabled: { opacity: 0.5 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: DS.colors.textTertiary,
    letterSpacing: 0.8,
  },
  sectionAction: { fontSize: 13, fontWeight: '600', color: DS.colors.accent },

  rowItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: DS.colors.borderLight,
  },
  rowLeft: { marginRight: 14 },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: DS.colors.textPrimary },
  rowSubtitle: { fontSize: 12, color: DS.colors.textSecondary, marginTop: 1 },
  rowRight: { alignItems: 'flex-end', flexShrink: 0 },
  chevron: { fontSize: 20, color: DS.colors.textTertiary, marginLeft: 6 },

  iconBox: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  amount: { fontSize: 14, fontWeight: '700', color: DS.colors.textPrimary },
  amountLarge: { fontSize: 28, fontWeight: '800', color: DS.colors.textPrimary, letterSpacing: -0.5 },

  screen: {
    flex: 1, backgroundColor: DS.colors.bg,
  },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: DS.colors.bg,
    borderRadius: DS.radius.sm,
    borderWidth: 1, borderColor: DS.colors.border,
    paddingHorizontal: 14, paddingVertical: 11,
    gap: 10,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1, fontSize: 15, color: DS.colors.textPrimary,
  },
});
