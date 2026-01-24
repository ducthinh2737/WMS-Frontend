import { Button, InputNumber, Space, Typography, message } from "antd";
import { useState } from "react";
import { inventoryApi } from "../../api/inventory.api";
import type { InventoryDto } from "../../types/inventory";

const { Text } = Typography;

export default function InventoryLockActions({
  record,
  onSuccess,
}: {
  record: InventoryDto;
  onSuccess: () => void;
}) {
  const [qty, setQty] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const doToggle = async (lock: boolean) => {
    if (!qty || qty <= 0) {
      message.warning("Vui lòng nhập số lượng hợp lệ");
      return;
    }
    if(qty > record.lockedQuantity)
        return message.warning("Số lượng mở khóa không thể lớn hơn số lượng đang khóa");

    setLoading(true);
    try {
      await inventoryApi.toggleLock({
        warehouseId: record.warehouseId,
        locationId: record.locationId,
        productId: record.productId,
        quantity: qty,
        lock,
      });
      message.success(lock ? "Đã khóa tồn kho" : "Đã mở khóa tồn kho");
      setQty(0);
      onSuccess();
    } catch {
      message.error("Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingLeft: 48 }}>
      <Space size="large" align="center">
        <Text>
          Khả dụng: <b>{record.availableQuantity}</b> | Đang khóa:{" "}
          <b>{record.lockedQuantity}</b>
        </Text>

        <InputNumber
          min={1}
          placeholder="Số lượng"
          value={qty}
          onChange={(v) => setQty(v ?? 0)}
        />

        <Button
          loading={loading}
          disabled={record.availableQuantity <= 0}
          onClick={() => doToggle(true)}
        >
          Lock
        </Button>

        <Button
          loading={loading}
          danger
          disabled={record.lockedQuantity <= 0}
          onClick={() => doToggle(false)}
        >
          Unlock
        </Button>
      </Space>
    </div>
  );
}
