import { Drawer, List, Typography, Tag, Space, Button, Empty, Tooltip } from 'antd';
import { DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, SyncOutlined } from '@ant-design/icons';
import { useNotification, type InventoryChangeNotification } from '../hooks/useNotification';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  "1": "Nhập kho (Receive)",
  "2": "Xuất kho (Issue)",
  "3": "Điều chỉnh tăng",
  "4": "Điều chỉnh giảm",
  "5": "Chuyển kho (In)",
  "6": "Chuyển kho (Out)",
  "7": "Khóa tồn kho",
  "8": "Mở khóa tồn kho",
  "9": "Lấy hàng (Pick)",
  "10": "Chuyển chờ (Stage)",
  "11": "Kiểm kê",
  "Receive": "Nhập kho",
  "Issue": "Xuất kho",
  "AdjustIncrease": "Điều chỉnh tăng",
  "AdjustDecrease": "Điều chỉnh giảm",
  "TransferIn": "Chuyển kho (In)",
  "TransferOut": "Chuyển kho (Out)",
  "Lock": "Khóa tồn kho",
  "Unlock": "Mở khóa tồn kho",
  "Pick": "Lấy hàng (Pick)",
  "Stage": "Chuyển chờ (Stage)",
  "StockTakeAdjustment": "Kiểm kê",
  "onHandQuantity": "Thực tồn",
  "lockedQuantity": "Đã khóa",
  "availableQuantity": "Khả dụng",
};

const FIELD_COLORS: Record<string, string> = {
  "1": "green",
  "2": "volcano",
  "3": "green",
  "4": "volcano",
  "5": "blue",
  "6": "orange",
  "7": "orange",
  "8": "blue",
  "9": "cyan",
  "10": "purple",
  "11": "magenta",
  "onHandQuantity": "blue",
  "lockedQuantity": "orange",
  "availableQuantity": "green",
};

// Helper format thời gian tương đối
function getRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} ngày trước`;
}

export default function NotificationSidebar({ open, onClose }: Props) {
  const { notifications, markAllAsRead, clearAll, startPolling, stopPolling, fetchHistory, isPolling } = useNotification();
  const navigate = useNavigate();

  // Khởi động polling khi Component mount
  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, []);

  return (
    <Drawer
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Space>
            <span>🔔 Thay đổi tồn kho</span>
            {isPolling && <SyncOutlined spin style={{ color: "#1677ff", fontSize: 14 }} />}
          </Space>
          <Space>
            <Button
              size="small"
              type="link"
              onClick={() => {
                onClose();
                navigate('/inventory');
              }}
            >
              Xem tồn kho →
            </Button>
            <Tooltip title="Xóa tất cả">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={clearAll}
                disabled={notifications.length === 0}
              />
            </Tooltip>
          </Space>
        </div>
      }
      open={open}
      onClose={onClose}
      afterOpenChange={(isOpen) => {
        if (isOpen) markAllAsRead();
      }}
      width={420}
      styles={{ body: { padding: 0 } }}
    >
      {notifications.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Empty description="Chưa có thay đổi nào được ghi nhận" />
        </div>
      ) : (
        <List
          dataSource={notifications}
          renderItem={(c: InventoryChangeNotification) => {
            const isIncrease = c.delta > 0;
            const deltaAbs = Math.abs(c.delta);

            return (
              <List.Item
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #f0f0f0",
                  background: c.isRead ? "#fff" : "#f6ffed",
                  transition: "background 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  if (c.isRead) e.currentTarget.style.background = "#fafafa";
                }}
                onMouseLeave={(e) => {
                  if (c.isRead) e.currentTarget.style.background = "#fff";
                }}
                onClick={() => {
                  onClose();
                  // Điều hướng tới trang tồn kho với bộ lọc tương ứng
                  navigate(`/inventory?warehouseId=${c.warehouseId}&locationId=${c.locationId}`);
                }}
              >
                <div style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text strong style={{ fontSize: 13 }}>{c.productName}</Text>
                    <Tag
                      color={isIncrease ? "success" : "error"}
                      icon={isIncrease ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                      style={{ fontSize: 13, fontWeight: 700, margin: 0 }}
                    >
                      {isIncrease ? "+" : "-"}{deltaAbs.toLocaleString()}
                    </Tag>
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      SKU: {c.productCode} &nbsp;|&nbsp; Lot:{" "}
                      <Tag color="cyan" style={{ margin: 0, fontSize: 11, padding: "0 4px" }}>
                        {c.lotCode || 'N/A'}
                      </Tag>
                    </Text>
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <Tag color="blue" style={{ fontSize: 11 }}>{c.locationCode}</Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>{c.warehouseName}</Text>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Space size={4}>
                      <Tag color={FIELD_COLORS[c.field] || 'default'} style={{ fontSize: 11, margin: 0 }}>
                        {FIELD_LABELS[c.field] || `Hành động: ${c.field}`}
                      </Tag>
                      <Text style={{ fontSize: 12 }}>
                        <Text delete type="secondary">{c.oldValue.toLocaleString()}</Text>
                        {" → "}
                        <Text strong>{c.newValue.toLocaleString()}</Text>
                      </Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 11 }} title={new Date(c.changedAt).toLocaleString('vi-VN')}>
                      {getRelativeTime(c.changedAt)}
                    </Text>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </Drawer>
  );
}
