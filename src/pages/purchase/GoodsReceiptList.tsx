import {
  Table,
  Button,
  message,
  Space,
  Tag,
  Popconfirm,
} from "antd";
import { useEffect, useState } from "react";

import { purchaseApi } from "../../api/purchase.api";
import type { GoodsReceiptDto } from "../../types/purchase";

import ProductionGRCountingModal from "./ProductionGRCountingModal";
import CreateProductionGRModal from "./CreateProductionGRModal";

// ================= ENUM =================
const GRStatus = {
  Pending:           0,
  Approved:          1,
  Partial:           2,
  Completed:         3,
  Rejected:          4,
  OutOfStock:        5,   // ← thêm
  InsufficientStock: 6,   // ← thêm
} as const;

type GRStatus = (typeof GRStatus)[keyof typeof GRStatus];

// ================= STATUS MAP =================
const StatusMapping: Record<number, { label: string; color: string }> = {
  0: { label: "Chờ xử lý",       color: "orange"  },
  1: { label: "Đã duyệt",        color: "blue"    },
  2: { label: "Nhận một phần",   color: "cyan"    },
  3: { label: "Hoàn thành",      color: "green"   },
  4: { label: "Từ chối",         color: "red"     },
  5: { label: "Hết hàng",        color: "volcano" }, // ← thêm
  6: { label: "Không đủ hàng",   color: "gold"    }, // ← thêm
};

export default function GoodsReceiptList() {
  const [grList, setGrList] = useState<GoodsReceiptDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedGR, setSelectedGR] = useState<GoodsReceiptDto | null>(null);
  const [openCounting, setOpenCounting] = useState(false);
  const [openCreateProduction, setOpenCreateProduction] = useState(false);

  useEffect(() => { fetchGRs(); }, []);

  const fetchGRs = async () => {
    setLoading(true);
    try {
      const res = await purchaseApi.getGRsByType({ receiptType: 1 });
      setGrList(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách đơn nhập");
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
      await purchaseApi.approveProductionGR(record);
      message.success("Duyệt đơn nhập thành công");
      fetchGRs();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Duyệt thất bại");
    }
  };

  // ← thêm hàm này, mirror updateStatus bên GoodsIssueList
  const updateGRStatus = async (id: string, status: number) => {
    try {
      await purchaseApi.updateGRStatus(id, status);

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
      title: "Mã đơn nhập",
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
      render: (d: string) => new Date(d).toLocaleString("vi-VN"),
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
                  title="Xác nhận duyệt đơn nhập?"
                  onConfirm={() => handleApproveProduction(record)}
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button type="primary" size="small">Duyệt</Button>
                </Popconfirm>

                {/* ← 2 nút mới, giống module xuất */}
                <Popconfirm
                  title="Xác nhận đánh dấu hết hàng?"
                  onConfirm={() => updateGRStatus(record.id, GRStatus.OutOfStock)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button danger size="small">Hết hàng</Button>
                </Popconfirm>

                <Popconfirm
                  title="Xác nhận đánh dấu không đủ hàng?"
                  onConfirm={() => updateGRStatus(record.id, GRStatus.InsufficientStock)}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button size="small">Không đủ hàng</Button>
                </Popconfirm>
              </Space>
            );

          case GRStatus.Approved:
          case GRStatus.Partial:
            return (
              <Button
                type="primary"
                size="small"
                onClick={() => handleOpenCounting(record)}
              >
                Kiểm kê
              </Button>
            );

          case GRStatus.Completed:
            return <Tag color="green">Hoàn thành</Tag>;

          case GRStatus.OutOfStock:
            return <Tag color="volcano">Hết hàng</Tag>;

          case GRStatus.InsufficientStock:
            return <Tag color="gold">Không đủ hàng</Tag>;

          default:
            return null;
        }
      },
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>Đơn nhập</h2>
        <Button type="primary" onClick={() => setOpenCreateProduction(true)}>
          + Tạo đơn nhập
        </Button>
      </div>

      <Table
        dataSource={grList}
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
    </div>
  );
}