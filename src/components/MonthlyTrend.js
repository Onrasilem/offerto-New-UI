import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { currency } from '../lib/utils';

export default function MonthlyTrend({ data = [] }) {
  // data: [{ key, label, total }]
  const totals = data.map((d) => Number(d.total) || 0);
  const maxRaw = totals.length > 0 ? Math.max(...totals) : 0;
  const max = Math.max(Math.round(maxRaw), 1);

  return (
    <View style={styles.container}>
      {data.map((d) => {
        const valRaw = Number(d.total) || 0;
        const val = Math.round(valRaw * 100) / 100; // keep two decimals
        const widthPct = max > 0 ? Math.round((val / max) * 100) : 0;
        return (
          <View
            key={d.key}
            style={styles.row}
            accessibilityRole="adjustable"
            accessibilityLabel={`${d.label} omzet`}
            accessibilityValue={{ now: Math.round(val), min: 0, max }}
          >
            <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
              {d.label}
            </Text>
            <View style={styles.barWrap}>
              <View style={[styles.bar, { width: `${widthPct}%` }]} />
            </View>
            <Text style={styles.amount}>{currency(val)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: 110,
    fontSize: 12,
    color: '#334155',
  },
  barWrap: {
    flex: 1,
    height: 10,
    backgroundColor: '#E6E9EE',
    borderRadius: 6,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 6,
  },
  amount: {
    width: 90,
    textAlign: 'right',
    fontSize: 12,
    color: '#0F172A',
  },
});
