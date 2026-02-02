import {
  Table,
  Button,
  Tabs,
  Space,
  Tag,
  Popconfirm,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { salesApi } from "../../api/sale.api";
import GoodsIssueDetailModal from "./GoodsIssueDetailModal";
import CreateProductionGIModal from "./CreateProductionGIModal";

// ===== ENUM =====
const GIType = {
  Sale: 0,
  Production: 1,
} as const;

const GIStatus = {
  Pending: 0,
  Approved: 1,
  Partial: 2,
  Completed: 3,
  Rejected: 4,
  Picking: 5,
} as const;

const StatusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Chờ xử lý", color: "orange" },
  1: { label: "Đã duyệt", color: "blue" },
  2: { label: "Xuất một phần", color: "cyan" },
  3: { label: "Hoàn thành", color: "green" },
  4: { label: "Từ chối", color: "red" },
  5: { label: "Đang picking", color: "purple" },
};

type TabKey = "sale" | "production";

export default function GoodsIssueList() {
  const [activeTab, setActiveTab] = useState<TabKey>("sale");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedGI, setSelectedGI] = useState<any | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    setList([]);
    setSelectedGI(null);
    setOpenDetail(false);
    setOpenCreate(false);
    fetchGIs();
  }, [activeTab]);

  const fetchGIs = async () => {
  setLoading(true);
  try {
    const type =
      activeTab === "sale" ? GIType.Sale : GIType.Production;

    const res = await salesApi.queryGI({ type });

    // 🔥 FILTER CỨNG Ở FE
    const filtered = (res.data || []).filter(
      (x: any) => x.type === type
    );

    setList(filtered);
  } catch {
    message.error("Không tải được danh sách GI");
  } finally {
    setLoading(false);
  }
};


  const approveGI = async (id: string) => {
    try {
      await salesApi.approveGI(id);
      message.success("Duyệt GI thành công");
      fetchGIs();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Approve thất bại");
    }
  };

  const baseColumns = [
    { title: "Mã GI", dataIndex: "code" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s: number) => {
        const info = StatusMap[s];
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: "Ngày xuất",
      dataIndex: "issuedAt",
      render: (d: string) =>
        d ? new Date(d).toLocaleString("vi-VN") : "-",
    },
  ];

  const saleColumns = [
    ...baseColumns,
    {
      title: "Đơn bán",
      render: (_: any, r: any) =>
        r.salesOrderCode || `SO-${r.salesOrderId?.slice(0, 8)}...`,
    },
    {
      title: "Hành động",
      render: (_: any, r: any) => (
        <Button size="small" onClick={() => openDetailGI(r)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  const productionColumns = [
    ...baseColumns,
    {
      title: "Hành động",
      render: (_: any, r: any) => {
        switch (r.status) {
          case GIStatus.Pending:
            return (
              <Popconfirm
                title={`Duyệt GI ${r.code}?`}
                onConfirm={() => approveGI(r.id)}
              >
                <Button type="primary" size="small">
                  Duyệt
                </Button>
              </Popconfirm>
            );

          case GIStatus.Approved:
          case GIStatus.Partial:
          case GIStatus.Picking:
            return (
              <Button
                type="primary"
                size="small"
                onClick={() => openDetailGI(r)}
              >
                Picking / Xuất
              </Button>
            );

          case GIStatus.Completed:
            return <Tag color="green">Hoàn thành</Tag>;

          default:
            return null;
        }
      },
    },
  ];

  const openDetailGI = (gi: any) => {
    setSelectedGI(gi);
    setOpenDetail(true);
  };

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as TabKey)}
        items={[
          { key: "sale", label: "Xuất bán" },
          { key: "production", label: "Xuất sản xuất" },
        ]}
      />

      {activeTab === "production" && (
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => setOpenCreate(true)}>
            Tạo GI sản xuất
          </Button>
        </Space>
      )}

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={activeTab === "sale" ? saleColumns : productionColumns}
        pagination={{ pageSize: 10 }}
      />

      {selectedGI && (
        <GoodsIssueDetailModal
          open={openDetail}
          goodsIssueId={selectedGI.id}
          onClose={() => setOpenDetail(false)}
          onActionSuccess={fetchGIs}
        />
      )}

      <CreateProductionGIModal
        open={openCreate}
        onCancel={() => setOpenCreate(false)}
        onSuccess={() => {
          setOpenCreate(false);
          fetchGIs();
        }}
      />
    </div>
  );
}
