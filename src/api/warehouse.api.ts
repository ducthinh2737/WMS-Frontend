// src/api/warehouse.api.ts
import http from "./http";
import type { WarehouseByIdDto, WarehouseCreateDto, WarehouseDto } from "../types/warehouse";

export const warehouseApi = {
  // Đầy đủ tham số như backend hỗ trợ
  query: (
    page: number,
    pageSize: number,
    q?: string,
    sortBy: "name" | "createdAt" = "createdAt",
    asc: boolean = false
  ) =>
    http.get<{ items: WarehouseDto[]; total: number }>("/Warehouses", {
      params: { page, pageSize, q, sortBy, asc },
    }),

  getById: (id: string) => http.get<WarehouseDto>(`/Warehouses/${id}`),

  create: (dto: WarehouseCreateDto) => http.post("/Warehouses", dto),
getwarehouseid: (dto: WarehouseByIdDto) => 
    http.get("/Warehouses/warehousebyid", { params: dto }),
  // src/api/warehouse.api.ts → giữ nguyên thế này là đúng!
update: (id: string, data: any) => http.put(`/Warehouses/${id}`, data),
  delete: (id: string) => http.delete(`/Warehouses/${id}`),

  lock: (id: string, reason?: string) =>
    http.post(`/Warehouses/${id}/lock`, reason ? { reason } : {}),

  unlock: (id: string) => http.post(`/Warehouses/${id}/unlock`),
};