// src/types/warehouse.ts

export type WarehouseStatus =
  | "Active"
  | "Inactive"
  | "Locked"
  | "Maintenance";
export type WarehouseType =
  | "RawMaterial"
  | "FinishedGoods"
  | "Auxiliary"
  | "Chemical";

  export interface WarehouseDto {
    id: string;
    code: string;
    name: string;
    address?: string | null;
    status: WarehouseStatus;
    warehouseType: WarehouseType; // ✅ THÊM DÒNG NÀY

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
  warehouseType: WarehouseType;
}

export interface WarehouseUpdateDto {
  code?: string | null;
  name?: string | null;
  address?: string | null;
  status?: WarehouseStatus;
  warehouseType?: WarehouseType;
}
