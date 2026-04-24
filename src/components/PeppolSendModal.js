/**
 * PeppolSendModal
 * 
 * Modal voor verzenden van facturen via Peppol netwerk.
 * Toont Peppol ID van klant, laat scheme selecteren, en volgt verzendstatus.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ValidatedInput } from './ValidatedInput';
import { api } from '../lib/api';

const PEPPOL_SCHEMES = [
  { value: '0208', label: '0208 (Belgisch ondernemingsnummer)' },
  { value: '0106', label: '0106 (Nederlands KVK-nummer)' },
  { value: '0088', label: '0088 (EAN/GLN nummer)' },
  { value: '9956', label: '9956 (Europees BTW-nummer)' },
];

export function PeppolSendModal({ visible, onClose, document, customer }) {
  const [scheme, setScheme] = useState(customer?.peppolScheme || '0208');
  const [peppolId, setPeppolId] = useState(customer?.peppolId || '');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null); // null, 'queued', 'in_transit', 'delivered', 'failed'
  const [error, setError] = useState(null);

  // Reset bij openen
  useEffect(() => {
    if (visible) {
      setScheme(customer?.peppolScheme || '0208');
      setPeppolId(customer?.peppolId || '');
      setStatus(null);
      setError(null);
    }
  }, [visible, customer]);

  // Poll status als verzonden
  useEffect(() => {
    if (!status || status === 'delivered' || status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const result = await api.getPeppolStatus(document.id);
        setStatus(result.status);
        if (result.error) setError(result.error);
      } catch (err) {
        console.error('Status check error:', err);
      }
    }, 5000); // Check elke 5 seconden

    return () => clearInterval(interval);
  }, [status, document?.id]);

  const handleSend = async () => {
    if (!peppolId.trim()) {
      Alert.alert('Fout', 'Vul een Peppol ID in');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const result = await api.sendViaPeppol(document.id, peppolId, scheme);
      setStatus(result.status);
      Alert.alert(
        'Verzonden via Peppol! 📨',
        `Factuur ${document.number} wordt nu verstuurd via het Peppol netwerk.`
      );
    } catch (err) {
      console.error('Peppol send error:', err);
      setError(err.message);
      Alert.alert('Fout', err.message || 'Kon niet verzenden via Peppol');
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async () => {
    setSending(true);
    try {
      await api.retryPeppolSend(document.id);
      setStatus(null);
      setError(null);
      Alert.alert('Opnieuw proberen', 'De verzending is gereset. Druk op "Verzend" om opnieuw te proberen.');
    } catch (err) {
      Alert.alert('Fout', err.message);
    } finally {
      setSending(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'queued': return '⏳';
      case 'in_transit': return '📤';
      case 'delivered': return '✅';
      case 'failed': return '❌';
      default: return '📨';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'queued': return 'In wachtrij...';
      case 'in_transit': return 'Bezig met verzenden...';
      case 'delivered': return 'Succesvol afgeleverd!';
      case 'failed': return 'Verzending mislukt';
      default: return 'Nog niet verzonden';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '80%' }}>
          <ScrollView>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>
              📨 Verzend via Peppol
            </Text>
            <Text style={{ color: '#666', marginBottom: 20 }}>
              Factuur: {document?.number}
            </Text>

            {/* Status indicator */}
            {status && (
              <View style={{ 
                backgroundColor: status === 'delivered' ? '#E8F5E9' : status === 'failed' ? '#FFEBEE' : '#E3F2FD',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 24, marginRight: 8 }}>{getStatusIcon()}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>{getStatusText()}</Text>
                  {error && <Text style={{ color: '#D32F2F', fontSize: 12, marginTop: 4 }}>{error}</Text>}
                </View>
              </View>
            )}

            {/* Scheme selector */}
            <Text style={{ fontWeight: '600', marginBottom: 8 }}>Peppol Scheme</Text>
            <View style={{ 
              borderWidth: 1, 
              borderColor: '#ddd', 
              borderRadius: 8, 
              marginBottom: 16,
              overflow: 'hidden',
            }}>
              <Picker
                selectedValue={scheme}
                onValueChange={setScheme}
                enabled={!status || status === 'failed'}
              >
                {PEPPOL_SCHEMES.map(s => (
                  <Picker.Item key={s.value} label={s.label} value={s.value} />
                ))}
              </Picker>
            </View>

            {/* Peppol ID input */}
            <ValidatedInput
              label="Peppol ID ontvanger"
              value={peppolId}
              onChangeText={setPeppolId}
              placeholder="Bijv. 0208:1234567890"
              editable={!status || status === 'failed'}
              validator={(val) => val.trim().length > 0}
            />

            <Text style={{ fontSize: 12, color: '#666', marginTop: -8, marginBottom: 16 }}>
              💡 Dit is het Peppol ID van de klant waarnaar je de e-factuur stuurt.
            </Text>

            {/* UBL info */}
            <View style={{ 
              backgroundColor: '#F5F5F5', 
              padding: 12, 
              borderRadius: 8, 
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 12, color: '#666' }}>
                ℹ️ De factuur wordt omgezet naar UBL 2.1 XML formaat en verzonden via het Peppol netwerk 
                volgens de BIS 3.0 standaard.
              </Text>
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {status === 'failed' && (
                <TouchableOpacity
                  onPress={handleRetry}
                  disabled={sending}
                  style={{
                    flex: 1,
                    backgroundColor: '#FF9800',
                    padding: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>🔄 Opnieuw</Text>
                  )}
                </TouchableOpacity>
              )}

              {!status && (
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={sending || !peppolId.trim()}
                  style={{
                    flex: 1,
                    backgroundColor: !peppolId.trim() ? '#ccc' : '#4CAF50',
                    padding: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                >
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>📨 Verzend via Peppol</Text>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  backgroundColor: '#f5f5f5',
                  padding: 14,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#666', fontWeight: '600' }}>
                  {status === 'delivered' ? 'Sluiten' : 'Annuleer'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
