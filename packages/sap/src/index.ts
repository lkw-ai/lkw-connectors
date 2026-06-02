/**
 * @lkw-connectors/sap — typed client for SAP S/4HANA OData v2 services
 * (Sales, Outbound Delivery, Shipment, Warehouse).
 *
 * Highlights:
 *   - Handles SAP's CSRF token dance automatically (GET → x-csrf-token → POST)
 *   - Decodes OData v2 response envelope (`d.results` / `d.__count`)
 *   - Builds $filter / $select / $expand / $orderby query strings
 *
 * Public surface:
 *   - SapClient                base
 *   - sap.salesOrders          API_SALES_ORDER_SRV
 *   - sap.outboundDeliveries   API_OUTBOUND_DELIVERY_SRV_0002
 *   - sap.shipments            API_SHIPMENT_SRV
 */
export { SapClient, type SapClientOptions } from './client.js';
export type { SalesOrder, OutboundDelivery, Shipment } from './types.js';
