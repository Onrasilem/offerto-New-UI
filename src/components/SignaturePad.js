// src/components/SignaturePad.js
import React, { useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import Signature from 'react-native-signature-canvas';
import { Button, Card } from './UI';

/**
 * Props:
 *  - value: data URL (base64 PNG) or null
 *  - onChange(dataUrl): handtekening opslaan
 *  - onClear(): handtekening wissen
 */
export default function SignaturePad({ value, onChange, onClear }) {
  const ref = useRef(null);

  const handleOK = (sig) => {
    onChange?.(sig); // data URL (image/png;base64)
  };

  const htmlStyle = `
    .m-signature-pad--footer { display: none; margin: 0; }
    body,html { width: 100%; height: 100%; margin:0; }
  `;

  const height = Platform.OS === 'web' ? 260 : 220;

  return (
    <Card>
      <Text style={{ fontWeight: '700', marginBottom: 6 }}>Handtekening (optioneel)</Text>
      <View style={{ height, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, overflow: 'hidden', backgroundColor: 'white' }}>
        <Signature
          ref={ref}
          onOK={handleOK}
          webStyle={htmlStyle}
          descriptionText="Teken hier"
          clearText="Wissen"
          confirmText="Bewaar"
          imageType="image/png"
          backgroundColor="#FFFFFF"
          penColor="#111111"
          minWidth={1.5}
          maxWidth={2.5}
          dataURL={value || undefined}
        />
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Button
            title="Wissen"
            variant="secondary"
            onPress={() => {
              try { ref.current?.clearSignature(); } catch {}
              onClear?.();
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Bewaar"
            onPress={() => { try { ref.current?.readSignature(); } catch {} }}
          />
        </View>
      </View>
    </Card>
  );
}
