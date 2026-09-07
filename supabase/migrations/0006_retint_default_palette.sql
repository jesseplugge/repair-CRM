-- Retints the default colors given to NEW businesses so onboarding stops seeding the
-- retired warm-stone/teal palette. Existing businesses' stored accent_color and
-- repair_statuses.color rows were retinted separately (see the design-system session
-- that introduced the new graphite/indigo identity) — this migration only changes
-- what happens going forward.

alter table businesses alter column accent_color set default '#4F46E5';

create or replace function seed_business_defaults() returns trigger
language plpgsql as $$
begin
  insert into repair_statuses (business_id, name, sort_order, color, is_terminal) values
    (new.id, 'Nieuw', 1, '#0284C7', false),
    (new.id, 'Wacht op akkoord', 2, '#D97706', false),
    (new.id, 'In behandeling', 3, '#4F46E5', false),
    (new.id, 'Wacht op onderdeel', 4, '#D97706', false),
    (new.id, 'Wacht op klant', 5, '#D97706', false),
    (new.id, 'Gereed', 6, '#16A34A', false),
    (new.id, 'Opgehaald', 7, '#495164', true),
    (new.id, 'Geannuleerd', 8, '#DC2626', true);

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
