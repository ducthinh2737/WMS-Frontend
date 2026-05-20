import { create } from 'zustand';
import { inventoryApi } from '../api/inventory.api';
import type { InventoryHistoryDto } from '../types/inventory';

export interface InventoryChangeNotification {
  id: string;
  productId: number;
  productName: string;
  productCode: string;
  locationId: string;
  locationCode: string;
  warehouseId: string;
  warehouseName: string;
  lotCode?: string;
  field: string;
  oldValue: number;
  newValue: number;
  delta: number;
  changedAt: string;
  isRead: boolean;
}

interface NotificationStore {
  notifications: InventoryChangeNotification[];
  unreadCount: number;
  isPolling: boolean;
  hasInitialLoad: boolean;
  clearedAt: Date | null;
  markAllAsRead: () => void;
  clearAll: () => void;
  fetchHistory: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

let pollingInterval: NodeJS.Timeout | null = null;

const mapToNotification = (dto: InventoryHistoryDto): InventoryChangeNotification => ({
  id: dto.id,
  productId: dto.productId,
  productName: dto.productName || 'Không xác định',
  productCode: dto.productCode || 'N/A',
  locationId: dto.locationId,
  locationCode: dto.locationCode || 'Không xác định',
  warehouseId: dto.warehouseId,
  warehouseName: dto.warehouseName || 'Không xác định',
  lotCode: dto.lotCode,
  field: dto.actionType.toString(), // Enum number or string
  oldValue: dto.beforeQty ?? 0,
  newValue: dto.afterQty ?? 0,
  delta: dto.quantityChange,
  changedAt: dto.createdAt.endsWith('Z') ? dto.createdAt : dto.createdAt + 'Z',
  isRead: false,
});

const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isPolling: false,
  hasInitialLoad: false,
  clearedAt: null,
  
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    unreadCount: 0,
  })),
  
  clearAll: () => set({ notifications: [], unreadCount: 0, clearedAt: new Date() }),
  
  fetchHistory: async () => {
    try {
      // Lấy 50 lịch sử gần nhất từ API
      const response = await inventoryApi.recentHistory(50);
      const data = response.data;
      
      set((state) => {
        let fetchedNotifs = data.map(mapToNotification);
        
        // Lọc bỏ những thông báo cũ đã bị xóa (chỉ lấy những gì xảy ra SAU thời điểm bấm Xóa Tất Cả)
        if (state.clearedAt) {
          fetchedNotifs = fetchedNotifs.filter(n => new Date(n.changedAt).getTime() > state.clearedAt!.getTime());
        }

        // Lần đầu tiên load -> đánh dấu đã đọc hết để không hiển thị số 50
        if (!state.hasInitialLoad) {
          return {
            notifications: fetchedNotifs.map(n => ({ ...n, isRead: true })),
            unreadCount: 0,
            hasInitialLoad: true
          };
        }
        
        // Các lần sau -> chỉ lấy những thông báo thực sự mới
        const existingIds = new Set(state.notifications.map(n => n.id));
        const newNotifs = fetchedNotifs.filter(n => !existingIds.has(n.id));
        
        if (newNotifs.length === 0) {
            return state;
        }

        // Chèn thông báo mới nhất lên đầu danh sách
        return {
          notifications: [...newNotifs, ...state.notifications],
          unreadCount: state.unreadCount + newNotifs.length,
        };
      });
    } catch (error) {
      console.error("Lỗi khi tải lịch sử tồn kho:", error);
    }
  },

  startPolling: () => {
    if (pollingInterval) return;
    
    // Fetch luôn lập tức khi bắt đầu
    get().fetchHistory();
    
    // Đặt lịch lấy data thực sau mỗi 3s (thời gian thực)
    pollingInterval = setInterval(() => {
      get().fetchHistory();
    }, 3000);
    
    set({ isPolling: true });
  },
  
  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
    set({ isPolling: false });
  }
}));

export function useNotification() {
  const store = useNotificationStore();
  
  const changesByInventoryId = new Map<string, InventoryChangeNotification[]>();

  for (const c of store.notifications) {
    const key = `${c.productId}-${c.locationCode}-${c.lotCode || 'N/A'}`;

    if (!changesByInventoryId.has(key)) {
      changesByInventoryId.set(key, []);
    }

    changesByInventoryId.get(key)!.push(c);
  }

  const changedIds = new Set<string>();

  const unread = store.notifications.filter(c => !c.isRead);

  for (const c of unread) {
    changedIds.add(`${c.productId}-${c.locationCode}-${c.lotCode || 'N/A'}`);
  }

  return {
    ...store,
    changesByInventoryId,
    changedIds,
  };
}
