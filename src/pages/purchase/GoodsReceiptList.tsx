import {
  Table,
  Button,
  Select,
  message,
  Space,
  Tag,
  Tabs,
  Popconfirm,
} from "antd";
import { useEffect, useState } from "react";
import { purchaseApi } from "../../api/purchase.api";
import type { GoodsReceiptDto } from "../../types/purchase";
import GRCountingModal from "./GRCountingModal";
import ProductionGRCountingModal from "./ProductionGRCountingModal";
import CreateProductionGRModal from "./CreateProductionGRModal";

// ================= ENUM =================
const ReceiptType = {
  Purchase: 0,
  Production: 1,
} as const;
type ReceiptType = (typeof ReceiptType)[keyof typeof ReceiptType];

const GRStatus = {
  Pending: 0,
  Approved: 1,
  Partial: 2,
  Completed: 3,
  Rejected: 4,
} as const;
type GRStatus = (typeof GRStatus)[keyof typeof GRStatus];

// ================= STATUS MAP =================
const StatusMapping: Record<number, { label: string; color: string }> = {
  0: { label: "Chờ xử lý", color: "orange" },
  1: { label: "Đã duyệt", color: "blue" },
  2: { label: "Nhận một phần", color: "cyan" },
  3: { label: "Hoàn thành", color: "green" },
  4: { label: "Từ chối", color: "red" },
};

type TabKey = "purchase" | "production";

export default function GoodsReceiptList() {
  const [activeTab, setActiveTab] = useState<TabKey>("purchase");
  const [grList, setGrList] = useState<GoodsReceiptDto[]>([]);
  const [poList, setPoList] = useState<{ id: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [poId, setPoId] = useState<string>();
  const [selectedGR, setSelectedGR] = useState<GoodsReceiptDto | null>(null);
  const [openCounting, setOpenCounting] = useState(false);

  // 🔥 modal tạo GR sản xuất
  const [openCreateProduction, setOpenCreateProduction] = useState(false);

  // ================= EFFECT =================
  useEffect(() => {
    setGrList([]);
    setSelectedGR(null);
    setOpenCounting(false);
    setPoId(undefined);

    if (activeTab === "purchase") {
      fetchPOs();
    }
    fetchGRs();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "purchase") {
      fetchGRs();
    }
  }, [poId]);

  // ================= API =================
  const fetchPOs = async () => {
    try {
      const res = await purchaseApi.getPOs({ status: "Approved" });
      setPoList(res.data || []);
    } catch {
      message.error("Không thể tải danh sách PO");
    }
  };

  const fetchGRs = async () => {
    setLoading(true);
    try {
      const receiptType =
        activeTab === "purchase"
          ? ReceiptType.Purchase
          : ReceiptType.Production;

      const res = await purchaseApi.getGRsByType({
        receiptType,
        ...(activeTab === "purchase" && poId ? { poId } : {}),
      });

      setGrList(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách GR");
    } finally {
      setLoading(false);
    }
  };

  // ================= HELPERS =================
  const getPOCode = (purchaseOrderId: string | null) => {
    if (!purchaseOrderId) return "-";
    const po = poList.find((p) => p.id === purchaseOrderId);
    return po?.code || purchaseOrderId.substring(0, 8) + "...";
  };

  // ================= ACTION =================
  const handleOpenCounting = (record: GoodsReceiptDto) => {
    setSelectedGR(record);
    setOpenCounting(true);
  };

  const handleApproveProduction = async (record: GoodsReceiptDto) => {
    try {
      await purchaseApi.approveProductionGR(record);
      message.success("Duyệt GR sản xuất thành công");
      fetchGRs();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Approve GR thất bại");
    }
  };

  // ================= COLUMNS =================
  const baseColumns = [
    {
      title: "Mã GR",
      dataIndex: "code",
      render: (t: string) => <strong>{t}</strong>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s: number) => {
        const info = StatusMapping[s];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (d: string) => new Date(d).toLocaleString("vi-VN"),
    },
  ];

  // ===== Purchase =====
  const canCountPurchase = (status: number) =>
    status === GRStatus.Pending || status === GRStatus.Partial;

  const purchaseColumns = [
    ...baseColumns,
    {
      title: "Mã PO",
      dataIndex: "purchaseOrderId",
      render: (poId: string | null) => getPOCode(poId),
    },
    {
      title: "Hành động",
      align: "center" as const,
      render: (_: any, record: GoodsReceiptDto) => {
        if (record.status === GRStatus.Completed) {
          return <Tag color="green">Hoàn thành</Tag>;
        }

        return (
          <Button
            type="primary"
            size="small"
            disabled={!canCountPurchase(record.status)}
            onClick={() => handleOpenCounting(record)}
          >
            Kiểm kê
          </Button>
        );
      },
    },
  ];

  // ===== Production =====
  const productionColumns = [
    ...baseColumns,
    {
      title: "Hành động",
      align: "center" as const,
      render: (_: any, record: GoodsReceiptDto) => {
        switch (record.status) {
          case GRStatus.Pending:
            return (
              <Popconfirm
                title="Xác nhận duyệt GR sản xuất?"
                onConfirm={() => handleApproveProduction(record)}
              >
                <Button type="primary" size="small">
                  Duyệt
                </Button>
              </Popconfirm>
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

          default:
            return null;
        }
      },
    },
  ];

  // ================= RENDER =================
  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as TabKey)}
        items={[
          { key: "purchase", label: "GR Mua hàng" },
          { key: "production", label: "GR Sản xuất" },
        ]}
      />

      {/* ===== TOOLBAR ===== */}
      {activeTab === "purchase" && (
        <Space style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Chọn PO"
            style={{ width: 200 }}
            value={poId}
            onChange={(v) => setPoId(v)}
          >
            {poList.map((po) => (
              <Select.Option key={po.id} value={po.id}>
                {po.code}
              </Select.Option>
            ))}
          </Select>
          <Button onClick={fetchGRs}>Tìm</Button>
        </Space>
      )}

      {activeTab === "production" && (
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            onClick={() => setOpenCreateProduction(true)}
          >
            + Tạo GR sản xuất
          </Button>
        </Space>
      )}

      {/* ===== TABLE ===== */}
      <Table
        dataSource={grList}
        columns={activeTab === "purchase" ? purchaseColumns : productionColumns}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      {/* ===== MODALS ===== */}
      {selectedGR && activeTab === "purchase" && (
        <GRCountingModal
          open={openCounting}
          gr={selectedGR}
          onCancel={() => setOpenCounting(false)}
          onSuccess={() => {
            setOpenCounting(false);
            fetchGRs();
          }}
        />
      )}

      {selectedGR && activeTab === "production" && (
        <ProductionGRCountingModal
          open={openCounting}
          gr={selectedGR}
          onCancel={() => setOpenCounting(false)}
          onSuccess={() => {
            setOpenCounting(false);
            fetchGRs();
          }}
        />
      )}

      {/* 🔥 CREATE PRODUCTION GR */}
      <CreateProductionGRModal
        open={openCreateProduction}
        onCancel={() => setOpenCreateProduction(false)}
        onSuccess={() => {
          setOpenCreateProduction(false);
          fetchGRs();
        }}
      />
    </div>
  );
}
