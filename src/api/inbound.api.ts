import http from "./http";
import type {
  InboundOrderDto,
  GoodsReceiptDto,
  InboundQueryParams,
  GoodsReceiptCreateRequest,
  InboundOrderCreateRequest,
  ProductionGRCreateRequest,
  GoodsReceiptItemDto,
  GRByTypeParams,
  ReceiveItemRequest,
  ScanReceiveResultDto
} from "../types/inbound";

const baseUrl = "/inbound";

export const inboundApi = {
  // ── INBOUND ORDER ───────────────────────────────────────────────
  getOrder:    (id: string) => http.get<InboundOrderDto>(`${baseUrl}/order/${id}`),
  getOrders:   (params?: InboundQueryParams) => http.get<InboundOrderDto[]>(`${baseUrl}/order`, { params }),
  createOrder: (payload: InboundOrderCreateRequest) => http.post(`${baseUrl}/order`, payload),
  approveOrder:(id: string) => http.post(`${baseUrl}/order/${id}/approve`),
  rejectOrder: (id: string) => http.post(`${baseUrl}/order/${id}/reject`),

  // ── GR ──────────────────────────────────────────────────────────
  getGR:   (id: string) => http.get<GoodsReceiptDto>(`${baseUrl}/gr/${id}`),
  getGRs:  (params?: any) => http.get<GoodsReceiptDto[]>(`${baseUrl}/gr`, { params }),
  getGRsByType: (params: GRByTypeParams) => http.get<GoodsReceiptDto[]>(`${baseUrl}/grbytype`, { params }),
  cancelGR:(id: string) => http.delete(`${baseUrl}/gr/${id}`),
  createGR:(payload: ProductionGRCreateRequest) => http.post<GoodsReceiptDto>(`${baseUrl}/gr`, payload),
  updateGRStatus: (grId: string, status: number) =>
    http.patch(`${baseUrl}/gr/${grId}/status`, { status }),

  // ── Receive ──────────────────────────────────────────────────────
  ReceiveItem: (payload: ReceiveItemRequest) => http.post(`${baseUrl}/receive-item`, payload),

  // ── Production GR ────────────────────────────────────────────────
  approveProductionGR:  (payload: GoodsReceiptDto) => http.post<GoodsReceiptDto>(`${baseUrl}/gr-production-approve`, payload),
  countingProductionGR: (payload: GoodsReceiptDto) => http.post<GoodsReceiptDto>(`${baseUrl}/gr-production-counting`, payload),

  // ── Scan & Receive ───────────────────────────────────────────────
  scanOrderInfo: (orderCode: string) =>
    http.get<ScanReceiveResultDto>(`${baseUrl}/scan/${encodeURIComponent(orderCode)}`),

  scanAndProcess: (payload: any) =>
    http.post(`${baseUrl}/scan-and-process`, payload),

  confirmScanReceive: (orderCode: string) =>
    http.post(`${baseUrl}/scan/${encodeURIComponent(orderCode)}/confirm`),
};
