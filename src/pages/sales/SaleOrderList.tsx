import { Table, Button, Tag, Space, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { salesApi } from "../../api/sale.api";
import SaleOrderCreateModal from "./SaleOrderCreateModal";
import SalesOrderDetailModal from "./SaleOrderDetail";

// DTO cập nhật để khớp backend
export interface SalesOrderItemDto {
  id: string;
  productId: number;
  orderQty: number;
  issuedQty: number;
  warehouseId: string;
  price: number;
  status: number;
}

export interface GoodsIssueDto {
  id: string;
  code?: string;
  status?: number; // GIStatus.Pending = 0, etc.
  warehouseId?: string;
  createAt?: string; // hoặc IssuedAt nếu có
}

export interface SalesOrderDto {
  id: string;
  code: string;
  customerId: number;
  customerName?: string;
  status: number;
  createdAt: string;
  updatedAt: string | null;
  approveBy: number | null;
  approvedAt: string | null;
  items: SalesOrderItemDto[];
  goodsIssues: GoodsIssueDto[]; // backend sẽ trả mảng này sau approve
}

const statusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Pending", color: "default" },
  1: { label: "Approved", color: "green" },
  2: { label: "Partially Issued", color: "orange" },
  3: { label: "Complete", color: "blue" },
  4: { label: "Rejected", color: "red" },
};

export default function SalesOrderList() {
  const [data, setData] = useState<SalesOrderDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSoId, setSelectedSoId] = useState<string | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const navigate = useNavigate();

  const refreshList = () => setRefreshKey((prev) => prev + 1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await salesApi.query();
      setData(res.data || []);
    } catch (err) {
      message.error("Không thể tải danh sách đơn hàng");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  const approve = async (id: string) => {
    try {
      await salesApi.approve(id);
      message.success("Đơn hàng đã được phê duyệt và tự động tạo phiếu xuất kho");
      refreshList();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Phê duyệt thất bại");
    }
  };

  const reject = async (id: string) => {
    try {
      await salesApi.reject(id);
      message.success("Đơn hàng đã bị từ chối");
      refreshList();
    } catch {
      message.error("Từ chối thất bại");
    }
  };

  const calcTotalAmount = (items: SalesOrderItemDto[]) =>
    items.reduce((sum, item) => sum + item.orderQty * item.price, 0);

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "code",
      width: 160,
    },
    {
      title: "Khách hàng",
      render: (_: any, record: SalesOrderDto) =>
        record.customerName || `KH ${record.customerId}`,
    },
    {
      title: "Tổng tiền",
      width: 140,
      align: "right" as const,
      render: (_: any, record: SalesOrderDto) =>
        calcTotalAmount(record.items).toLocaleString("vi-VN", {
          style: "currency",
          currency: "VND",
        }),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 160,
      render: (status: number) => {
        const { label, color } = statusMap[status] || { label: "Unknown", color: "default" };
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      width: 180,
      render: (v: string) => new Date(v).toLocaleString("vi-VN"),
    },
    {
      title: "Thao tác",
      width: 220,
      align: "center" as const,
      render: (_: any, record: SalesOrderDto) => {
        const status = record.status;
        const hasGoodsIssues = record.goodsIssues?.length > 0;

        return (
          <Space size="small">
            <Button size="small" onClick={() => setSelectedSoId(record.id)}>
              Chi tiết
            </Button>

            {status === 0 && (
              <>
                <Button type="primary" size="small" onClick={() => approve(record.id)}>
                  Phê duyệt
                </Button>
                <Button danger size="small" onClick={() => reject(record.id)}>
                  Từ chối
                </Button>
              </>
            )}

            {status === 1 && hasGoodsIssues && (
              <Tag color="processing">Đã tạo phiếu xuất kho tự động</Tag>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <Space
        style={{
          marginBottom: 16,
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <h2>Danh sách đơn bán hàng</h2>
        <Button type="primary" onClick={() => setOpenCreate(true)}>
          Tạo đơn hàng mới
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />

      <SaleOrderCreateModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onSuccess={refreshList}
      />

      <SalesOrderDetailModal
        open={!!selectedSoId}
        soId={selectedSoId}
        onCancel={() => setSelectedSoId(null)}
        onSuccess={refreshList}
      />
    </>
  );
}