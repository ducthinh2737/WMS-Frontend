import { Modal, Table, Tag, Descriptions } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { InboundOrderDto } from "../../types/inbound";

interface Props {
  open: boolean;
  onCancel: () => void;
  po?: InboundOrderDto;
}

// 1. Config cho trạng thái PO (Dùng String)
const STATUS_PO_CONFIG: Record<string, { text: string; color: string }> = {
  Pending: { text: "CHỜ DUYỆT", color: "orange" },
  Approve: { text: "ĐÃ DUYỆT", color: "green" },
  Partically_Received: { text: "NHẬN MỘT PHẦN", color: "cyan" },
  Complete: { text: "HOÀN THÀNH", color: "blue" },
  Rejected: { text: "TỪ CHỐI", color: "red" },
};

// 2. Config cho trạng thái Item - POI (Dùng Number Enum)
// Trong PurchaseDetailModal.tsx
const STATUS_POI_CONFIG: Record<number, { text: string; color: string }> = {
  0: { text: "CHỜ DUYỆT", color: "orange" },           // Pending
  1: { text: "ĐÃ DUYỆT", color: "green" },            // Approve
  2: { text: "NHẬN MỘT PHẦN", color: "cyan" },        // Partically_Received
  3: { text: "HOÀN THÀNH", color: "blue" },           // Complete
  4: { text: "TỪ CHỐI", color: "red" },               // Rejected
};

export default function PurchaseDetailModal({ open, onCancel, po }: Props) {
  if (!po) return null;

  // Lấy info status của PO (String)
  const poStatusStr = po.status || "Unknown";
  const poStatusInfo = STATUS_PO_CONFIG[poStatusStr] || { 
    text: poStatusStr.toUpperCase(), 
    color: "default" 
  };

  const columns: ColumnsType<InboundOrderDto["items"][number]> = [
    {
      title: "Mã sản phẩm",
      dataIndex: "productId",
      key: "productId",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
    },
    {
      title: "Đã nhận",
      dataIndex: "receivedQuantity",
      key: "receivedQuantity",
      align: "right",
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      align: "right",
      render: (v?: number) => v ? `${v.toLocaleString("vi-VN")} ₫` : "0 ₫",
    },
    // ✅ THÊM CỘT STATUS CHO TỪNG ITEM (Dùng Enum Number)
    {
      title: "Trạng thái Item",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (statusNum: number) => {
        const itemStatus = STATUS_POI_CONFIG[statusNum] || { text: `Mã ${statusNum}`, color: "default" };
        return <Tag color={itemStatus.color}>{itemStatus.text}</Tag>;
      }
    },
    {
      title: "Thành tiền",
      key: "total",
      align: "right",
      render: (_, record) => {
        const total = (record.price || 0) * record.quantity;
        return <b>{total.toLocaleString("vi-VN")} ₫</b>;
      },
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000} // Tăng chiều rộng để đủ chỗ cho cột status mới
      title={`Chi tiết đơn mua hàng - ${po.code}`}
      centered
      destroyOnClose
    >
      <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Mã PO">
          <strong style={{ color: '#1890ff' }}>{po.code}</strong>
        </Descriptions.Item>

        <Descriptions.Item label="Trạng thái PO">
          <Tag color={poStatusInfo.color} style={{ fontWeight: 'bold' }}>
            {poStatusInfo.text}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Nhà cung cấp">
          ID: {po.supplierId}
        </Descriptions.Item>

        <Descriptions.Item label="Ngày tạo">
          {new Date(po.createdAt).toLocaleString("vi-VN")}
        </Descriptions.Item>
      </Descriptions>

      <Table
        rowKey={(r) => `${r.productId}-${r.locationId}`}
        columns={columns}
        dataSource={po.items}
        pagination={false}
        bordered
        size="small"
        summary={(pageData) => {
          let totalAmount = 0;
          pageData.forEach(({ price, quantity }) => {
            totalAmount += (price || 0) * quantity;
          });
          return (
            <Table.Summary.Row style={{ backgroundColor: "#fafafa" }}>
              <Table.Summary.Cell index={0} colSpan={5} align="right">
                <strong>Tổng cộng tiền hàng:</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <strong style={{ color: "#f5222d", fontSize: "16px" }}>
                  {totalAmount.toLocaleString("vi-VN")} ₫
                </strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    </Modal>
  );
}
