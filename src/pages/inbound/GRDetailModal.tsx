import { Modal, Table, Tag, Descriptions } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { GoodsReceiptDto, ProductionReceiptItemDto } from "../../types/inbound";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { unitApi } from "../../api/unit.api";

interface Props {
  open: boolean;
  onCancel: () => void;
  gr?: GoodsReceiptDto | null;
}

const STATUS_MAPPING: Record<number, { label: string; color: string }> = {
  0: { label: "Chờ xử lý", color: "orange" },
  1: { label: "Đã duyệt", color: "blue" },
  2: { label: "Nhận một phần", color: "cyan" },
  3: { label: "Hoàn thành", color: "green" },
  4: { label: "Từ chối", color: "red" },
  5: { label: "Hết hàng", color: "volcano" },
  6: { label: "Không đủ hàng", color: "gold" },
};

const ITEM_STATUS_MAPPING: Record<number, { text: string; color: string }> = {
  0: { text: "Chờ xử lý", color: "orange" },
  1: { text: "Đã duyệt", color: "blue" },
  2: { text: "Một phần", color: "cyan" },
  3: { text: "Hoàn thành", color: "green" },
  4: { text: "Từ chối", color: "red" },
};

export default function GRDetailModal({ open, onCancel, gr }: Props) {
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      unitApi.getAll().then(res => setUnits(res.data || []));
    }
  }, [open]);

  if (!gr) return null;

  const statusInfo = STATUS_MAPPING[gr.status] || { label: "Không xác định", color: "default" };

  const columns: ColumnsType<ProductionReceiptItemDto> = [
    {
      title: "Mã SP",
      dataIndex: "productId",
      key: "productId",
      render: (id: number) => <strong>{id}</strong>
    },

    {
      title: "ĐVT",
      dataIndex: "unitName",
      key: "unitName",
      render: (u?: string, record?: any) => {
        const name = u || units.find(x => x.id === record?.unitId)?.name || record?.unitId || "N/A";
        return <Tag color="default">{name}</Tag>;
      }
    },
    {
      title: "Số lượng yêu cầu",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
    },
    {
      title: "Đã nhận",
      dataIndex: "receipt_Qty",
      key: "receipt_Qty",
      align: "right",
      render: (qty: number, record: ProductionReceiptItemDto) => {
        const color = qty >= record.quantity ? "green" : (qty > 0 ? "orange" : "red");
        return <strong style={{ color }}>{qty}</strong>;
      }
    },
    {
      title: "NSX",
      dataIndex: "manufacturingDate",
      key: "mfg",
      render: (d?: string) => d ? dayjs(d).format("DD/MM/YYYY") : "-"
    },
    {
      title: "HSD",
      dataIndex: "expiryDate",
      key: "exp",
      render: (d?: string) => d ? dayjs(d).format("DD/MM/YYYY") : "-"
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (statusNum: number) => {
        const itemStatus = ITEM_STATUS_MAPPING[statusNum] || { text: `Mã ${statusNum}`, color: "default" };
        return <Tag color={itemStatus.color}>{itemStatus.text}</Tag>;
      }
    },
  ];

  const items = gr.productionReceiptItems || [];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
      title={`Chi tiết phiếu nhập - ${gr.code}`}
      centered
      destroyOnHidden
    >
      <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Mã phiếu">
          <strong style={{ color: '#1890ff' }}>{gr.code}</strong>
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={statusInfo.color} style={{ fontWeight: 'bold' }}>
            {statusInfo.label}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Mã kho">
          {gr.warehouseId}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo">
          {new Date(gr.createdAt).toLocaleString("vi-VN")}
        </Descriptions.Item>
      </Descriptions>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        pagination={false}
        bordered
        size="small"
      />
    </Modal>
  );
}
