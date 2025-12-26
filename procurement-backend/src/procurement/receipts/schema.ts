import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { suppliers } from "../suppliers/schema";
import { purchaseOrders } from "../purchase-orders/schema";

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull().references(() => suppliers.id, { onDelete: 'restrict' }),
  purchaseOrderId: integer("purchase_order_id").references(() => purchaseOrders.id, { onDelete: 'set null' }),
  warehouseId: integer("warehouse_id").notNull(), // Inventory warehouseId
  reference: text("reference"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const receiptItems = pgTable("receipt_items", {
  id: serial("id").primaryKey(),
  receiptId: integer("receipt_id").notNull().references(() => receipts.id, { onDelete: 'cascade' }),
  externalProductId: integer("external_product_id").notNull(),
  skuSnapshot: text("sku_snapshot"),
  nameSnapshot: text("name_snapshot"),
  quantityReceived: integer("quantity_received").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const receiptsRelations = relations(receipts, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [receipts.supplierId],
    references: [suppliers.id],
  }),
  purchaseOrder: one(purchaseOrders, {
    fields: [receipts.purchaseOrderId],
    references: [purchaseOrders.id],
  }),
  items: many(receiptItems),
}));

export const receiptItemsRelations = relations(receiptItems, ({ one }) => ({
  receipt: one(receipts, {
    fields: [receiptItems.receiptId],
    references: [receipts.id],
  }),
}));


