// Hand-authored to match supabase/migrations/0001_init.sql.
// Once you've run `supabase link`, replace this file with the real generated
// types via `npm run db:types` — keep it in sync as you add migrations.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

type Table<Row, Insert extends Partial<Row> = Partial<Row>, Update extends Partial<Row> = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

export interface Database {
  public: {
    Tables: {
      businesses: Table<{
        id: string;
        legal_name: string;
        trading_name: string | null;
        address: string | null;
        postcode: string | null;
        city: string | null;
        phone: string | null;
        email: string | null;
        website: string | null;
        kvk_number: string | null;
        vat_number: string | null;
        iban: string | null;
        logo_url: string | null;
        default_vat_rate: number;
        default_warranty_months: number;
        accent_color: string;
        created_at: string;
      }>;
      users: Table<{
        id: string;
        business_id: string;
        full_name: string;
        email: string;
        role: string;
        active: boolean;
        created_at: string;
      }>;
      customers: Table<{
        id: string;
        business_id: string;
        customer_number: string;
        first_name: string;
        last_name: string;
        company_name: string | null;
        phone: string | null;
        email: string | null;
        address: string | null;
        postcode: string | null;
        city: string | null;
        notes: string | null;
        customer_since: string;
        created_at: string;
        updated_at: string;
      }>;
      devices: Table<{
        id: string;
        business_id: string;
        customer_id: string;
        brand: string;
        model: string;
        imei: string | null;
        serial_number: string | null;
        color: string | null;
        storage_capacity: string | null;
        passcode: string | null;
        condition_notes: string | null;
        existing_damage: string | null;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>;
      repair_statuses: Table<{
        id: string;
        business_id: string;
        name: string;
        sort_order: number;
        color: string | null;
        is_terminal: boolean;
        active: boolean;
      }>;
      repairs: Table<{
        id: string;
        business_id: string;
        repair_number: string;
        customer_id: string;
        device_id: string;
        status_id: string;
        repair_type_label: string | null;
        description: string | null;
        customer_complaint: string | null;
        technician_notes: string | null;
        device_condition_snapshot: Json | null;
        estimated_price: number | null;
        final_price: number | null;
        parts_cost: number | null;
        labour_cost: number | null;
        date_received: string;
        expected_completion_date: string | null;
        date_completed: string | null;
        date_picked_up: string | null;
        warranty_months: number | null;
        warranty_start: string | null;
        warranty_end: string | null;
        payment_status: string;
        payment_method: string | null;
        created_by: string | null;
        created_at: string;
        updated_at: string;
      }>;
      repair_items: Table<{
        id: string;
        repair_id: string;
        item_type: string;
        product_id: string | null;
        catalog_repair_type_id: string | null;
        description: string;
        quantity: number;
        cost_price_excl_vat: number | null;
        selling_price_excl_vat: number;
        vat_rate: number;
        discount: number | null;
        total_excl_vat: number;
        total_incl_vat: number;
        created_at: string;
      }>;
      catalog_repair_types: Table<{
        id: string;
        business_id: string;
        name: string;
        category: string | null;
        brand: string | null;
        model: string | null;
        description: string | null;
        selling_price: number;
        vat_rate: number;
        default_product_id: string | null;
        part_cost: number | null;
        labour_price: number | null;
        estimated_duration_minutes: number | null;
        warranty_months: number | null;
        active: boolean;
      }>;
      products: Table<{
        id: string;
        business_id: string;
        name: string;
        sku: string | null;
        category_id: string | null;
        supplier_id: string | null;
        purchase_price_excl_vat: number | null;
        selling_price_excl_vat: number;
        vat_rate: number;
        stock_quantity: number;
        minimum_stock: number | null;
        supplier_sku: string | null;
        notes: string | null;
        active: boolean;
      }>;
      product_categories: Table<{
        id: string;
        business_id: string;
        name: string;
        parent_id: string | null;
      }>;
      suppliers: Table<{
        id: string;
        business_id: string;
        name: string;
        contact_name: string | null;
        phone: string | null;
        email: string | null;
        notes: string | null;
      }>;
      activity_logs: Table<{
        id: string;
        business_id: string;
        entity_type: string;
        entity_id: string;
        action: string;
        description: string;
        old_value: Json | null;
        new_value: Json | null;
        performed_by: string | null;
        created_at: string;
      }>;
      settings: Table<{
        business_id: string;
        key: string;
        value: Json;
      }>;
      payments: Table<{
        id: string;
        business_id: string;
        customer_id: string | null;
        repair_id: string | null;
        invoice_id: string | null;
        pos_sale_id: string | null;
        amount: number;
        method: string;
        paid_at: string;
        notes: string | null;
        created_by: string | null;
        created_at: string;
      }>;
      refunds: Table<{
        id: string;
        business_id: string;
        original_payment_id: string;
        amount: number;
        reason: string | null;
        method: string;
        created_by: string | null;
        created_at: string;
      }>;
      pos_sales: Table<{
        id: string;
        business_id: string;
        sale_number: string;
        customer_id: string | null;
        status: string;
        subtotal_excl_vat: number;
        total_vat: number;
        total_incl_vat: number;
        created_by: string | null;
        created_at: string;
      }>;
      pos_sale_items: Table<{
        id: string;
        pos_sale_id: string;
        product_id: string | null;
        description: string;
        quantity: number;
        unit_price_excl_vat: number;
        vat_rate: number;
        discount: number | null;
        total_excl_vat: number;
        total_incl_vat: number;
      }>;
      invoices: Table<{
        id: string;
        business_id: string;
        invoice_number: string;
        customer_id: string;
        repair_id: string | null;
        pos_sale_id: string | null;
        status: string;
        invoice_date: string;
        service_date: string | null;
        payment_terms_days: number | null;
        subtotal_excl_vat: number;
        total_vat: number;
        total_incl_vat: number;
        notes: string | null;
        created_by: string | null;
        created_at: string;
      }>;
      invoice_items: Table<{
        id: string;
        invoice_id: string;
        description: string;
        quantity: number;
        unit_price_excl_vat: number;
        vat_rate: number;
        vat_amount: number;
        total_excl_vat: number;
        total_incl_vat: number;
      }>;
      credit_notes: Table<{
        id: string;
        business_id: string;
        credit_note_number: string;
        original_invoice_id: string;
        amount_excl_vat: number;
        vat_amount: number;
        amount_incl_vat: number;
        reason: string | null;
        created_by: string | null;
        created_at: string;
      }>;
      receipts: Table<{
        id: string;
        business_id: string;
        receipt_number: string;
        type: string;
        format: string;
        customer_id: string | null;
        repair_id: string | null;
        pos_sale_id: string | null;
        created_by: string | null;
        created_at: string;
      }>;
      document_templates: Table<{
        id: string;
        business_id: string;
        type: string;
        format: string;
        content: Json;
        active: boolean;
      }>;
      cash_sessions: Table<{
        id: string;
        business_id: string;
        opened_by: string | null;
        opened_at: string;
        opening_amount: number;
        closed_by: string | null;
        closed_at: string | null;
        closing_amount_expected: number | null;
        closing_amount_actual: number | null;
        difference: number | null;
        notes: string | null;
      }>;
      cash_movements: Table<{
        id: string;
        cash_session_id: string;
        type: string;
        amount: number;
        related_payment_id: string | null;
        notes: string | null;
        created_at: string;
      }>;
      terms_versions: Table<{
        id: string;
        business_id: string;
        document_type: string;
        version_label: string;
        content: string;
        effective_date: string;
        is_active: boolean;
        created_at: string;
      }>;
      intake_signatures: Table<{
        id: string;
        business_id: string;
        repair_id: string;
        customer_id: string;
        device_id: string;
        signed_by_user_id: string | null;
        signature_image: string;
        signed_at: string;
        ip_address: string | null;
        checkbox_confirmed: boolean;
        terms_accepted: Json;
        estimated_price_at_signing: number | null;
        device_condition_snapshot: Json;
        created_at: string;
      }>;
    };
    Functions: {
      next_number: {
        Args: { p_business_id: string; p_type: string; p_year: number; p_prefix: string; p_pad: number };
        Returns: string;
      };
      create_business_and_owner: {
        Args: {
          p_legal_name: string;
          p_trading_name: string | null;
          p_address: string | null;
          p_postcode: string | null;
          p_city: string | null;
          p_phone: string | null;
          p_email: string | null;
          p_kvk_number: string | null;
          p_vat_number: string | null;
          p_iban: string | null;
          p_full_name: string;
        };
        Returns: string;
      };
    };
  };
}
