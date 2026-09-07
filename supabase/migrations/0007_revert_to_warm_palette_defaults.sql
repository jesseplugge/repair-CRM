-- Reverts 0006_retint_default_palette.sql: the graphite/indigo identity was rolled back
-- (dashboard layout and colors reverted per user request), keeping the rest of that
-- session's design-system work. Restores the original warm-stone/teal defaults for new
-- business signups.

alter table businesses alter column accent_color set default '#0C7C82';

create or replace function seed_business_defaults() returns trigger
language plpgsql as $$
begin
  insert into repair_statuses (business_id, name, sort_order, color, is_terminal) values
    (new.id, 'Nieuw', 1, '#4C5FD5', false),
    (new.id, 'Wacht op akkoord', 2, '#C97A22', false),
    (new.id, 'In behandeling', 3, '#0C7C82', false),
    (new.id, 'Wacht op onderdeel', 4, '#C97A22', false),
    (new.id, 'Wacht op klant', 5, '#C97A22', false),
    (new.id, 'Gereed', 6, '#2F8F5B', false),
    (new.id, 'Opgehaald', 7, '#495164', true),
    (new.id, 'Geannuleerd', 8, '#C4453A', true);

  insert into settings (business_id, key, value) values
    (new.id, 'vat_rates', '[21, 9, 0]'::jsonb),
    (new.id, 'payment_methods', '["contant", "pin", "bankoverschrijving"]'::jsonb),
    (new.id, 'receipt_format', '"a4"'::jsonb);

  insert into diagnostic_profiles (business_id, name, items) values
    (new.id, 'Telefoon', array[
      'Beeldscherm', 'Touch', 'Face ID / Touch ID', 'Camera voor', 'Camera achter',
      'Flitser', 'Speaker', 'Microfoon', 'Oorspeaker', 'Opladen', 'Wifi',
      'Bluetooth', 'Mobiel netwerk', 'Nabijheidssensor', 'Knoppen', 'Draadloos opladen'
    ]);

  return new;
end $$;
