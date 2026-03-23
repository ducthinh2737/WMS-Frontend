export type WarehouseStatus =
  | "Active"
  | "Inactive"
  | "Locked"
  | "Maintenance";

export type WarehouseType = 0 | 1 | 2 | 3;

export const WarehouseTypeLabel: Record<WarehouseType, string> = {
  0: "Kho nguyên vật liệu",
  1: "Kho thành phẩm",
  2: "Kho phụ liệu",
  3: "Kho hóa chất",
};

export interface WarehouseDto {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  status: WarehouseStatus;
  warehouseType: WarehouseType;
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