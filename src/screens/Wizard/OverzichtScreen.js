// src/screens/Wizard/OverzichtScreen.js
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Text, View, Platform } from 'react-native';
import { ScreenWrapper, Card, Row, Button, Checkbox, theme } from '../../components/UI';
import { ShareButton } from '../../components/ShareButton';
import { PeppolSendModal } from '../../components/PeppolSendModal';
import { useOfferto } from '../../context/OffertoContext';
import { currency, addDaysISO } from '../../lib/utils';
import { buildPdf, sharePdf } from '../../lib/pdf';
import SignaturePad from '../../components/SignaturePad';

export default function OverzichtScreen({ navigation }) {
  const {
    company,
    klant,
    totals,
    docType,
    setDocType,
    docNummer,
    docDatum,
    saveToArchive,
    signRequested,
    setSignRequested,
    regenerateNumberFor,
    updateStatusByNumber,
    isInArchive,
    signatureData,
    setSignatureData,
  } = useOfferto();

  const { lines, exTotal, btwTotal, incTotal } = totals;
  const [shareModal] = useState({ open: false, url: '' }); // gereserveerd voor later
  const [peppolModalVisible, setPeppolModalVisible] = useState(false);

  // Zorg dat er altijd een documentnummer is
  useEffect(() => {
    (async () => {
      if (!docNummer) {
        await regenerateNumberFor(docType);
      }
    })();
  }, []);

  const onSwitchType = async (t) => {
    setDocType(t);
    await regenerateNumberFor(t);
  };

  const buildArchivePayload = () => ({
    type: docType,
    number: docNummer,
    date: docDatum,
    totals: { exTotal, btwTotal, incTotal },
    klantSnapshot: { ...klant },
    lines,
    signRequested,
    signatureData: signatureData || null,
  });

  const ensureSaved = async () => {
    if (!isInArchive(docNummer)) {
      const payload = buildArchivePayload();
      await saveToArchive(payload);
    }
  };

  const navigateToArchive = () => {
    const parent = navigation.getParent?.();
    if (parent) {
      parent.navigate('Main');
    } else {
      navigation.navigate('Main');
    }
  };

  const save = async () => {
    const payload = buildArchivePayload();
    await saveToArchive(payload);
    Alert.alert('Archief', 'Document is opgeslagen in het archief.', [
      { text: 'OK', onPress: navigateToArchive },
    ]);
  };

  const genPDF = async () => {
    // Eerst de PDF genereren en tonen
    const target = await buildPdf({
      company,
      klant,
      lines,
      exTotal,
      btwTotal,
      incTotal,
      docType,
      nummer: docNummer || 'DOC-0000',
      docDatum,
      signatureData,
    });

    if (!target) {
      Alert.alert('PDF', 'Kon geen PDF genereren.');
      return;
    }

    await sharePdf(target);

    // Daarna proberen we te saven, maar zonder de gebruiker te blokkeren
    try {
      await ensureSaved();
    } catch (e) {
      console.warn('ensureSaved failed after PDF:', e);
    }
  };

  const acceptAndSign = async () => {
    if (!signatureData) {
      Alert.alert('Handtekening', 'Voeg eerst een handtekening toe.');
      return;
    }

    // Vanaf het moment dat er getekend wordt, MOET het in het archief zitten
    await ensureSaved();

    await updateStatusByNumber(docNummer, 'Getekend/Goedgekeurd');
    Alert.alert('Bevestigd', 'Status is ingesteld op Getekend/Goedgekeurd.', [
      { text: 'OK', onPress: navigateToArchive },
    ]);
  };

  const acceptEnabled = !!signatureData;

  return (
    <ScreenWrapper>
      <View style={{ marginBottom: theme.space.md }}>
        <Text style={{ ...theme.text.h2, color: theme.color.primary }}>✅ Overzicht</Text>
        <Text style={{ ...theme.text.small, color: theme.color.muted, marginTop: theme.space.xs }}>
          Controleer en verstuur uw document
        </Text>
      </View>

      <Card style={{ marginBottom: theme.space.lg }}>
        <Text style={{ ...theme.text.h3, color: theme.color.primary, marginBottom: theme.space.md }}>
          Documenttype
        </Text>
        <Row left="Type" right={docType} />
        <View style={{ flexDirection: 'row', gap: theme.space.md, marginTop: theme.space.md }}>
          <View style={{ flex: 1 }}>
            <Button 
              title={docType === 'OFFERTE' ? '✓ OFFERTE' : 'OFFERTE'} 
              onPress={() => onSwitchType('OFFERTE')}
              variant={docType === 'OFFERTE' ? 'primary' : 'secondary'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button 
              title={docType === 'FACTUUR' ? '✓ FACTUUR' : 'FACTUUR'} 
              onPress={() => onSwitchType('FACTUUR')}
              variant={docType === 'FACTUUR' ? 'primary' : 'secondary'}
            />
          </View>
        </View>
        <Row left="Nummer" right={docNummer || '—'} style={{ marginTop: theme.space.md }} />
        <Row left="Datum" right={docDatum} />
        {docType === 'OFFERTE' ? (
          <Row
            left="Geldig tot"
            right={addDaysISO(docDatum, company.offerteGeldigheidDagen || 30)}
          />
        ) : null}
        <View style={{ marginTop: theme.space.md }}>
          <Checkbox
            checked={signRequested}
            onToggle={() => setSignRequested(!signRequested)}
            label="📝 Digitaal tekenen (optioneel)"
          />
        </View>
      </Card>

      <Card style={{ marginBottom: theme.space.lg }}>
        <Text style={{ ...theme.text.h3, color: theme.color.primary, marginBottom: theme.space.md }}>
          Onderdelen ({lines.length})
        </Text>
        {lines.length === 0 ? (
          <Text style={{ ...theme.text.body, color: theme.color.muted }}>Geen onderdelen.</Text>
        ) : (
          lines.map((r) => (
            <View
              key={r.id}
              style={{
                borderTopWidth: 1,
                borderTopColor: theme.color.border,
                paddingVertical: theme.space.md,
              }}
            >
              <Text style={{ ...theme.text.body, fontWeight: '600', color: theme.color.primary, marginBottom: theme.space.xs }}>
                {r.omschrijving}
              </Text>
              <Text style={{ ...theme.text.small, color: theme.color.muted }}>
                {r.aantal} × {currency(r.eenheidsprijs)} • Excl. {currency(r.ex)} • BTW {r.btwPerc}% ({currency(r.btwA)}) • Incl. {currency(r.inc)}
              </Text>
            </View>
          ))
        )}
        {company.voorwaarden ? (
          <View style={{ marginTop: theme.space.md, paddingTop: theme.space.md, borderTopWidth: 1, borderTopColor: theme.color.border }}>
            <Text style={{ ...theme.text.h3, color: theme.color.primary, marginBottom: theme.space.sm }}>
              📋 Opmerkingen / Voorwaarden
            </Text>
            <Text style={{ ...theme.text.small, color: theme.color.muted }}>{company.voorwaarden}</Text>
          </View>
        ) : null}
      </Card>

      <SignaturePad
        value={signatureData}
        onChange={(sig) => setSignatureData(sig)}
        onClear={() => setSignatureData(null)}
      />

      <Card style={{ marginBottom: theme.space.lg }}>
        <Text style={{ ...theme.text.h3, color: theme.color.primary, marginBottom: theme.space.md }}>
          💰 Totalen
        </Text>
        <Row left="Totaal excl." right={currency(exTotal)} />
        <Row left="BTW" right={currency(btwTotal)} />
        <Row left="Totaal incl." right={currency(incTotal)} style={{ marginBottom: theme.space.md }} />

        <View style={{ flexDirection: 'row', gap: theme.space.md, marginBottom: theme.space.md }}>
          <View style={{ flex: 1 }}>
            <Button title="📁 Opslaan" onPress={save} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="📄 PDF" onPress={genPDF} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: theme.space.md, marginBottom: theme.space.md }}>
          <View style={{ flex: 1 }}>
            <ShareButton 
              doc={{ type: docType, number: docNummer, date: docDatum, total: incTotal }}
              company={company}
              customer={klant}
              pdfBase64={null}
              style={{ flex: 1 }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="✔ Tekenen"
              onPress={acceptAndSign}
              variant={acceptEnabled ? 'primary' : 'secondary'}
            />
          </View>
        </View>

        {/* Peppol verzending - alleen voor facturen */}
        {docType === 'FACTUUR' && (
          <View style={{ marginTop: theme.space.md }}>
            <Button
              title="📨 Verzend via Peppol"
              onPress={async () => {
                await ensureSaved();
                setPeppolModalVisible(true);
              }}
              variant="secondary"
            />
            <Text style={{ ...theme.text.xsmall, color: theme.color.muted, marginTop: theme.space.sm, textAlign: 'center' }}>
              💡 E-facturatie via Peppol netwerk (verplicht vanaf 2026)
            </Text>
          </View>
        )}

        {!acceptEnabled ? (
          <Text style={{ ...theme.text.xsmall, color: theme.color.muted, marginTop: theme.space.md }}>
            💡 Tip: voeg eerst een handtekening toe om te kunnen accepteren.
          </Text>
        ) : null}
      </Card>

      <Modal visible={false} transparent animationType="fade" />

      {/* Peppol Modal */}
      <PeppolSendModal
        visible={peppolModalVisible}
        onClose={() => setPeppolModalVisible(false)}
        document={{ id: docNummer, number: docNummer, type: docType }}
        customer={klant}
      />
    </ScreenWrapper>
  );
}
