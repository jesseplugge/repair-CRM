import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { pageSizeFor } from './format';
import { formatEuro } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/format';

export type SignedIntakeProps = {
  repairNumber: string;
  business: {
    name: string;
    address?: string | null;
    postcode?: string | null;
    city?: string | null;
    kvkNumber?: string | null;
    vatNumber?: string | null;
    logoUrl?: string | null;
  };
  customer: { name: string; phone?: string | null; email?: string | null };
  device: { brand: string; model: string; imei?: string | null; conditionNotes?: string | null };
  repairTypeLabel: string;
  estimatedPrice: number | null;
  termsVersions: { documentType: string; versionLabel: string; effectiveDate: string }[];
  signatureImage: string; // data URL
  signedAt: string;
};

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica', color: '#14171C' },
  businessName: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  logo: { width: 36, height: 36, objectFit: 'contain' },
  small: { fontSize: 9, color: '#495164', lineHeight: 1.4 },
  title: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#8A93A6', textTransform: 'uppercase', marginBottom: 4, marginTop: 14 },
  declaration: { fontSize: 9.5, lineHeight: 1.6, marginTop: 10, padding: 10, backgroundColor: '#F7F8FA' },
  signatureBox: { marginTop: 24, borderWidth: 1, borderColor: '#C7CCD6', padding: 10 },
  signatureImg: { width: 220, height: 90, objectFit: 'contain' },
});

const DOC_LABELS: Record<string, string> = {
  algemene_voorwaarden: 'Algemene Voorwaarden',
  reparatievoorwaarden: 'Reparatievoorwaarden',
  privacy: 'Privacyverklaring',
};

export function SignedIntakeDocument(props: SignedIntakeProps) {
  return (
    <Document>
      <Page size={pageSizeFor('a4')} style={s.page}>
        <View style={s.headerRow}>
          {props.business.logoUrl ? <Image src={props.business.logoUrl} style={s.logo} /> : null}
          <Text style={s.businessName}>{props.business.name}</Text>
        </View>
        <Text style={s.small}>
          {props.business.address}
          {props.business.postcode ? `, ${props.business.postcode} ${props.business.city}` : ''}
        </Text>
        <Text style={s.small}>
          {props.business.kvkNumber ? `KVK ${props.business.kvkNumber}` : ''}
          {props.business.kvkNumber && props.business.vatNumber ? ' · ' : ''}
          {props.business.vatNumber ? `BTW ${props.business.vatNumber}` : ''}
        </Text>

        <Text style={s.title}>Ondertekend innamebewijs — {props.repairNumber}</Text>

        <Text style={s.sectionTitle}>Klant</Text>
        <Text>{props.customer.name}</Text>
        {props.customer.phone && <Text style={s.small}>{props.customer.phone}</Text>}

        <Text style={s.sectionTitle}>Apparaat</Text>
        <Text>
          {props.device.brand} {props.device.model}
        </Text>
        <Text style={s.small}>{props.device.imei ? `IMEI ${props.device.imei}` : 'Geen IMEI geregistreerd'}</Text>
        {props.device.conditionNotes && <Text style={s.small}>Staat bij intake: {props.device.conditionNotes}</Text>}

        <Text style={s.sectionTitle}>Reparatie</Text>
        <Text>{props.repairTypeLabel}</Text>
        {props.estimatedPrice != null && <Text style={s.small}>Geschatte prijs: {formatEuro(props.estimatedPrice)}</Text>}

        <View style={s.declaration}>
          <Text>Door hieronder te ondertekenen bevestigt de klant:</Text>
          <Text>• Dat het apparaat in de beschreven staat is afgegeven.</Text>
          <Text>• Dat de gegevens van het apparaat correct zijn.</Text>
          <Text>• Dat de geschatte prijs is begrepen, indien van toepassing.</Text>
          <Text>• Kennis te hebben genomen van en akkoord te gaan met de volgende voorwaarden:</Text>
          {props.termsVersions.map((t) => (
            <Text key={t.documentType} style={{ marginLeft: 8 }}>
              – {DOC_LABELS[t.documentType] ?? t.documentType} {t.versionLabel} (geldig vanaf {t.effectiveDate})
            </Text>
          ))}
        </View>

        <View style={s.signatureBox}>
          <Text style={s.small}>Handtekening klant</Text>
          <Image src={props.signatureImage} style={s.signatureImg} />
          <Text style={s.small}>Ondertekend op {formatDateTime(props.signedAt)}</Text>
        </View>
      </Page>
    </Document>
  );
}
