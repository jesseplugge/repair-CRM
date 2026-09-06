import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatEuro } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/format';
import type { ReportData } from '@/lib/reports/data';

export type ReportDocumentProps = {
  businessName: string;
  data: ReportData;
};

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica', color: '#14171C' },
  header: { marginBottom: 24 },
  businessName: { fontSize: 12, color: '#495164', marginBottom: 4 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  period: { fontSize: 10, color: '#8A93A6' },
  sectionTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#8A93A6', textTransform: 'uppercase', marginBottom: 6, marginTop: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  statBox: { flex: 1, borderWidth: 1, borderColor: '#EDEFF3', borderRadius: 4, padding: 10 },
  statValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  statLabel: { fontSize: 8.5, color: '#8A93A6', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#14171C',
    paddingBottom: 5,
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
  },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#EDEFF3', paddingVertical: 5, fontSize: 9 },
  colNum: { flex: 1.2 },
  colCustomer: { flex: 1.8 },
  colDate: { flex: 1 },
  colStatus: { flex: 1.2 },
  colAmount: { flex: 1, textAlign: 'right' },
  overdue: { color: '#C4453A' },
});

export function ReportDocument({ businessName, data }: ReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.businessName}>{businessName}</Text>
          <Text style={s.title}>Rapportage</Text>
          <Text style={s.period}>
            {formatDate(data.from)} — {formatDate(data.to)}
          </Text>
        </View>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>{formatEuro(data.totalOmzet)}</Text>
            <Text style={s.statLabel}>OMZET</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{formatEuro(data.totalBtw)}</Text>
            <Text style={s.statLabel}>BTW</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{formatEuro(data.partsCost)}</Text>
            <Text style={s.statLabel}>ONDERDELENKOSTEN</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statValue}>{formatEuro(data.grossProfit)}</Text>
            <Text style={s.statLabel}>BRUTOWINST</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Omzet naar bron</Text>
        <View style={s.row}>
          <Text>Reparaties</Text>
          <Text>{formatEuro(data.repairRevenueIncl)}</Text>
        </View>
        <View style={s.row}>
          <Text>Producten (kassa)</Text>
          <Text>{formatEuro(data.productRevenueIncl)}</Text>
        </View>

        <Text style={s.sectionTitle}>BTW per tarief</Text>
        {data.vatBreakdown.map(([rate, vat]) => (
          <View style={s.row} key={rate}>
            <Text>{rate}%</Text>
            <Text>{formatEuro(vat)}</Text>
          </View>
        ))}
        {data.vatBreakdown.length === 0 && <Text style={{ color: '#8A93A6' }}>Geen data in deze periode.</Text>}

        <Text style={s.sectionTitle}>Populaire reparaties</Text>
        {data.popular.map(([label, count]) => (
          <View style={s.row} key={label}>
            <Text>{label}</Text>
            <Text>{count}x</Text>
          </View>
        ))}
        {data.popular.length === 0 && <Text style={{ color: '#8A93A6' }}>Geen data in deze periode.</Text>}

        <Text style={s.sectionTitle}>Openstaande facturen ({data.outstandingInvoices.length}) — totaal {formatEuro(data.totalOutstanding)}</Text>
        {data.outstandingInvoices.length > 0 ? (
          <>
            <View style={s.tableHeader}>
              <Text style={s.colNum}>Nummer</Text>
              <Text style={s.colCustomer}>Klant</Text>
              <Text style={s.colDate}>Vervaldatum</Text>
              <Text style={s.colStatus}>Status</Text>
              <Text style={s.colAmount}>Openstaand</Text>
            </View>
            {data.outstandingInvoices.map((inv) => (
              <View style={s.tableRow} key={inv.id}>
                <Text style={s.colNum}>{inv.invoiceNumber}</Text>
                <Text style={s.colCustomer}>{inv.customerName}</Text>
                <Text style={[s.colDate, inv.overdue ? s.overdue : {}]}>
                  {formatDate(inv.dueDate)}
                  {inv.overdue ? ' (vervallen)' : ''}
                </Text>
                <Text style={s.colStatus}>{inv.status}</Text>
                <Text style={s.colAmount}>{formatEuro(inv.outstanding)}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={{ color: '#8A93A6' }}>Geen openstaande facturen.</Text>
        )}
      </Page>
    </Document>
  );
}
