import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { pageSizeFor, isThermal, baseFontSize, type DocFormat } from './format';
import { formatEuro } from '@/lib/utils/currency';
import { formatDateTime } from '@/lib/utils/format';

export type ReceiptLine = {
  description: string;
  quantity: number;
  unitPriceExclVat: number;
  vatRate: number;
  totalInclVat: number;
};

export type ReceiptDocumentProps = {
  format: DocFormat;
  kind: 'intake' | 'completion';
  documentNumber: string;
  repairNumber?: string;
  dateTime: string;
  business: {
    name: string;
    address?: string | null;
    postcode?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    kvkNumber?: string | null;
    vatNumber?: string | null;
    logoUrl?: string | null;
  };
  customer: { name: string; phone?: string | null; email?: string | null };
  device?: {
    brand: string;
    model: string;
    imei?: string | null;
    color?: string | null;
    storage?: string | null;
    conditionNotes?: string | null;
  };
  lines: ReceiptLine[];
  subtotalExclVat: number;
  totalVat: number;
  totalInclVat: number;
  paymentMethod?: string | null;
  warrantyMonths?: number | null;
  complaint?: string | null;
  termsNote?: string;
};

function styles(format: DocFormat) {
  const thermal = isThermal(format);
  const base = baseFontSize(format);
  return StyleSheet.create({
    page: {
      padding: thermal ? 10 : 36,
      fontSize: base,
      fontFamily: 'Helvetica',
      color: '#14171C',
    },
    businessName: { fontSize: base + 4, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    logo: { width: thermal ? 28 : 40, height: thermal ? 28 : 40, objectFit: 'contain' },
    small: { fontSize: base - 1, color: '#495164' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    section: { marginTop: thermal ? 8 : 14 },
    sectionTitle: { fontSize: base, fontFamily: 'Helvetica-Bold', marginBottom: 4, textTransform: 'uppercase' },
    hr: { borderBottomWidth: 1, borderBottomColor: '#C7CCD6', marginVertical: thermal ? 6 : 10 },
    lineRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    lineDesc: { flex: 1 },
    lineTotal: { width: 60, textAlign: 'right' },
    totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
    grandTotal: { fontSize: base + 2, fontFamily: 'Helvetica-Bold' },
    footer: { marginTop: thermal ? 12 : 24, fontSize: base - 1, color: '#8A93A6', textAlign: thermal ? 'center' : 'left' },
  });
}

export function ReceiptDocument(props: ReceiptDocumentProps) {
  const s = styles(props.format);
  const title = props.kind === 'intake' ? 'Innamebewijs / Reparatiebon' : 'Kassabon';

  return (
    <Document>
      <Page size={pageSizeFor(props.format)} style={s.page}>
        <View style={s.headerRow}>
          {props.business.logoUrl ? <Image src={props.business.logoUrl} style={s.logo} /> : null}
          <View>
            <Text style={s.businessName}>{props.business.name}</Text>
          </View>
        </View>
        <Text style={s.small}>
          {props.business.address}
          {props.business.postcode ? `, ${props.business.postcode}` : ''} {props.business.city}
        </Text>
        {(props.business.phone || props.business.email) && (
          <Text style={s.small}>
            {props.business.phone}
            {props.business.phone && props.business.email ? ' · ' : ''}
            {props.business.email}
          </Text>
        )}
        {(props.business.kvkNumber || props.business.vatNumber) && (
          <Text style={s.small}>
            {props.business.kvkNumber ? `KVK ${props.business.kvkNumber}` : ''}
            {props.business.kvkNumber && props.business.vatNumber ? ' · ' : ''}
            {props.business.vatNumber ? `BTW ${props.business.vatNumber}` : ''}
          </Text>
        )}

        <View style={s.hr} />

        <Text style={{ fontSize: baseFontSize(props.format) + 2, fontFamily: 'Helvetica-Bold' }}>{title}</Text>
        <View style={s.row}>
          <Text style={s.small}>
            {props.documentNumber}
            {props.repairNumber ? ` · ${props.repairNumber}` : ''}
          </Text>
          <Text style={s.small}>{formatDateTime(props.dateTime)}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Klant</Text>
          <Text>{props.customer.name}</Text>
          {props.customer.phone && <Text style={s.small}>{props.customer.phone}</Text>}
          {props.customer.email && <Text style={s.small}>{props.customer.email}</Text>}
        </View>

        {props.device && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Apparaat</Text>
            <Text>
              {props.device.brand} {props.device.model}
            </Text>
            <Text style={s.small}>
              {props.device.color ? `${props.device.color} · ` : ''}
              {props.device.storage ? `${props.device.storage} · ` : ''}
              {props.device.imei ? `IMEI ${props.device.imei}` : 'Geen IMEI geregistreerd'}
            </Text>
            {props.device.conditionNotes && <Text style={s.small}>Staat: {props.device.conditionNotes}</Text>}
          </View>
        )}

        {props.complaint && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Klacht</Text>
            <Text>{props.complaint}</Text>
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>{props.kind === 'intake' ? 'Geschatte werkzaamheden' : 'Specificatie'}</Text>
          <View style={s.hr} />
          {props.lines.map((line, i) => (
            <View key={i} style={s.lineRow}>
              <Text style={s.lineDesc}>
                {line.quantity > 1 ? `${line.quantity}x ` : ''}
                {line.description}
              </Text>
              <Text style={s.lineTotal}>{formatEuro(line.totalInclVat)}</Text>
            </View>
          ))}
          <View style={s.hr} />
          <View style={s.totalsRow}>
            <Text style={s.small}>Subtotaal excl. BTW</Text>
            <Text style={s.small}>{formatEuro(props.subtotalExclVat)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.small}>BTW</Text>
            <Text style={s.small}>{formatEuro(props.totalVat)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={s.grandTotal}>Totaal</Text>
            <Text style={s.grandTotal}>{formatEuro(props.totalInclVat)}</Text>
          </View>
          {props.paymentMethod && (
            <View style={s.totalsRow}>
              <Text style={s.small}>Betaalmethode</Text>
              <Text style={s.small}>{props.paymentMethod}</Text>
            </View>
          )}
        </View>

        {props.warrantyMonths && props.kind === 'completion' && (
          <View style={s.section}>
            <Text style={s.small}>Garantie: {props.warrantyMonths} maanden vanaf ophaaldatum.</Text>
          </View>
        )}

        {props.termsNote && (
          <View style={s.section}>
            <Text style={s.small}>{props.termsNote}</Text>
          </View>
        )}

        <Text style={s.footer}>Bedankt voor uw vertrouwen in {props.business.name}.</Text>
      </Page>
    </Document>
  );
}
