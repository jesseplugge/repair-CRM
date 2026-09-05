export function businessForPdf(business: any) {
  return {
    name: business.trading_name || business.legal_name,
    address: business.address,
    postcode: business.postcode,
    city: business.city,
    phone: business.phone,
    email: business.email,
    kvkNumber: business.kvk_number,
    vatNumber: business.vat_number,
    iban: business.iban,
    logoUrl: business.logo_url as string | null,
  };
}
