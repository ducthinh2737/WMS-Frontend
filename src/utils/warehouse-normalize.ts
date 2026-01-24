import type { WarehouseStatus, WarehouseType } from "../types/warehouse";

export const normalizeWarehouseType = (
  type: any
): WarehouseType | undefined => {
  switch (type) {
    case 0:
    case "RawMaterial":
      return "RawMaterial";
    case 1:
    case "FinishedGoods":
      return "FinishedGoods";
    case 2  :
    case "Auxiliary":
      return "Auxiliary";
    case 3:
    case "Chemical":
      return "Chemical";
    default:
      return undefined;
  }
};

export const normalizeWarehouseStatus = (
  status: any
): WarehouseStatus | undefined => {
  switch (status) {
    case 1:
    case "Active":
      return "Active";
    case 2:
    case "Locked":
      return "Locked";
    case 3:
    case "Maintenance":
      return "Maintenance";
    case 0:
    case "Inactive":
      return "Inactive";
    default:
      return undefined;
  }
};
