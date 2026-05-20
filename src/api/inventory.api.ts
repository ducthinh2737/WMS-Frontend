import http from "./http";
import type {
  InventoryDto,
  InventoryHistoryDto,
  InventoryQueryParams,
  InventoryAdjustRequest,
  InventoryLockRequest,
  PutawayDto,
  PutawayResponse,
  LocationQtyDto,
} from "../types/inventory";

const baseUrl = "/inventory"; // ⬅️ KHỚP controller: api/inventories

export const inventoryApi = {
  /* ===== INVENTORY BASIC ===== */
  get: (id: string) =>
    http.get<InventoryDto>(`${baseUrl}/${id}`),

  query: (params: InventoryQueryParams) =>
    http.get<InventoryDto[]>(baseUrl, { params }),

  history: (productId: number) =>
    http.get<InventoryHistoryDto[]>(
      `${baseUrl}/product/${productId}/history`
    ),

  recentHistory: (limit?: number) =>
    http.get<InventoryHistoryDto[]>(
      `${baseUrl}/history/recent`,
      { params: { limit } }
    ),

  adjust: (payload: InventoryAdjustRequest) =>
    http.post(`${baseUrl}/adjust`, payload),

  /* ===== LOCK / UNLOCK ===== */
  toggleLock: (payload: InventoryLockRequest) =>
    http.post(`${baseUrl}/lock-toggle`, payload),

  /* ===== PUTAWAY ===== */
  putaway: (payload: PutawayDto) =>
    http.post<PutawayResponse>(`${baseUrl}/putaway`, payload),

  /* ===== SALE ORDER – INVENTORY THEO KHO ===== */
  getByProductType: (productType: number) =>
    http.post<InventoryDto[]>(
      `${baseUrl}/by-product-type`,
      { productType }
    ),

  /* ===== PICKING – INVENTORY THEO LOCATION ===== */
  getAvailableLocations: (productId: number, warehouseId: string) =>
    http.get<LocationQtyDto[]>(
      `${baseUrl}/available-locations`,
      {
        params: {
          productId,
          warehouseId,
        },
      }
    ),
};
