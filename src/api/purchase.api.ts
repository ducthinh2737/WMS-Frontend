import http from "./http";
import type {
  PurchaseOrderDto,
  GoodsReceiptDto,
  PurchaseQueryParams,
  GoodsReceiptCreateRequest,
  PurchaseOrderCreateRequest
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
  createGR: (payload: GoodsReceiptCreateRequest) => http.post(`${baseUrl}/gr`, payload),
  cancelGR: (id: string) => http.delete(`${baseUrl}/gr/${id}`)
};
