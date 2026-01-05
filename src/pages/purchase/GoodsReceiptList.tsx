import { Table, Button, Select, message, Spin, Space, Tag, Modal } from "antd";
import { useEffect, useState } from "react";
import { purchaseApi } from "../../api/purchase.api";
import type { GoodsReceiptDto, PurchaseQueryParams } from "../../types/purchase";
import GRCountingModal from "./GRCountingModal";

// 1. Định nghĩa mapping cho Enum Status
const StatusMapping: Record<number, { label: string; color: string }> = {
  0: { label: "Chờ xử lý", color: "orange" },
  1: { label: "Đã duyệt", color: "blue" },
  2: { label: "Nhận một phần", color: "cyan" },
  3: { label: "Hoàn thành", color: "green" },
  4: { label: "Từ chối", color: "red" },
};

export default function GRList() {
  const [grList, setGrList] = useState<GoodsReceiptDto[]>([]);
  const [poList, setPoList] = useState<{ id: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [poId, setPoId] = useState<string>();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGR, setSelectedGR] = useState<GoodsReceiptDto | null>(null);

  useEffect(() => {
    fetchPOs();
    fetchGRs();
  }, []);

  const fetchPOs = async () => {
    try {
      const res = await purchaseApi.getPOs({ status: "Approved" });
      setPoList(res.data);
    } catch { message.error("Không thể tải danh sách PO"); }
  };

  const fetchGRs = async () => {
    setLoading(true);
    try {
      const params: PurchaseQueryParams = poId ? { poId } : {};
      const res = await purchaseApi.getGRs(params);
      setGrList(res.data);
    } catch { message.error("Không thể tải danh sách GR"); }
    finally { setLoading(false); }
  };

  const openCounting = (record: GoodsReceiptDto) => {
    setSelectedGR(record);
    setIsModalOpen(true);
  };

  const columns = [
    { 
      title: "Mã GR", 
      dataIndex: "code", 
      key: "code",
      render: (text: string) => <b>{text}</b>
    },
    { 
      title: "Mã PO", 
      dataIndex: "purchaseOrderId", // Sử dụng đúng field từ interface bạn gửi trước đó
      key: "purchaseOrderId" 
    },
    { 
      title: "Trạng thái", 
      dataIndex: "status", 
      key: "status",
      render: (statusNumber: number) => {
        const statusInfo = StatusMapping[statusNumber] || { label: `N/A (${statusNumber})`, color: "default" };
        return (
          <Tag color={statusInfo.color}>
            {statusInfo.label.toUpperCase()}
          </Tag>
        );
      }
    },
    { 
      title: "Ngày tạo", 
      dataIndex: "createdAt", 
      render: (d: string) => new Date(d).toLocaleString("vi-VN") 
    },
    {
      title: "Hành động",
      key: "action",
      align: 'center' as const,
      render: (_: any, record: GoodsReceiptDto) => (
        <Button 
          type="primary" 
          onClick={() => openCounting(record)}
          disabled={record.Status === 3} // Disable nếu đã Hoàn thành (Complete = 3)
        >
          Kiểm đếm hàng
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Lọc theo PO"
          allowClear
          onChange={(val) => { setPoId(val); }}
          style={{ width: 250 }}
        >
          {poList.map(po => (
            <Select.Option key={po.id} value={po.id}>{po.code}</Select.Option>
          ))}
        </Select>
        <Button onClick={fetchGRs} type="primary">Tìm kiếm</Button>
      </Space>

      <Table 
        rowKey="id" 
        columns={columns} 
        dataSource={grList} 
        loading={loading}
        bordered
      />

      {selectedGR && (
        <GRCountingModal
          open={isModalOpen}
          gr={selectedGR}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedGR(null);
          }}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchGRs();
          }}
        />
      )}
    </div>
  );
}