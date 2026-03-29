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
  // ── PO ──────────────────────────────────────────────────────────
  getPO:    (id: string) => http.get<PurchaseOrderDto>(`${baseUrl}/po/${id}`),
  getPOM0:  (id: string) => http.get<PurchaseOrderDto>(`${baseUrl}/pom0/${id}`),
  getPOs:   (params?: PurchaseQueryParams) => http.get<PurchaseOrderDto[]>(`${baseUrl}/po`, { params }),
  createPOs:(payload: PurchaseOrderCreateRequest) => http.post(`${baseUrl}/po`, payload),
  createPO: (payload: PurchaseOrderDto) => http.post(`${baseUrl}/po`, payload),
  approvePO:(id: string) => http.post(`${baseUrl}/po/${id}/approve`),
  rejectPO: (id: string) => http.post(`${baseUrl}/po/${id}/reject`),

  // ── GR ──────────────────────────────────────────────────────────
  getGR:   (id: string) => http.get<GoodsReceiptDto>(`${baseUrl}/gr/${id}`),
  getGRs:  (params?: PurchaseQueryParams) => http.get<GoodsReceiptDto[]>(`${baseUrl}/gr`, { params }),
  getGRsByType: (params: GRByTypeParams) => http.get<GoodsReceiptDto[]>(`${baseUrl}/grbytype`, { params }),
  cancelGR:(id: string) => http.delete(`${baseUrl}/gr/${id}`),
  createGR:(payload: ProductionGRCreateRequest) => http.post<GoodsReceiptDto>(`${baseUrl}/gr`, payload),

  // ── Receive ──────────────────────────────────────────────────────
  ReceiveItem: (payload: ReceiveItemRequest) => http.post(`${baseUrl}/receive-item`, payload),

  // ── Production GR ────────────────────────────────────────────────
  approveProductionGR:  (payload: GoodsReceiptDto) => http.post<GoodsReceiptDto>(`${baseUrl}/gr-production-approve`, payload),
  countingProductionGR: (payload: GoodsReceiptDto) => http.post<GoodsReceiptDto>(`${baseUrl}/gr-production-counting`, payload),

  // ── Scan & Receive ───────────────────────────────────────────────
  // FIX: bỏ /purchase/ thừa — baseUrl đã là "/purchase"

  // Đọc thông tin PO (không thay đổi DB)
  scanPOInfo: (poCode: string) =>
    http.get(`${baseUrl}/scan/${encodeURIComponent(poCode)}`),

  // Scan QR JSON → tạo PO mới + Approve + tạo GR trong 1 call
  scanAndProcess: (payload: {
    supplierId: number;
    items: Array<{ productId: number; warehouseId: string; quantity: number; price: number }>;
  }) =>
    http.post(`${baseUrl}/scan-and-process`, payload),

  // Scan mã PO đã tồn tại → Approve (nếu cần) + lấy GR
  confirmScanReceive: (poCode: string) =>
    http.post(`${baseUrl}/scan/${encodeURIComponent(poCode)}/confirm`),
};