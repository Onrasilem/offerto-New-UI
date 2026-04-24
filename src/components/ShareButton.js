import React, { useState } from 'react';
import { TouchableOpacity, Text, View, Modal, TextInput, ActivityIndicator } from 'react-native';
import { theme } from './UI';
import { shareDocumentViaEmail } from '../lib/emailShare';
import { showErrorToast } from '../lib/toast';

export const ShareButton = ({ doc, company, customer, pdfBase64, style }) => {
  const [showModal, setShowModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Update email when modal opens
  const handleOpenModal = () => {
    setRecipientEmail(customer?.email || '');
    setShowModal(true);
  };

  const handleShare = async () => {
    if (!recipientEmail.trim()) {
      showErrorToast('Please enter a recipient email');
      return;
    }

    setIsSharing(true);
    try {
      const success = await shareDocumentViaEmail(doc, pdfBase64, company, recipientEmail);
      if (success) {
        setRecipientEmail('');
        setShowModal(false);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleOpenModal}
        style={[
          {
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.color.primary,
            alignItems: 'center',
          },
          style,
        ]}
      >
        <Text style={{ color: theme.color.surface, fontWeight: '600', fontSize: 14 }}>
          📧 Share via Email
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isSharing && setShowModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.space.md,
          }}
        >
          <View
            style={{
              backgroundColor: theme.color.surface,
              borderRadius: theme.radius.md,
              padding: theme.space.lg,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: theme.space.md, color: theme.color.primary }}>
              Share {doc.type} {doc.number}
            </Text>

            <Text style={{ fontSize: 12, color: theme.color.textMuted, marginBottom: theme.space.sm }}>
              Recipient email address:
            </Text>
            <TextInput
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              placeholder="customer@example.com"
              keyboardType="email-address"
              editable={!isSharing}
              style={{
                borderWidth: 1,
                borderColor: theme.color.border,
                borderRadius: theme.radius.sm,
                paddingHorizontal: theme.space.md,
                paddingVertical: theme.space.sm,
                marginBottom: theme.space.md,
                color: theme.color.primary,
              }}
              placeholderTextColor={theme.color.textMuted}
            />

            <View style={{ flexDirection: 'row', gap: theme.space.md }}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                disabled={isSharing}
                style={{
                  flex: 1,
                  paddingVertical: theme.space.md,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.color.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: theme.color.primary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleShare}
                disabled={isSharing}
                style={{
                  flex: 1,
                  paddingVertical: theme.space.md,
                  borderRadius: theme.radius.sm,
                  backgroundColor: isSharing ? theme.color.textMuted : theme.color.primary,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: theme.space.sm,
                }}
              >
                {isSharing && <ActivityIndicator size="small" color={theme.color.surface} />}
                <Text style={{ color: theme.color.surface, fontWeight: '600' }}>
                  {isSharing ? 'Sharing...' : 'Share'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
