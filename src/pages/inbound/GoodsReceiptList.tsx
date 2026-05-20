import {
  Table,
  Button,
  message,
  Space,
  Tag,
  Popconfirm,
} from "antd";
import { useEffect, useState } from "react";

import { inboundApi } from "../../api/inbound.api";
import type { GoodsReceiptDto } from "../../types/inbound";

import ProductionGRCountingModal from "./ProductionGRCountingModal";
import CreateProductionGRModal from "./CreateProductionGRModal";
import GRDetailModal from "./GRDetailModal";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";
import { Input, Select } from "antd";

// ================= ENUM =================
const GRStatus = {
  Pending: 0,
  Approved: 1,
  Partial: 2,
  Completed: 3,
  Rejected: 4,
  OutOfStock: 5,   // ← thêm
  InsufficientStock: 6,   // ← thêm
} as const;

type GRStatus = (typeof GRStatus)[keyof typeof GRStatus];

// ================= STATUS MAP =================
const StatusMapping: Record<number, { label: string; color: string }> = {
  0: { label: "Chờ xử lý", color: "orange" },
  1: { label: "Đã duyệt", color: "blue" },
  2: { label: "Nhận một phần", color: "cyan" },
  3: { label: "Hoàn thành", color: "green" },
  4: { label: "Từ chối", color: "red" },
  5: { label: "Hết hàng", color: "volcano" }, // ← thêm
  6: { label: "Không đủ hàng", color: "gold" }, // ← thêm
};

export default function GoodsReceiptList() {
  const [grList, setGrList] = useState<GoodsReceiptDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedGR, setSelectedGR] = useState<GoodsReceiptDto | null>(null);
  const [openCounting, setOpenCounting] = useState(false);
  const [openCreateProduction, setOpenCreateProduction] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);

  // Filters
  const [filterCode, setFilterCode] = useState("");
  const [filterStatus, setFilterStatus] = useState<number | null>(null);

  useEffect(() => { fetchGRs(); }, []);

  const fetchGRs = async () => {
    setLoading(true);
    try {
      const res = await inboundApi.getGRsByType({ receiptType: 1 });
      setGrList(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách phiếu nhập");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCounting = (record: GoodsReceiptDto) => {
    setSelectedGR(record);
    setOpenCounting(true);
  };

  const handleApproveProduction = async (record: GoodsReceiptDto) => {
    try {
      await inboundApi.approveProductionGR(record);
      message.success("Duyệt phiếu nhập thành công");
      fetchGRs();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Duyệt thất bại");
    }
  };

  // ← thêm hàm này, mirror updateStatus bên GoodsIssueList
  const updateGRStatus = async (id: string, status: number) => {
    try {
      await inboundApi.updateGRStatus(id, status);

      // cập nhật UI ngay, không chờ reload
      setGrList((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status } : x))
      );

      message.success("Cập nhật trạng thái thành công");

      // đồng bộ lại từ server sau 300ms
      setTimeout(() => fetchGRs(), 300);
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Cập nhật trạng thái thất bại"
      );
    }
  };

  const columns = [
    {
      title: "Mã phiếu nhập",
      dataIndex: "code",
      render: (t: string) => <strong>{t}</strong>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s: number) => {
        const info = StatusMapping[s] ?? { label: "Không xác định", color: "default" };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (d: string | null) => {
        if (!d) return "-";
        let dateStr = d.replace(" ", "T");
        if (!dateStr.endsWith("Z") && !dateStr.includes("+")) {
          dateStr += "Z";
        }
        return new Date(dateStr).toLocaleString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit"
        });
      },
    },
    {
      title: "Hành động",
      align: "center" as const,
      render: (_: any, record: GoodsReceiptDto) => {
        switch (record.status) {

          case GRStatus.Pending:
            return (
              <Space wrap>
                <Popconfirm
                  title="Xác nhận duyệt phiếu nhập?"
                  onConfirm={() => handleApproveProduction(record)}
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button type="primary" size="small">Duyệt</Button>
                </Popconfirm>

                <Popconfirm
                  title="Xác nhận từ chối phiếu nhập?"
                  onConfirm={() => updateGRStatus(record.id, GRStatus.Rejected)}
                  okText="Từ chối"
                  cancelText="Hủy"
                >
                  <Button danger size="small">Từ chối</Button>
                </Popconfirm>

                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => { setSelectedGR(record); setOpenDetail(true); }}
                >
                  Chi tiết
                </Button>
              </Space>
            );

          case GRStatus.Approved:
          case GRStatus.Partial:
            return (
              <Space wrap>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleOpenCounting(record)}
                >
                  Kiểm hàng
                </Button>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => { setSelectedGR(record); setOpenDetail(true); }}
                >
                  Chi tiết
                </Button>
              </Space>
            );


          default:
            return (
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => { setSelectedGR(record); setOpenDetail(true); }}
              >
                Chi tiết
              </Button>
            );
        }
      },
    },
  ];

  const filteredGRs = grList.filter(gr => {
    let match = true;
    if (filterCode && !gr.code.toLowerCase().includes(filterCode.toLowerCase())) match = false;
    if (filterStatus !== null && gr.status !== filterStatus) match = false;
    return match;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>Phiếu nhập</h2>
        <Button type="primary" onClick={() => setOpenCreateProduction(true)}>
          + Tạo phiếu nhập
        </Button>
      </div>

      {/* FILTER SECTION */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <Input
          placeholder="Tìm theo mã phiếu nhập..."
          value={filterCode}
          onChange={(e) => setFilterCode(e.target.value)}
          style={{ width: 250 }}
          prefix={<SearchOutlined />}
          allowClear
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 200 }}
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value: GRStatus.Pending, label: "Chờ xử lý" },
            { value: GRStatus.Approved, label: "Đã duyệt" },
            { value: GRStatus.Partial, label: "Nhận một phần" },
            { value: GRStatus.Completed, label: "Hoàn thành" },
            { value: GRStatus.Rejected, label: "Từ chối" },
            { value: GRStatus.OutOfStock, label: "Hết hàng" },
            { value: GRStatus.InsufficientStock, label: "Không đủ hàng" },
          ]}
        />
      </div>

      <Table
        dataSource={filteredGRs}
        columns={columns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      {selectedGR && (
        <ProductionGRCountingModal
          open={openCounting}
          gr={selectedGR}
          onCancel={() => { setOpenCounting(false); setSelectedGR(null); }}
          onSuccess={() => { setOpenCounting(false); setSelectedGR(null); fetchGRs(); }}
        />
      )}

      <CreateProductionGRModal
        open={openCreateProduction}
        onCancel={() => setOpenCreateProduction(false)}
        onSuccess={() => { setOpenCreateProduction(false); fetchGRs(); }}
      />

      <GRDetailModal
        open={openDetail}
        gr={selectedGR}
        onCancel={() => { setOpenDetail(false); setSelectedGR(null); }}
      />
    </div>
  );
}
