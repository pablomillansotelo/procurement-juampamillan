-- Procurement Backend initial migration

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'purchase_order_status') THEN
    CREATE TYPE "purchase_order_status" AS ENUM ('draft','approved','sent','received','closed','cancelled');
  END IF;
END $$;

-- API keys
CREATE TABLE IF NOT EXISTS "api_keys" (
  "id" serial PRIMARY KEY NOT NULL,
  "key_hash" text NOT NULL,
  "name" text NOT NULL,
  "scopes" jsonb,
  "rate_limit" integer DEFAULT 100,
  "expires_at" timestamp,
  "created_by" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "last_used_at" timestamp,
  "is_active" text DEFAULT 'active',
  CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);

-- Suppliers
CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "phone" text,
  "address" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Purchase orders
CREATE TABLE IF NOT EXISTS "purchase_orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_id" integer NOT NULL,
  "status" "purchase_order_status" DEFAULT 'draft' NOT NULL,
  "warehouse_id" integer NOT NULL,
  "currency" text DEFAULT 'MXN' NOT NULL,
  "total" numeric(12, 2) DEFAULT 0 NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'purchase_orders_supplier_id_suppliers_id_fk'
  ) THEN
    ALTER TABLE "purchase_orders"
      ADD CONSTRAINT "purchase_orders_supplier_id_suppliers_id_fk"
      FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
      ON DELETE restrict;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_purchase_orders_supplier_id" ON "purchase_orders" ("supplier_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_orders_status" ON "purchase_orders" ("status");

-- Purchase order items
CREATE TABLE IF NOT EXISTS "purchase_order_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "purchase_order_id" integer NOT NULL,
  "external_product_id" integer NOT NULL,
  "sku_snapshot" text,
  "name_snapshot" text,
  "quantity" integer NOT NULL,
  "unit_cost" numeric(12, 2) NOT NULL,
  "line_total" numeric(12, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'purchase_order_items_purchase_order_id_purchase_orders_id_fk'
  ) THEN
    ALTER TABLE "purchase_order_items"
      ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk"
      FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id")
      ON DELETE cascade;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_purchase_order_items_po_id" ON "purchase_order_items" ("purchase_order_id");
CREATE INDEX IF NOT EXISTS "idx_purchase_order_items_external_product_id" ON "purchase_order_items" ("external_product_id");

-- Receipts
CREATE TABLE IF NOT EXISTS "receipts" (
  "id" serial PRIMARY KEY NOT NULL,
  "supplier_id" integer NOT NULL,
  "purchase_order_id" integer,
  "warehouse_id" integer NOT NULL,
  "reference" text,
  "received_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'receipts_supplier_id_suppliers_id_fk'
  ) THEN
    ALTER TABLE "receipts"
      ADD CONSTRAINT "receipts_supplier_id_suppliers_id_fk"
      FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id")
      ON DELETE restrict;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'receipts_purchase_order_id_purchase_orders_id_fk'
  ) THEN
    ALTER TABLE "receipts"
      ADD CONSTRAINT "receipts_purchase_order_id_purchase_orders_id_fk"
      FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id")
      ON DELETE set null;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_receipts_supplier_id" ON "receipts" ("supplier_id");
CREATE INDEX IF NOT EXISTS "idx_receipts_purchase_order_id" ON "receipts" ("purchase_order_id");

-- Receipt items
CREATE TABLE IF NOT EXISTS "receipt_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "receipt_id" integer NOT NULL,
  "external_product_id" integer NOT NULL,
  "sku_snapshot" text,
  "name_snapshot" text,
  "quantity_received" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'receipt_items_receipt_id_receipts_id_fk'
  ) THEN
    ALTER TABLE "receipt_items"
      ADD CONSTRAINT "receipt_items_receipt_id_receipts_id_fk"
      FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id")
      ON DELETE cascade;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_receipt_items_receipt_id" ON "receipt_items" ("receipt_id");


