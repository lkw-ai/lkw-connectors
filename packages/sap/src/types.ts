/**
 * SAP S/4HANA OData v2 entity subsets — names mirror the standard
 * `API_*_SRV` services. Fields are intentionally permissive because
 * customer extensions (`YY1_*` namespace) vary.
 */

export interface SalesOrder {
  SalesOrder: string;
  SalesOrderType: string;
  SoldToParty: string;
  CreationDate: string;
  RequestedDeliveryDate: string;
  OverallSDProcessStatus?: string;
  TotalNetAmount: string;
  TransactionCurrency: string;
  Items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  SalesOrder: string;
  SalesOrderItem: string;
  Material: string;
  MaterialByCustomer?: string;
  RequestedQuantity: string;
  RequestedQuantityUnit: string;
  NetAmount: string;
  TransactionCurrency: string;
}

export interface OutboundDelivery {
  DeliveryDocument: string;
  DeliveryDocumentType: string;
  ShipToParty: string;
  ActualGoodsMovementDate?: string;
  GrossWeight?: string;
  NetWeight?: string;
  WeightUnit?: string;
  OverallDeliveryStatus?: string;
}

export interface Shipment {
  Shipment: string;
  ShipmentType: string;
  MeansOfTransport?: string;
  OverallStatus?: string;
  PlannedShipmentStartDateTime?: string;
  PlannedShipmentEndDateTime?: string;
  TotalDistance?: string;
}

export interface ODataResponse<T> {
  d: {
    results: T[];
    __count?: string;
    __next?: string;
  };
}

export interface ODataSingleResponse<T> {
  d: T;
}

export interface ODataQuery {
  $filter?: string;
  $select?: string;
  $expand?: string;
  $orderby?: string;
  $top?: number;
  $skip?: number;
  $inlinecount?: 'allpages' | 'none';
}
