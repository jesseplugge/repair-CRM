import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { pageSizeFor } from './format';
import { formatEuro } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/format';

export type InvoiceLine = {
  description: string;
  quantity: number;
  unitPriceExclVat: number;
  vatRate: number;
  vatAmount: number;
  totalExclVat: number;
  totalInclVat: number;
};

export type InvoiceDocumentProps = {
  invoiceNumber: string;
  invoiceDate: string;
  serviceDate?: string | null;
  paymentTermsDays?: number | null;
  status: string;
  business: {
    name: string;
    address?: string | null;
    postcode?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    kvkNumber?: string | null;
    vatNumber?: string | null;
    iban?: string | null;
    logoUrl?: string | null;
  };
  customer: {
    name: string;
    companyName?: string | null;
    address?: string | null;
    postcode?: string | null;
    city?: string | null;
  };
  lines: InvoiceLine[];
  subtotalExclVat: number;
  totalVat: number;
  totalInclVat: number;
  notes?: string | null;
  footerNote?: string | null;
};

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica', color: '#14171C' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, objectFit: 'contain' },
  businessName: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  small: { fontSize: 9, color: '#495164', lineHeight: 1.4 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  metaLabel: { color: '#8A93A6' },
  billTo: { marginTop: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#8A93A6', textTransform: 'uppercase', marginBottom: 4 },
  table: { marginTop: 8 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#14171C',
    paddingBottom: 6,
    marginBottom: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#EDEFF3', paddingVertical: 6 },
  colDesc: { flex: 3 },
  colQty: { flex: 0.6, textAlign: 'right' },
  colPrice: { flex: 1, textAlign: 'right' },
  colVat: { flex: 0.6, textAlign: 'right' },
  colTotal: { flex: 1, textAlign: 'right' },
  totals: { marginTop: 16, alignItems: 'flex-end' },
  totalsRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', marginBottom: 3 },
  grandTotalRow: { flexDirection: 'row', width: 220, justifyContent: 'space-between', marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#14171C' },
  grandTotal: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  footer: { marginTop: 40, fontSize: 8.5, color: '#8A93A6', lineHeight: 1.5 },
  statusBadge: { fontSize: 9, color: '#0C7C82', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
});

const STATUS_LABELS: Record<string, string> = {
  draft: 'Concept',
  sent: 'Verzonden',
  paid: 'Betaald',
  partially_paid: 'Gedeeltelijk betaald',
  overdue: 'Vervallen',
  cancelled: 'Geannuleerd',
};

export function InvoiceDocument(props: InvoiceDocumentProps) {
  return (
    <Document>
      <Page size={pageSizeFor('a4')} style={s.page}>
        <View style={s.header}>
          <View style={s.headerLeft}>
            {props.business.logoUrl ? <Image src={props.business.logoUrl} style={s.logo} /> : null}
            <View>
              <Text style={s.businessName}>{props.business.name}</Text>
              <Text style={s.small}>
                {props.business.address}
                {props.business.postcode ? `\n${props.business.postcode} ${props.business.city}` : ''}
              </Text>
              <Text style={s.small}>
                {props.business.phone}
                {props.business.phone && props.business.email ? ' · ' : ''}
                {props.business.email}
              </Text>
              <Text style={s.small}>
                {props.business.kvkNumber ? `KVK ${props.business.kvkNumber}` : ''}
                {props.business.kvkNumber && props.business.vatNumber ? ' · ' : ''}
                {props.business.vatNumber ? `BTW ${props.business.vatNumber}` : ''}
              </Text>
              {props.business.iban && <Text style={s.small}>IBAN {props.business.iban}</Text>}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.title}>Factuur</Text>
            <Text style={s.statusBadge}>{STATUS_LABELS[props.status] ?? props.status}</Text>
          </View>
        </View>

        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Factuurnummer</Text>
          <Text>{props.invoiceNumber}</Text>
        </View>
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>Factuurdatum</Text>
          <Text>{formatDate(props.invoiceDate)}</Text>
        </View>
        {props.serviceDate && (
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Leverdatum</Text>
            <Text>{formatDate(props.serviceDate)}</Text>
          </View>
        )}
        {props.paymentTermsDays && (
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Betalingstermijn</Text>
            <Text>{props.paymentTermsDays} dagen</Text>
          </View>
        )}

        <View style={s.billTo}>
          <Text style={s.sectionTitle}>Factuuradres</Text>
          <Text>{props.customer.companyName || props.customer.name}</Text>
          {props.customer.companyName && <Text style={s.small}>t.a.v. {props.customer.name}</Text>}
          {props.customer.address && <Text style={s.small}>{props.customer.address}</Text>}
          {(props.customer.postcode || props.customer.city) && (
            <Text style={s.small}>
              {props.customer.postcode} {props.customer.city}
            </Text>
          )}
        </View>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.colDesc}>Omschrijving</Text>
            <Text style={s.colQty}>Aantal</Text>
            <Text style={s.colPrice}>Prijs excl.</Text>
            <Text style={s.colVat}>BTW</Text>
            <Text style={s.colTotal}>Totaal incl.</Text>
          </View>
          {props.lines.map((line, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={s.colDesc}>{line.description}</Text>
              <Text style={s.colQty}>{line.quantity}</Text>
              <Text style={s.colPrice}>{formatEuro(line.unitPriceExclVat)}</Text>
              <Text style={s.colVat}>{line.vatRate}%</Text>
              <Text style={s.colTotal}>{formatEuro(line.totalInclVat)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalsRow}>
            <Text>Subtotaal excl. BTW</Text>
            <Text>{formatEuro(props.subtotalExclVat)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text>BTW</Text>
            <Text>{formatEuro(props.totalVat)}</Text>
          </View>
          <View style={s.grandTotalRow}>
            <Text style={s.grandTotal}>Totaal incl. BTW</Text>
            <Text style={s.grandTotal}>{formatEuro(props.totalInclVat)}</Text>
          </View>
        </View>

        {props.notes && (
          <View style={{ marginTop: 20 }}>
            <Text style={s.sectionTitle}>Opmerkingen</Text>
            <Text style={s.small}>{props.notes}</Text>
          </View>
        )}

        <Text style={s.footer}>
          Gelieve het factuurbedrag binnen {props.paymentTermsDays ?? 14} dagen over te maken onder vermelding van
          factuurnummer {props.invoiceNumber}
          {props.business.iban ? ` naar IBAN ${props.business.iban}` : ''}.
        </Text>
        {props.footerNote?.trim() && <Text style={[s.footer, { marginTop: 6 }]}>{props.footerNote}</Text>}
      </Page>
    </Document>
  );
}
