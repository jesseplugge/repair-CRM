-- Products previously stored only the excl.-BTW price and derived the incl.-BTW
-- price at render/sale time (excl * (1 + rate)). At 21% VAT, some incl.-BTW
-- amounts (e.g. 79,95 / 59,95 / 149,95) have no excl.-BTW cent value that
-- converts back to them exactly, so the advertised price and the amount
-- actually charged in the kassa could differ by a cent. Storing the incl.-BTW
-- price directly (as the authoritative "what the customer pays" figure) fixes
-- this at the source; excl.-BTW is kept for bookkeeping and derived from it.
alter table products add column if not exists selling_price_incl_vat numeric(10,2);
alter table products add column if not exists purchase_price_incl_vat numeric(10,2);
