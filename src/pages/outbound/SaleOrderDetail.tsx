import {
  Modal,
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Descriptions,
  Divider,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { outboundApi } from "../../api/outbound.api";

// Định nghĩa DTO THỰC TẾ từ backend
interface SalesOrderItemDto {
  id: string;
  productId: number;
  orderQty: number;
  issuedQty: number;
  warehouseId: string;
  price: number;
  status: number;
}

interface GoodsIssueDto {
  id: string;
  // Thêm các field thực tế nếu BE trả (hiện tại mảng rỗng nên tạm để optional)
  code?: string;
  status?: number;
  issuedAt?: string;
}

interface SalesOrderDetailDto {
  id: string;
  code: string;
  customerId: number;
  status: number; // 0=Pending, 1=Approved, ...
  createdAt: string;
  updatedAt: string | null;
  approveBy: number | null;
  approvedAt: string | null;
  items: SalesOrderItemDto[];
  goodsIssues: GoodsIssueDto[];
}

// Map status number → label + color
const statusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Pending", color: "default" },
  1: { label: "Approved", color: "green" },
  2: { label: "Partially Issued", color: "orange" },
  3: { label: "Complete", color: "blue" },
  4: { label: "Rejected", color: "red" },
};

interface Props {
  open: boolean;
  soId: string | null;
  onCancel: () => void;
  onSuccess?: () => void;
}

export default function SalesOrderDetailModal({
  open,
  soId,
  onCancel,
  onSuccess,
}: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<SalesOrderDetailDto | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!soId) return;
    try {
      setLoading(true);
      const res = await outboundApi.getOrder(soId);
      setData(res.data);
    } catch (err) {
      message.error("Không thể tải thông tin đơn hàng");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && soId) {
      fetchData();
    }
  }, [open, soId]);

  const handleApprove = async () => {
    if (!data) return;
    try {
      await outboundApi.approveOrder(data.id);
      message.success("Đơn hàng đã được phê duyệt");
      fetchData();
      onSuccess?.();
    } catch {
      message.error("Lỗi phê duyệt");
    }
  };

  const handleReject = async () => {
    if (!data) return;
    try {
      await outboundApi.rejectOrder(data.id);
      message.success("Đơn hàng đã bị từ chối");
      fetchData();
      onSuccess?.();
    } catch {
      message.error("Lỗi từ chối");
    }
  };

  const handleCreateGoodsIssue = () => {
    if (!data) return;
    navigate(`/outbound/issue/create?soId=${data.id}`);
    onCancel();
  };

  // Tính tổng tiền từ items
  const calculateTotal = (items: SalesOrderItemDto[]) =>
    items.reduce((sum, item) => sum + item.orderQty * item.price, 0);

  const getStatusTag = (status: number) => {
    const { label, color } = statusMap[status] || { label: "Unknown", color: "default" };
    return <Tag color={color}>{label}</Tag>;
  };

  return (
    <Modal
      title={data ? `Đơn hàng ${data.code}` : "Chi tiết đơn hàng"}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={1000}
      destroyOnHidden
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 50 }}>Đang tải...</div>
      ) : !data ? (
        <div style={{ textAlign: "center", padding: 50 }}>
          Không tìm thấy đơn hàng
        </div>
      ) : (
        <>
          {/* Header Info */}
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Khách hàng">
              KH {data.customerId} {/* Sau này fetch tên nếu cần */}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {getStatusTag(data.status)}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              {calculateTotal(data.items).toLocaleString("vi-VN", {
                style: "currency",
                currency: "VND",
              })}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {new Date(data.createdAt).toLocaleString("vi-VN")}
            </Descriptions.Item>
          </Descriptions>

          {/* Action Buttons */}
          <Space style={{ margin: "16px 0", flexWrap: "wrap" }}>
  <Button onClick={onCancel}>Đóng</Button>

  {data.status === 0 && (
    <>
      <Button type="primary" onClick={handleApprove}>
        Phê duyệt
      </Button>
      <Button danger onClick={handleReject}>
        Từ chối
      </Button>
    </>
  )}

  {data.status === 1 && data.goodsIssues?.length > 0 && (
    <Tag color="processing" style={{ padding: "6px 12px" }}>
      Đã tự động tạo {data.goodsIssues.length} phiếu xuất kho
    </Tag>
  )}
</Space>

          <Divider />

          {/* Order Items */}
          <Card title="Chi tiết sản phẩm" size="small">
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={data.items}
              columns={[
                {
                  title: "Sản phẩm",
                  dataIndex: "productId",
                  width: 220,
                  render: (productId: number) => `SP ${productId}`, // Tạm thời, sau này fetch tên
                },
                {
                  title: "SL Đặt",
                  dataIndex: "orderQty",
                  width: 100,
                  align: "center",
                },
                {
                  title: "Đã xuất",
                  dataIndex: "issuedQty",
                  width: 100,
                  align: "center",
                },
                {
                  title: "Còn lại",
                  width: 100,
                  align: "center",
                  render: (_, record) => record.orderQty - record.issuedQty,
                },
                {
                  title: "Đơn giá",
                  dataIndex: "price",
                  width: 140,
                  align: "right",
                  render: (val: number) =>
                    val.toLocaleString("vi-VN", { style: "currency", currency: "VND" }),
                },
                {
                  title: "Thành tiền",
                  width: 160,
                  align: "right",
                  render: (_, record) =>
                    (record.orderQty * record.price).toLocaleString("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }),
                },
              ]}
            />
          </Card>

          {/* Goods Issues */}
          <Card title="Phiếu xuất kho liên quan" size="small" style={{ marginTop: 16 }}>
            {data.goodsIssues?.length > 0 ? (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={data.goodsIssues}
                columns={[
                  { title: "Mã phiếu", dataIndex: "code" },
                  {
                    title: "Trạng thái",
                    dataIndex: "status",
                    render: (s?: number) => (s !== undefined ? statusMap[s]?.label : "N/A"),
                  },
                  {
                    title: "Ngày xuất",
                    dataIndex: "issuedAt",
                    render: (date?: string) =>
                      date ? new Date(date).toLocaleString("vi-VN") : "N/A",
                  },
                  {
                    title: "",
                    render: (_, record) => (
                      <Button
                        type="link"
                        onClick={() => {
                          onCancel();
                          navigate(`/outbound/issue/${record.id}`);
                        }}
                      >
                        Xem
                      </Button>
                    ),
                  },
                ]}
              />
            ) : (
              <div style={{ textAlign: "center", padding: 24, color: "#888" }}>
                Chưa có phiếu xuất kho nào
              </div>
            )}
          </Card>
        </>
      )}
    </Modal>
  );
}
