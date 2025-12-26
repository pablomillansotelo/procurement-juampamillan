# Procurement Juampamillan (Compras)

Este repo será el módulo **Procurement** del ecosistema ERP modular.

## Propósito

Resolver el ciclo de compras end-to-end:

- requisición → aprobación → orden de compra → recepción → factura proveedor → pago

## Alcance (Core)

### Proveedores

- Alta, contactos, condiciones, cuentas bancarias (si aplica).

### Órdenes de compra (PO)

- Crear/editar PO
- Estados: draft → approved → sent → received → closed/cancelled
- Recepciones parciales

### Recepción

- Registro de recepción (qty, fecha, evidencias)
- Integra con Inventory (entradas al stock)

### Facturas proveedor (boundary con Finance)

Dos opciones de diseño:

1) Procurement crea `vendor_invoices` y Finance las toma para AP  
2) Finance es owner de facturas AP y Procurement solo referencia

## No incluye

- Ventas (Vendor)
- Usuarios/RBAC/auditoría/notificaciones (Permit)
- Tracking de embarques (Shipments) (salvo recepción logística)

## Integraciones (HTTP)

- Procurement → Inventory:
  - Registrar recepción y entrada de inventario
- Procurement → Finance:
  - Pasar facturas y programación de pagos (AP)
- Permit:
  - Aprobaciones (RBAC) + auditoría + notificaciones

## Roadmap / Backlog (alto nivel)

### Must (MVP)

- `procurement-backend`:
  - suppliers
  - purchase_orders
  - purchase_order_items
  - receipts
  - approval workflow básico (o delegar a Permit RBAC + estados)

### Should

- Recepción parcial y backorders
- Integración con Inventory para entradas reales

### Could

- Cotizaciones de proveedor (RFQ)
- Evaluación de proveedores y SLA


