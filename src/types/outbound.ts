export interface GoodsIssueAllocateDto {
  id: string;
  goodsIssueItemId?: string;
  locationId: string;
  allocatedQty: number;
  pickedQty: number;
  status?: number;
  locationCode?: string;
  locationName?: string;
  lotId?: string;
}

export interface GoodsIssueItemDto {
  id: string;
  goodsIssueId: string;
  outboundOrderId: string;
  productId: number;
  quantity: number;
  issued_Qty: number;
  status?: number;
  createAt?: string;
  updateAt?: string;
  items: GoodsIssueAllocateDto[];
}

export interface IssueRequestDto {
  goodsIssueItemId: string;
  issuedQty: number;
}

export interface PickingRequestDto {
  id: string;
  goodsIssueId: string;
  productId: number;
  allocations: Array<{
    id: string;
    pickedQty: number;
    locationId: string;
  }>;
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
  outboundOrderId: string;
  itemId: string;
  createAt?: string;
  updateAt?: string;
}

export interface GoodsIssueDetailDto {
  id: string;
  code: string;
  outboundOrderCode: string;
  shippingLocationId?: string | null;
  warehouseName: string;
  status: number;
  note?: string;
  items: GoodsIssueItemDtoForFrontend[];
}

export interface OutboundOrderDto {
  id: string;
  code: string;
  customerId: string;
  status: number;
  createdAt: string;
  updatedAt?: string;
  items: OutboundOrderItemDto[];
}

export interface OutboundOrderItemDto {
  id: string;
  productId: number;
  quantity: number;
  price: number;
}

export interface OutboundOrderQueryDto {
  page?: number;
  pageSize?: number;
  status?: number;
  customerId?: string;
}

export interface GoodsIssueDto {
  id: string;
  code: string;
  outboundOrderId: string;
  warehouseId: string;
  status: number;
  createAt: string;
}

export interface GoodsIssueQuery1Dto {
  page?: number;
  pageSize?: number;
  status?: number;
}

export interface ProductionGoodsIssueCreateDto {
  warehouseId: string;
  items: { productId: number; quantity: number }[];
}
