import { Table, Button, Select, message, Spin, Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { purchaseApi } from "../../api/purchase.api";
import { supplierApi } from "../../api/supplier.api";
import type { PurchaseOrderDto } from "../../types/purchase";
import type { SupplierDto } from "../../types/supplier";
import PurchaseCreateModal from "./PurchaseForm"; // Đảm bảo bạn đã tạo file này
import { CheckOutlined, CloseOutlined, PlusOutlined } from "@ant-design/icons";
import PurchaseDetailModal from "./PurchaseDetailModal";

const { Text } = Typography;

// Mapping màu sắc cho Status
const StatusColors: Record<string, string> = {
  Pending: "orange",
  Approve: "green",
  Rejected: "red",
  Partically_Received: "cyan",
  Complete: "blue",
};

export default function PurchaseList() {
  const [poList, setPoList] = useState<PurchaseOrderDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderDto | undefined>();
  
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // --- Lấy danh sách Nhà cung cấp để map tên
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await supplierApi.getAll();
      setSuppliers(res.data);
    } catch {
      message.error("Không thể tải danh sách nhà cung cấp");
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // --- Lấy danh sách PO (có lọc theo status)
  const fetchPOs = async () => {
    setLoading(true);
    try {
      const res = await purchaseApi.getPOs({ status: statusFilter });
      setPoList(res.data);
    } catch {
      message.error("Không thể tải danh sách đơn mua hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchPOs();
  }, []);

  // Tự động load lại khi thay đổi filter status
  useEffect(() => {
    fetchPOs();
  }, [statusFilter]);

  // --- Các hàm xử lý phê duyệt/từ chối
  const handleApprove = async (id: string) => {
    try {
      await purchaseApi.approvePO(id);
      message.success("Đã phê duyệt đơn hàng");
      fetchPOs();
    } catch {
      message.error("Phê duyệt thất bại");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await purchaseApi.rejectPO(id);
      message.success("Đã từ chối đơn hàng");
      fetchPOs();
    } catch {
      message.error("Từ chối thất bại");
    }
  };

  // --- Cấu hình cột của bảng
  const columns = [
  { 
    title: "Mã PO", 
    dataIndex: "code", 
    key: "code",
    render: (text: string) => <Text strong style={{ color: "#1890ff" }}>{text}</Text>
  },
  {
    title: "Nhà cung cấp",
    dataIndex: "supplierId",
    key: "supplierId",
    render: (supplierId: number) => {
      if (loadingSuppliers) return <Spin size="small" />;
      const supplier = suppliers.find(s => s.id === supplierId);
      return supplier ? supplier.name : <Text type="secondary">N/A</Text>;
    }
  },
  // Hiển thị trạng thái PO (Dùng string mapping)
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    render: (status: string) => {
      const color = StatusColors[status] || "default";
      // Chuyển "Partically_Received" thành "PARTICALLY RECEIVED" để hiển thị
      const displayText = status ? status.replace('_', ' ').toUpperCase() : "UNKNOWN";
      return <Tag color={color}>{displayText}</Tag>;
    }
  },
  { 
    title: "Ngày tạo", 
    dataIndex: "createdAt", 
    key: "createdAt",
    render: (date: string) => new Date(date).toLocaleDateString("vi-VN")
  },
  {
    title: "Thao tác",
    key: "action",
    width: 280,
    render: (_: any, record: PurchaseOrderDto) => (
      // Sửa lỗi separator ở đây bằng cách dùng string hoặc ReactNode đơn giản
      <Space split={<span style={{ color: '#ccc' }}>|</span>}>
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSelectedPO(record);
            setDetailOpen(true);
          }}
        >
          Xem chi tiết
        </Button>

        {record.status === "Pending" && (
          <>
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleApprove(record.id)}
            >
              Duyệt
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={() => handleReject(record.id)}
            >
              Từ chối
            </Button>
          </>
        )}
      </Space>
    )
  }
];
  return (
    <div style={{ padding: 24 }}>
      <div style={{ 
        marginBottom: 24, 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff',
        padding: '16px',
        borderRadius: '8px'
      }}>
        <Space size="middle">
          <Text strong>Bộ lọc:</Text>
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            onChange={setStatusFilter}
            style={{ width: 220 }}
            options={[
              { label: "Chờ duyệt (Pending)", value: "Pending" },
              { label: "Đã duyệt (Approved)", value: "Approve" },
              { label: "Bị từ chối (Rejected)", value: "Rejected" },
              { label: "Đang nhập hàng (Partial)", value: "Partically_Received" },
              { label: "Hoàn thành (Complete)", value: "Complete" },
            ]}
          />
          <Button type="default" onClick={fetchPOs} loading={loading}>Làm mới</Button>
        </Space>

        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalOpen(true)}
          size="large"
        >
          Tạo đơn mua hàng
        </Button>
      </div>

      <Table 
        rowKey="id" 
        columns={columns} 
        dataSource={poList} 
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
      />
      <PurchaseDetailModal
  open={detailOpen}
  po={selectedPO}
  onCancel={() => {
    setDetailOpen(false);
    setSelectedPO(undefined);
  }}
/>


      {/* Popup tạo PO mới */}
      <PurchaseCreateModal 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchPOs(); // Reload lại danh sách sau khi tạo
        }}
      />
    </div>
  );
}