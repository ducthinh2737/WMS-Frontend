export interface StockTakeDto {
  id: string;
  code: string;
  warehouseId: string;
  warehouseName?: string;
  status: 'Draft' | 'InProgress' | 'Completed' | 'Cancelled';
  description?: string;
  createdAt: string;
  completedAt?: string;
  items: StockTakeItemDto[];
}

export interface StockTakeItemDto {
  id: string;
  locationId: string;
  locationCode?: string;
  productId: number;
  productName?: string;
  sku?: string;
  lotId?: string;
  lotCode?: string;
  systemQty: number;   // Số lượng sổ sách (snapshot)
  countedQty: number;  // Số lượng thực tế nhân viên nhập
  difference: number;  // Chênh lệch (tự tính ở BE)
  note?: string;
}

export interface CreateStockTakeDto {
  warehouseId: string;
  description?: string;
}

export interface SubmitCountDto {
  stockTakeId: string;
  counts: ItemCountDto[];
}

export interface ItemCountDto {
  locationId: string;
  productId: number;
  lotId?: string;
  countedQty: number;
  note?: string;
}