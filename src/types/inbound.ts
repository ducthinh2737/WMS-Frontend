export interface InboundOrderDto {
  id: string;
  code: string;
  supplierId: number;
  supplier?: {
    id: number;
    code: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: {
    productId: string;
    quantity: number;
    status: number;
    receivedQuantity: number;
    locationId: string;
    price?: number;
  }[];
  status?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InboundQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  receiptType?: 0 | 1;
  orderId?: string;
}

export interface GRByTypeParams {
  receiptType: 0 | 1;
  orderId?: string;
}

export interface InboundItemForm {
  productId: string;
  quantity: number;
  unitId?: number;
  price?: number;
}

export interface InboundOrderCreateRequest {
  supplierId: number;
  code: string;
  items: InboundItemForm[];
}

export interface GoodsReceiptItemDto {
  id: string;
  productId: number;
  productName?: string;
  quantity: number;
  received_Qty: number;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoodsReceiptDto {
  id: string;
  status: number;
  code: string;
  inboundOrderId?: string;
  warehouseId: string;
  receiptType: number;
  createdAt: string;
  updatedAt?: string;
  inboundOrder?: InboundOrderDto;
  items: GoodsReceiptItemDto[];
  productionReceiptItems?: ProductionReceiptItemDto[];
}

export interface GoodsReceiptCreateRequest {
  code: string;
  inboundOrderId: string;
  warehouseId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface ReceiveItemRequest {
  id: string;
  productId: number;
  received_Qty: number;
  lotCode: string;
  expiryDate?: string;
  manufacturingDate?: string;
}

export interface ProductionReceiptItemDto {
  id: string;
  goodsReceiptId?: string;
  productId: number;
  quantity: number;
  receipt_Qty: number;
  status: number;
  unitId?: number;
  unitName?: string;
  lotCode?: string;
  expiryDate?: string;
  manufacturingDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionGRCreateRequest {
  code: string;
  warehouseId: string;
  receiptType: number;
  productionReceiptItems: {
    productId: number;
    quantity: number;
    lotCode?: string;
    expiryDate?: string;
    manufacturingDate?: string;
  }[];
}

export interface ScanReceiveResultDto {
  inboundOrder: InboundOrderDto;
  goodsReceipts: GoodsReceiptDto[];
  needsApproval: boolean;
}
