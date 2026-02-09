export interface PurchaseOrderDto {
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

export interface PurchaseQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  receiptType?: 0 | 1;
  poId?: string;
}

// ✅ NEW: Params cho grbytype endpoint
export interface GRByTypeParams {
  receiptType: 0 | 1;
  poId?: string;
}

export interface PurchaseItemForm {
  productId: string;
  quantity: number;
}

export interface PurchaseOrderCreateRequest {
  supplierId: number;
  code: string;
  items: PurchaseItemForm[];
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
  purchaseOrderId?: string; // ✅ Changed from poIds
  warehouseId: string;
  receiptType: number;
  createdAt: string;
  updatedAt?: string;
  
  // ✅ NEW: Thêm nested objects từ backend
  purchaseOrder?: PurchaseOrderDto;
  
  items: GoodsReceiptItemDto[];
  productionReceiptItems?: ProductionReceiptItemDto[];
}

export interface GoodsReceiptCreateRequest {
  code: string;
  PurchaseOrderId: string;
  warehouseId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface ProductionReceiptItemDto {
  id: string;
  goodsReceiptId?: string;
  productId: number;
  quantity: number;
  receipt_Qty: number;
  status: number;
  lotCode: string;     // Mã lô
  expiryDate?: string; // Hạn dùng
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionGRCreateRequest {
  code: string;
  warehouseId: string;
  receiptType: number; // 1 = Production
  productionReceiptItems: {
    productId: number;
    quantity: number;
    lotCode?: string;      // Thêm trường này
    expiryDate?: string;   // Thêm trường này
  }[];
}