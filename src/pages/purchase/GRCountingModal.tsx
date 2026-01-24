import {
  Modal,
  Table,
  InputNumber,
  message,
  Typography,
  Divider,
} from "antd";
import { useState } from "react";
import { purchaseApi } from "../../api/purchase.api";
import type {
  GoodsReceiptDto,
  GoodsReceiptItemDto,
} from "../../types/purchase";

const { Text } = Typography;

interface Props {
  open: boolean;
  gr: GoodsReceiptDto;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function GRCountingModal({
  open,
  gr,
  onCancel,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);

  /**
   * key: item.id
   * value: số lượng nhập thêm
   */
  const [newCounts, setNewCounts] = useState<Record<string, number>>({});

  const handleInputChange = (itemId: string, value: number | null) => {
    setNewCounts((prev) => ({
      ...prev,
      [itemId]: value ?? 0,
    }));
  };

  const submitCounting = async () => {
    const itemsToUpdate = gr.items.filter(
      (item) => newCounts[item.id] > 0
    );

    if (itemsToUpdate.length === 0) {
      return message.warning("Vui lòng nhập số lượng cho ít nhất 1 sản phẩm");
    }

    setLoading(true);
    try {
      for (const item of itemsToUpdate) {
        const payload: GoodsReceiptItemDto = {
          ...item,
          received_Qty: newCounts[item.id],
        };

        await purchaseApi.ReceiveItem(payload);
      }

      message.success("Nhập kho thành công!");
      onSuccess();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Lỗi cập nhật phiếu nhập"
      );
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Sản phẩm",
      render: (_: any, record: GoodsReceiptItemDto) =>
        record.productName || `ID: ${record.productId}`,
    },
    {
      title: "SL yêu cầu",
      dataIndex: "quantity",
      width: 120,
    },
    {
      title: "Đã nhận",
      dataIndex: "received_Qty",
      width: 120,
    },
    {
      title: "Nhập thêm",
      width: 160,
      render: (_: any, record: GoodsReceiptItemDto) => {
        const maxQty = record.quantity - record.received_Qty;

        return (
          <InputNumber
            min={0}
            max={maxQty}
            disabled={maxQty <= 0}
            style={{ width: "100%" }}
            placeholder="Số lượng"
            onChange={(val) =>
              handleInputChange(record.id, val)
            }
          />
        );
      },
    },
  ];

  return (
    <Modal
      title={`Kiểm đếm phiếu nhập: ${gr.code}`}
      open={open}
      onCancel={onCancel}
      onOk={submitCounting}
      confirmLoading={loading}
      width={850}
      okText="Xác nhận"
      cancelText="Đóng"
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>Mã PO: </Text>
        <Text>{gr.poIds}</Text>
        <br />
        <Text strong>Kho nhận: </Text>
        <Text>{gr.warehouseId}</Text>
      </div>

      <Divider orientation={"left" as any}>Danh sách sản phẩm</Divider>

      <Table
        dataSource={gr.items}
        columns={columns}
        rowKey="id"
        pagination={false}
        bordered
      />
    </Modal>
  );
}
