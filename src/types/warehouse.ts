// src/types/warehouse.ts

export type WarehouseStatus =
  | "Active"
  | "Inactive"
  | "Locked"
  | "Maintenance";

export interface WarehouseDto {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  status: WarehouseStatus;
  createdAt: string;
  updatedAt?: string | null;
  locationCount?: number;
}
export interface WarehouseByIdDto {
  ProductId: number;
}
export interface WarehouseCreateDto {
  code: string;
  name: string;
  address?: string | null;
}

export interface WarehouseUpdateDto {
  code?: string | null;
  name: string;
  address?: string | null;
  status?: WarehouseStatus;
}