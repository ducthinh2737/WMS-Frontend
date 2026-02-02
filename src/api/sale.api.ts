import http from "./http";
import type { GoodsIssueItemDto, PickingRequestDto, IssueRequestDto } from "../types/sale";
import type { GoodsIssueDto } from "../pages/sales/SaleOrderList";

export const salesApi = {
  // QUERY
  query: (params?: any) => http.get("/salesorder", { params }),

  // GET BY ID
  get: (id: string) => http.get(`/salesorder/${id}`),

  // CREATE
  create: (payload: any) => http.post("/salesorder", payload),

  // APPROVE
  approve: (id: string) => http.post(`/salesorder/${id}/approve`),

  // REJECT
  reject: (id: string) => http.post(`/salesorder/${id}/reject`),
  queryGI: (params?: any) => http.get("/salesorder/goodsissues", { params }),
 createProductionGI: (payload: {
  warehouseId: string;
  items: { productId: number; quantity: number }[];
}) =>
  http.post("/salesorder/production", payload),

  // Approve GoodsIssue (Sale / Production)
  approveGI: (giId: string) =>
    http.post(`/salesorder/GI/${giId}/approve`),
  // ISSUE (NEW - match BE)
  issue: (payload: IssueRequestDto) =>
    http.post("/salesorder/issue", payload),
  getGoodsIssueDetail: (id: string) =>
    http.get(`/salesorder/goods-issue/${id}`),

  // Picking nhiều allocate trong 1 GoodsIssueItem
  picking: (payload: PickingRequestDto) =>
    http.post("/salesorder/picking", payload),


};
