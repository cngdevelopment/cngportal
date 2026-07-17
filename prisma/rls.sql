-- RLS backstop (spec §5 rule 4) + CHECK constraints Prisma can't express.
-- Apply after `prisma migrate`. App-layer scoping is the primary defense;
-- these policies are the seatbelt.
--
-- Assumes the Supabase JWT carries the user's account_id claim, exposed via:
--   current_setting('request.jwt.claims', true)::json ->> 'account_id'
-- Staff (account_id IS NULL on users) connect through the service role,
-- which bypasses RLS — the app's staffContext() gate is their control.

-- ── CHECK constraints from spec §6 ──────────────────────────────────

-- SHIP orders must have a ship-to address (enforced at submit; DRAFTs exempt)
ALTER TABLE orders ADD CONSTRAINT ship_requires_address CHECK (
  status = 'DRAFT'
  OR delivery_method = 'PICKUP'
  OR (delivery_method = 'SHIP' AND ship_to_address_id IS NOT NULL)
);

-- assembly only on cabinet lines (validated app-side too; trigger version
-- because CHECK can't reference another table)
CREATE OR REPLACE FUNCTION check_assembly_is_cabinet() RETURNS trigger AS $$
BEGIN
  IF NEW.assembly IS NOT NULL THEN
    IF (SELECT category FROM products WHERE id = NEW.product_id) <> 'CABINETS' THEN
      RAISE EXCEPTION 'assembly may only be set on cabinet line items';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_assembly_check
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION check_assembly_is_cabinet();

-- ── Helper ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION jwt_account_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json ->> 'account_id', '')::uuid
$$ LANGUAGE sql STABLE;

-- ── Enable RLS on every tenant-scoped table ─────────────────────────

ALTER TABLE accounts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ship_to_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders            ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments       ENABLE ROW LEVEL SECURITY;

-- ── Policies ────────────────────────────────────────────────────────

CREATE POLICY tenant_accounts ON accounts
  USING (id = jwt_account_id());

CREATE POLICY tenant_addresses ON ship_to_addresses
  USING (account_id = jwt_account_id());

CREATE POLICY tenant_users ON users
  USING (account_id = jwt_account_id());

CREATE POLICY tenant_orders ON orders
  USING (account_id = jwt_account_id());

CREATE POLICY tenant_order_items ON order_items
  USING (order_id IN (SELECT id FROM orders WHERE account_id = jwt_account_id()));

-- Customers see only customer-visible events
CREATE POLICY tenant_order_events ON order_events
  USING (
    is_customer_visible
    AND order_id IN (SELECT id FROM orders WHERE account_id = jwt_account_id())
  );

-- Customers never see internal messages
CREATE POLICY tenant_order_messages ON order_messages
  USING (
    NOT is_internal
    AND order_id IN (SELECT id FROM orders WHERE account_id = jwt_account_id())
  );

CREATE POLICY tenant_attachments ON attachments
  USING (
    is_customer_visible
    AND order_id IN (SELECT id FROM orders WHERE account_id = jwt_account_id())
  );

-- Catalog tables (products, colors, product_colors, product_options) are
-- global reads — no RLS needed, but keep writes to the service role.
