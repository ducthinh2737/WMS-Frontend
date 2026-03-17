import http from "./http";
import type {
  PurchaseOrderDto,
  GoodsReceiptDto,
  PurchaseQueryParams,
  GoodsReceiptCreateRequest,
  PurchaseOrderCreateRequest,
  ProductionGRCreateRequest,
  GoodsReceiptItemDto,
  GRByTypeParams,
  ReceiveItemRequest,
} from "../types/purchase";

const baseUrl = "/purchase";

export const purchaseApi = {
  // PO
  getPO: (id: string) => http.get<PurchaseOrderDto>(`${baseUrl}/po/${id}`),
  getPOM0: (id: string) => http.get<PurchaseOrderDto>(`${baseUrl}/pom0/${id}`),
  getPOs: (params?: PurchaseQueryParams) => http.get<PurchaseOrderDto[]>(`${baseUrl}/po`, { params }),
  createPOs: (payload: PurchaseOrderCreateRequest) => http.post(`${baseUrl}/po`, payload),
  createPO: (payload: PurchaseOrderDto) => http.post(`${baseUrl}/po`, payload),
  approvePO: (id: string) => http.post(`${baseUrl}/po/${id}/approve`),
  rejectPO: (id: string) => http.post(`${baseUrl}/po/${id}/reject`),

  // GR
  getGR: (id: string) => http.get<GoodsReceiptDto>(`${baseUrl}/gr/${id}`),
  getGRs: (params?: PurchaseQueryParams) => http.get<GoodsReceiptDto[]>(`${baseUrl}/gr`, { params }),
  
  // ✅ NEW: Get GR by type
  getGRsByType: (params: GRByTypeParams) => 
    http.get<GoodsReceiptDto[]>(`${baseUrl}/grbytype`, { params }),
  
  cancelGR: (id: string) => http.delete(`${baseUrl}/gr/${id}`),
  ReceiveItem: (payload: ReceiveItemRequest) => http.post(`${baseUrl}/receive-item`, payload),
  createGR: (payload: ProductionGRCreateRequest) =>
    http.post<GoodsReceiptDto>(`${baseUrl}/gr`, payload),

  // Production GR
  approveProductionGR: (payload: GoodsReceiptDto) =>
    http.post<GoodsReceiptDto>(`${baseUrl}/gr-production-approve`, payload),

  countingProductionGR: (payload: GoodsReceiptDto) =>
    http.post<GoodsReceiptDto>(`${baseUrl}/gr-production-counting`, payload),
};