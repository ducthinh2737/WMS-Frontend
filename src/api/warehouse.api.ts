// src/api/warehouse.api.ts
import http from "./http";
import type {
  WarehouseByIdDto,
  WarehouseCreateDto,
  WarehouseDto,
} from "../types/warehouse";

/**
 * Request DTO: map đúng BE
 */
export interface WarehousesByTypeRequest {
  warehousetype: number; // enum WarehouseType (BE)
}

/**
 * DTO dùng cho Select
 */
export interface WarehouseSimpleDto {
  id: string;
  name: string;
}

/**
 * Response chuẩn BE
 */
export interface WarehousesByTypeResponse {
  result: {
    id: string;
    name: string;
    status: number;
    warehouseType: number;
  }[];
}

export const warehouseApi = {
  // =======================
  // Query danh sách kho
  // =======================
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

  // =======================
  // Get warehouse by id
  // =======================
  getById: (id: string) =>
    http.get<WarehouseDto>(`/Warehouses/${id}`),

  // =======================
  // Create warehouse
  // =======================
  create: (dto: WarehouseCreateDto) =>
    http.post("/Warehouses", dto),

  // =======================
  // Get warehouse by id (custom)
  // =======================
  getwarehouseid: (dto: WarehouseByIdDto) =>
    http.get("/Warehouses/warehousebyid", { params: dto }),

  // =======================
  // ✅ Get warehouses by type (FIX)
  // =======================
  getByWarehouseType: (dto: WarehousesByTypeRequest) =>
    http.post<WarehousesByTypeResponse>(
      "/Warehouses/warehousebytype",
      dto
    ),

  // =======================
  // Update
  // =======================
  update: (id: string, data: any) =>
    http.put(`/Warehouses/${id}`, data),

  // =======================
  // Delete
  // =======================
  delete: (id: string) =>
    http.delete(`/Warehouses/${id}`),

  // =======================
  // Lock / Unlock
  // =======================
  lock: (id: string, reason?: string) =>
    http.post(`/Warehouses/${id}/lock`, reason ? { reason } : {}),

  unlock: (id: string) =>
    http.post(`/Warehouses/${id}/unlock`),
};
