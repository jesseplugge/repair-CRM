import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { pageSizeFor } from './format';
import { formatEuro } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/format';
import type { PdfTranslator } from './i18n';

export type SignedIntakeProps = {
  t: PdfTranslator;
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

export function SignedIntakeDocument(props: SignedIntakeProps) {
  const { t } = props;
  const DOC_LABELS: Record<string, string> = {
    algemene_voorwaarden: t('docAlgemeneVoorwaarden'),
    reparatievoorwaarden: t('docReparatievoorwaarden'),
    privacy: t('docPrivacy'),
  };

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

        <Text style={s.title}>{t('title', { repairNumber: props.repairNumber })}</Text>

        <Text style={s.sectionTitle}>{t('customer')}</Text>
        <Text>{props.customer.name}</Text>
        {props.customer.phone && <Text style={s.small}>{props.customer.phone}</Text>}

        <Text style={s.sectionTitle}>{t('device')}</Text>
        <Text>
          {props.device.brand} {props.device.model}
        </Text>
        <Text style={s.small}>{props.device.imei ? `IMEI ${props.device.imei}` : t('noImei')}</Text>
        {props.device.conditionNotes && <Text style={s.small}>{t('conditionAtIntake', { notes: props.device.conditionNotes })}</Text>}

        <Text style={s.sectionTitle}>{t('repair')}</Text>
        <Text>{props.repairTypeLabel}</Text>
        {props.estimatedPrice != null && <Text style={s.small}>{t('estimatedPrice', { price: formatEuro(props.estimatedPrice) })}</Text>}

        <View style={s.declaration}>
          <Text>{t('declarationIntro')}</Text>
          <Text>• {t('declaration1')}</Text>
          <Text>• {t('declaration2')}</Text>
          <Text>• {t('declaration3')}</Text>
          <Text>• {t('declaration4')}</Text>
          {props.termsVersions.map((tv) => (
            <Text key={tv.documentType} style={{ marginLeft: 8 }}>
              {t('termsLine', {
                label: DOC_LABELS[tv.documentType] ?? tv.documentType,
                version: tv.versionLabel,
                date: tv.effectiveDate,
              })}
            </Text>
          ))}
        </View>

        <View style={s.signatureBox}>
          <Text style={s.small}>{t('signature')}</Text>
          <Image src={props.signatureImage} style={s.signatureImg} />
          <Text style={s.small}>{t('signedOn', { date: formatDateTime(props.signedAt) })}</Text>
        </View>
      </Page>
    </Document>
  );
}
