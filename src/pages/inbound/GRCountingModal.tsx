import {
  Modal,
  Table,
  InputNumber,
  message,
  Typography,
  Divider,
  DatePicker,
  notification,
  Button,
} from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import { inboundApi } from "../../api/inbound.api";
import LocationCreateModal from "../location/LocationCreate";

import type {
  GoodsReceiptDto,
  GoodsReceiptItemDto,
  ReceiveItemRequest,
} from "../../types/inbound";

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
  const [openLocationModal, setOpenLocationModal] = useState(false);

  const [newCounts, setNewCounts] = useState<Record<string, number>>({});
  const [lotData, setLotData] = useState<
    Record<string, { expiryDate?: string; manufacturingDate?: string }>
  >({});

  // ===============================
  // HANDLERS
  // ===============================

  const handleInputChange = (itemId: string, value: number | null) => {
    setNewCounts((prev) => ({
      ...prev,
      [itemId]: value ?? 0,
    }));
  };

  const handleLotChange = (
    itemId: string,
    field: "expiryDate" | "manufacturingDate",
    value: any
  ) => {
    setLotData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  // ===============================
  // CORE RECEIVE FUNCTION
  // ===============================

  const processReceiving = async () => {
    const itemsToUpdate = gr.items.filter((item) => newCounts[item.id] > 0);

    if (itemsToUpdate.length === 0) {
      return message.warning("Vui lòng nhập số lượng cho ít nhất 1 sản phẩm");
    }

    for (const item of itemsToUpdate) {
      const lot = lotData[item.id];

      const payload: ReceiveItemRequest = {
        id: item.id,
        productId: item.productId,
        received_Qty: newCounts[item.id],
        lotCode: "",  // sinh tự động ở backend
        expiryDate: lot?.expiryDate,
        manufacturingDate: lot?.manufacturingDate,
      };

      await inboundApi.ReceiveItem(payload);
    }
  };

  // ===============================
  // SUBMIT
  // ===============================

  const submitCounting = async () => {
    setLoading(true);

    try {
      await processReceiving();
      message.success("Nhập kho thành công!");
      onSuccess();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err.message;

      if (errorMessage?.includes("Receiving location not configured")) {
        notification.error({
          message: "Chưa cấu hình vị trí tiếp nhận",
          description: (
            <>
              <div style={{ marginBottom: 12 }}>
                Kho này chưa có vị trí Receiving.
              </div>
              <Button
                type="primary"
                onClick={() => setOpenLocationModal(true)}
              >
                Tạo vị trí tiếp nhận
              </Button>
            </>
          ),
          duration: 6,
          key: "receiving-location-error",
        });
      } else {
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // TABLE COLUMNS
  // ===============================

  const columns = [
    {
      title: "Sản phẩm",
      render: (_: any, record: any) => (
        <div>
          <div>{record.productName || `ID: ${record.productId}`}</div>
          {record.unitName && (
            <span style={{ fontSize: "12px", color: "#8c8c8c" }}>ĐVT: {record.unitName}</span>
          )}
        </div>
      ),
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
      width: 140,
      render: (_: any, record: GoodsReceiptItemDto) => {
        const maxQty = record.quantity - record.received_Qty;
        return (
          <InputNumber
            min={0}
            max={maxQty}
            disabled={maxQty <= 0}
            style={{ width: "100%" }}
            placeholder="Số lượng"
            onChange={(val) => handleInputChange(record.id, val)}
          />
        );
      },
    },
    {
      title: "Ngày sản xuất",
      width: 180,
      render: (_: any, record: GoodsReceiptItemDto) => (
        <DatePicker
          style={{ width: "100%" }}
          onChange={(date) =>
            handleLotChange(
              record.id,
              "manufacturingDate",
              date ? dayjs(date).toISOString() : undefined
            )
          }
        />
      ),
    },
    {
      title: "Hạn sử dụng",
      width: 180,
      render: (_: any, record: GoodsReceiptItemDto) => (
        <DatePicker
          style={{ width: "100%" }}
          onChange={(date) =>
            handleLotChange(
              record.id,
              "expiryDate",
              date ? dayjs(date).toISOString() : undefined
            )
          }
        />
      ),
    },
  ];

  // ===============================
  // RENDER
  // ===============================

  return (
    <>
      <Modal
        title={`Kiểm hàng phiếu nhập: ${gr.code}`}
        open={open}
        onCancel={onCancel}
        onOk={submitCounting}
        confirmLoading={loading}
        width={1000}
        okText="Xác nhận"
        cancelText="Đóng"
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Mã PO: </Text>
          <Text>{gr.inboundOrderId}</Text>
          <br />
          <Text strong>Kho nhận: </Text>
          <Text>{gr.warehouseId}</Text>
        </div>

        <Divider orientation={"left" as any}>Danh sách sản phẩm kiểm hàng</Divider>

        <Table
          dataSource={gr.items}
          columns={columns}
          rowKey="id"
          pagination={false}
          bordered
        />
      </Modal>

      {/* LOCATION MODAL */}
      <LocationCreateModal
        open={openLocationModal}
        warehouseId={gr.warehouseId}
        onCancel={() => setOpenLocationModal(false)}
        onSuccess={async () => {
          setOpenLocationModal(false);
          message.success("Đã tạo vị trí. Đang thử nhập lại...");

          try {
            setLoading(true);
            await processReceiving();
            message.success("Nhập kho thành công!");
            onSuccess();
          } catch (err: any) {
            message.error(err?.response?.data?.message || "Vui lòng thử lại");
          } finally {
            setLoading(false);
          }
        }}
      />
    </>
  );
}
