export interface PurchaseOrderDto {
  id: string;
  code: string;
  supplierId: number;
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
  poId?: string;
}
// types/purchase.ts
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
  id: string;                 // backend: id
  productId: number;          // backend: productId
  productName?: string;

  quantity: number;           // backend: quantity
  received_Qty: number;       // backend: received_Qty

  status: number;             // backend: status
  createdAt?: string;
  updatedAt?: string;
}


export interface GoodsReceiptDto {
  id: string;
  Status: number;
  code: string;
  poIds: string;
  warehouseId: string;
  createdAt: string;
  updatedAt?: string;
  items: GoodsReceiptItemDto[];
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
