// src/components/SuggestInput.js
import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Platform } from 'react-native';
import { getSuggestions, addSuggest } from '../lib/suggest';

export default function SuggestInput({
  bucket,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  minChars = 2,
  onCommit, // optioneel: callback bij definitieve bevestiging (blur of enter)
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const q = String(value || '');
      if (q.trim().length >= minChars) {
        const res = await getSuggestions(bucket, q, 8);
        if (alive) {
          setItems(res);
          setOpen(res.length > 0);
        }
      } else {
        setItems([]);
        setOpen(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [bucket, value, minChars]);

  const selectItem = async (val) => {
    onChangeText?.(val);
    setOpen(false);
    await addSuggest(bucket, val);
    onCommit?.(val);
  };

  const commitCurrent = async () => {
    const v = String(value || '').trim();
    if (v) {
      await addSuggest(bucket, v);
      onCommit?.(v);
    }
    setOpen(false);
  };

  return (
    <View style={{ position: 'relative' }}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChangeText?.(t)}
        placeholder={placeholder}
        keyboardType={keyboardType}
        onSubmitEditing={commitCurrent}
        onBlur={() => {
          // Web kan onBlur sneller triggeren; klein uitstel om klik op suggestion toe te laten
          setTimeout(() => setOpen(false), 100);
          commitCurrent();
        }}
        style={{
          borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: 'white',
        }}
      />
      {open && items.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: Platform.OS === 'web' ? 44 : 48,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 8,
            zIndex: 10,
            maxHeight: 180,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {items.map((it, idx) => (
            <TouchableOpacity
              key={`${it}-${idx}`}
              onPress={() => selectItem(it)}
              style={{ paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: '#F1F5F9' }}
            >
              <Text>{it}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
