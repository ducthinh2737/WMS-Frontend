export interface GoodsIssueAllocateDto {
  id: string;
  goodsIssueItemId?: string;
  locationId: string;
  allocatedQty: number;
  pickedQty: number;
  status?: number;

  // chỉ để hiển thị
  locationCode?: string;
  locationName?: string;
}

// DTO dùng để request Picking hoặc Issue lên BE
export interface GoodsIssueItemDto {
  id: string;
  goodsIssueId: string;
  soId: string;
  productId: number;

  quantity: number;     // ✅ SỐ LƯỢNG ISSUE LẦN NÀY (INT > 0)
  issued_Qty: number;   // thường = quantity
  
  status?: number;
  createAt?: string;
  updateAt?: string;

  items: GoodsIssueAllocateDto[];
}
// DTO chỉ dùng cho Issue
export interface IssueRequestDto {
  goodsIssueItemId: string;          // GoodsIssueItemId
  issuedQty: number;  // số lượng xuất lần này
}


export interface GoodsIssueItemDtoForFrontend {
  id: string;
  productId: string;
  productCode: string;
  productName: string;

  quantity: number;    // tổng yêu cầu SO
  pickedQty: number;   // tổng đã pick
  issuedQty: number;   // tổng đã issue

  status: number;
  allocations: GoodsIssueAllocateDto[];

  salesOrderId: string;
  createAt?: string;
  updateAt?: string;
}

export interface PickingRequestDto {
  id: string;             // GoodsIssueItem ID
  goodsIssueId: string;
  productId: number;      // Chuyển thành number cho khớp int của C#
  items: Array<{
    id: string;           // GoodsIssueAllocate ID
    pickedQty: number;
    locationId: string;   // ✅ Thêm trường này
  }>;
}
// src/types/sale.ts

export interface GoodsIssueAllocateDto {
  id: string;               // ID của GoodsIssueAllocate
  allocatedQty: number;
  pickedQty: number;
  locationId: string;
  locationCode?: string;    // hiển thị cho người dùng
  locationName?: string;
  
}

export interface GoodsIssueItemDtoForFrontend {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  pickedQty: number;
  issuedQty: number;
  status: number;
  allocations: GoodsIssueAllocateDto[];
  // Thêm các trường backend cần
  salesOrderId: string;
  itemId: string;
}

export interface GoodsIssueDetailDto {
  id: string;
  code: string;
  salesOrderCode: string;
  shippingLocationId?: string | null;
  warehouseName: string;
  status: number;
  note?: string;
  items: GoodsIssueItemDtoForFrontend[];
}




// Dùng cho request Issue
export interface IssueRequestDto {
  goodsIssueItemId: string;                         // GoodsIssueItem Id
  issuedQty: number;
}