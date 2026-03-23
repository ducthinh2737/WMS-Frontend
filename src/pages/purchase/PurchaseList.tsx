// ================================================================
// src/pages/purchase/PurchaseList.tsx  — ĐÃ CẬP NHẬT
// Thêm nút "Nhập kho nhanh" + tích hợp ScanReceiveModal
// ================================================================

import { Table, Button, Select, message, Spin, Space, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { purchaseApi } from "../../api/purchase.api";
import { supplierApi } from "../../api/supplier.api";
import type { PurchaseOrderDto } from "../../types/purchase";
import type { SupplierDto } from "../../types/supplier";
import PurchaseCreateModal from "./PurchaseForm";
import { CheckOutlined, CloseOutlined, PlusOutlined, ScanOutlined } from "@ant-design/icons"; // 🆕 ScanOutlined
import PurchaseDetailModal from "./PurchaseDetailModal";
import ScanReceiveModal from "./Scanreceivemodal"; // 🆕

const { Text } = Typography;

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

  // 🆕 Scan modal state
  const [scanModalOpen, setScanModalOpen] = useState(false);

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

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

  useEffect(() => {
    fetchPOs();
  }, [statusFilter]);

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

  const columns = [
    {
      title: "Mã PO",
      dataIndex: "code",
      key: "code",
      render: (text: string) => <Text strong style={{ color: "#1890ff" }}>{text}</Text>,
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "supplierId",
      key: "supplierId",
      render: (supplierId: number) => {
        if (loadingSuppliers) return <Spin size="small" />;
        const supplier = suppliers.find(s => s.id === supplierId);
        return supplier ? supplier.name : <Text type="secondary">N/A</Text>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color = StatusColors[status] || "default";
        const displayText = status ? status.replace("_", " ").toUpperCase() : "UNKNOWN";
        return <Tag color={color}>{displayText}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 280,
      render: (_: any, record: PurchaseOrderDto) => (
        <Space split={<span style={{ color: "#ccc" }}>|</span>}>
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
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* ─── TOOLBAR ─── */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#fff",
          padding: "16px",
          borderRadius: "8px",
        }}
      >
        {/* Left: filters */}
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
          <Button type="default" onClick={fetchPOs} loading={loading}>
            Làm mới
          </Button>
        </Space>

        {/* Right: action buttons */}
        <Space>
          {/* 🆕 Nút Nhập kho nhanh */}
          <Button
            size="large"
            icon={<ScanOutlined />}
            onClick={() => setScanModalOpen(true)}
            style={{
              borderColor: "#faad14",
              color: "#faad14",
              fontWeight: 600,
            }}
          >
            Nhập kho nhanh
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
            size="large"
          >
            Tạo đơn mua hàng
          </Button>
        </Space>
      </div>

      {/* ─── TABLE ─── */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={poList}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
      />

      {/* ─── MODALS ─── */}
      <PurchaseDetailModal
        open={detailOpen}
        po={selectedPO}
        onCancel={() => {
          setDetailOpen(false);
          setSelectedPO(undefined);
        }}
      />

      <PurchaseCreateModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          fetchPOs();
        }}
      />

      {/* 🆕 Scan & Receive Modal */}
      <ScanReceiveModal
        open={scanModalOpen}
        onCancel={() => setScanModalOpen(false)}
        onSuccess={() => {
          setScanModalOpen(false);
          fetchPOs(); // Reload list sau khi nhập kho xong
        }}
      />
    </div>
  );
}