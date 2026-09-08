-- Adds an optional transaction/reference ID (e.g. a Tikkie payment request ID,
-- or a pin terminal reference) and an optional tip amount to the payments
-- ledger. tip_amount is tracked separately from amount: amount is what's
-- applied against the repair/invoice/POS-sale balance, tip_amount is a
-- gratuity on top that never counts toward that balance.
alter table payments add column if not exists transaction_id text;
alter table payments add column if not exists tip_amount numeric(10,2) not null default 0;
