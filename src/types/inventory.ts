// src/types/inventory.ts
export interface InventoryDto {
  id: string;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationCode: string;
  lotId: string;       // 🆕 Thêm mới
  lotCode: string;     // 🆕 Thêm mới
  expiryDate: string;  // 🆕 Thêm mới
  productId: number;
  productCode: string; 
  productName: string; 
  onHandQuantity: number;
  lockedQuantity: number;
  availableQuantity: number;
  inTransitQuantity?: number;
  locationType: number;
  createdAt: string;
  updatedAt?: string | null;
}
export const LocationType = {
  Receiving: 1,
  Storage: 2,
  Staging: 3,
  Shipping: 4
} as const;

export type LocationType = typeof LocationType[keyof typeof LocationType];

export interface LocationQtyDto {
  id: string;
  warehouseId: string;
  type: LocationType; // ⬅️ Dùng enum thay vì number
  code: string;
  availableQty: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}
export interface InventoryHistoryDto {
    id: string;
    warehouseId: string;
    warehouseName?: string;
    locationId: string;
    locationCode?: string;
    productId: number;
    productName?: string;
    productCode?: string;
    lotId?: string;
    lotCode?: string;
    quantityChange: number;
    beforeQty?: number;
    afterQty?: number;
    actionType: InventoryActionType | string;  // enum hoặc string
    referenceCode?: string;
    note?: string;
    createdAt: string;
}
// putaway.types.ts
export interface PutawayDto {
    productId: number;
    warehouseId: string;
    lotId: string;
    fromLocationId: string; // Receiving location
    toLocationId: string;   // Storage location
    qty: number;
}

// Optional: API response
export interface PutawayResponse {
    message: string;
    success: boolean;
}


// Query params
export interface InventoryQueryParams {
    warehouseId?: string;
    locationId?: string;
    productId?: number;
    productIds?: number[];           // hỗ trợ query nhiều sản phẩm
}

// Adjust request
export interface InventoryAdjustRequest {
    warehouseId: string;
    locationId: string;
    productId: number;
    qtyChange: number;
    actionType: InventoryActionType;  // enum, không string
    refCode?: string;
    note?: string;
}

// Lock/Unlock request
export interface InventoryLockRequest {
    warehouseId: string;
    locationId: string;
    productId: number;
    quantity: number;
    lock?: boolean;                   // true: lock, false: unlock
}

// Enum actionType
export const InventoryActionType = {
    Receive: 1,
    Issue: 2,
    AdjustIncrease: 3,
    AdjustDecrease: 4,
    TransferIn: 5,
    TransferOut: 6,
} as const;

export type InventoryActionType = typeof InventoryActionType[keyof typeof InventoryActionType];
