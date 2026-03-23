import http from "./http";
import type {
  WarehouseByIdDto,
  WarehouseCreateDto,
  WarehouseDto,
  WarehouseUpdateDto,
} from "../types/warehouse";

export interface WarehousesByTypeRequest {
  warehousetype: number;
}

export interface WarehouseSimpleDto {
  id: string;
  name: string;
}

export interface WarehousesByTypeResponse {
  result: {
    id: string;
    name: string;
    status: number;
    warehouseType: number;
  }[];
}

export const warehouseApi = {
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

  getById: (id: string) =>
    http.get<WarehouseDto>(`/Warehouses/${id}`),

  create: (dto: WarehouseCreateDto) =>
    http.post("/Warehouses", dto),

  getwarehouseid: (dto: WarehouseByIdDto) =>
    http.get("/Warehouses/warehousebyid", { params: dto }),

  getByWarehouseType: (dto: WarehousesByTypeRequest) =>
    http.post<WarehousesByTypeResponse>("/Warehouses/warehousebytype", dto),

  update: (id: string, data: WarehouseUpdateDto) =>
    http.put(`/Warehouses/${id}`, data),

  delete: (id: string) =>
    http.delete(`/Warehouses/${id}`),

  lock: (id: string, reason?: string) =>
    http.post(`/Warehouses/${id}/lock`, reason ? { reason } : {}),

  unlock: (id: string) =>
    http.post(`/Warehouses/${id}/unlock`),
};