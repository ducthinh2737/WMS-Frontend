import http from "./http";
import type { LocationCreateDto, LocationUpdateDto } from "../types/location";

export const locationApi = {
    list: (warehouseId: string) =>
        http.get(`/warehouses/${warehouseId}/locations`),

    getById: (warehouseId: string, id: string) =>
        http.get(`/warehouses/${warehouseId}/locations/${id}`),

    create: (warehouseId: string, dto: LocationCreateDto) =>
    http.post(`/warehouses/${warehouseId}/locations`, {
        ...dto,
        warehouseId,  // đảm bảo backend nhận đúng
    }),
listByType: (warehouseId: string, type: number) =>
  http.get(`/warehouses/${warehouseId}/locations`, {
    params: { type },
  }),


    update: (warehouseId: string, id: string, dto: LocationUpdateDto) =>
        http.put(`/warehouses/${warehouseId}/locations/${id}`, dto),

    delete: (warehouseId: string, id: string) =>
        http.delete(`/warehouses/${warehouseId}/locations/${id}`),
};
