import http from "./http";
import type { GoodsIssueItemDto, PickingRequestDto, IssueRequestDto, OutboundOrderDto, OutboundOrderQueryDto, GoodsIssueDetailDto, GoodsIssueDto, GoodsIssueQuery1Dto, ProductionGoodsIssueCreateDto } from "../types/outbound";

const baseUrl = "/outbound";

export const outboundApi = {
  // ── OUTBOUND ORDER ──────────────────────────────────────────────
  getOrder:    (id: string) => http.get<OutboundOrderDto>(`${baseUrl}/order/${id}`),
  getOrders:   (params?: OutboundOrderQueryDto) => http.get<OutboundOrderDto[]>(`${baseUrl}/order`, { params }),
  createOrder: (payload: any) => http.post(`${baseUrl}/order`, payload),
  approveOrder:(id: string) => http.post(`${baseUrl}/order/${id}/approve`),
  rejectOrder: (id: string) => http.post(`${baseUrl}/order/${id}/reject`),

  // ── GOODS ISSUE ─────────────────────────────────────────────────
  getGoodsIssue: (id: string) => http.get<GoodsIssueDetailDto>(`${baseUrl}/goods-issue/${id}`),
  queryGoodsIssues: (params?: GoodsIssueQuery1Dto) => http.get<GoodsIssueDto[]>(`${baseUrl}/goods-issues`, { params }),
  updateGIStatus: (id: string, status: number) =>
    http.put(`${baseUrl}/goods-issue/${id}/status`, { status }),
  approveGI: (giId: string) =>
    http.post(`${baseUrl}/goods-issue/${giId}/approve`),
  
  // ── STOCK MOVEMENT ──────────────────────────────────────────────
  issue: (payload: IssueRequestDto) =>
    http.post(`${baseUrl}/issue`, payload),
  picking: (payload: PickingRequestDto) =>
    http.post(`${baseUrl}/picking`, payload),

  // ── PRODUCTION ──────────────────────────────────────────────────
  createProductionGI: (payload: ProductionGoodsIssueCreateDto) =>
    http.post(`${baseUrl}/production`, payload),

  // ── MASTER DATA ─────────────────────────────────────────────────
  getWarehouses: () => http.get(`${baseUrl}/warehouses`),
};
