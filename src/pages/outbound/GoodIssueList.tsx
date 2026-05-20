import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Input,
  Select,
} from "antd";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { outboundApi } from "../../api/outbound.api";
import GoodsIssueDetailModal from "./GoodsIssueDetailModal";
import CreateProductionGIModal from "./CreateProductionGIModal";

// ===== ENUM =====
const GIType = {
  Production: 1,
} as const;

const GIStatus = {
  Pending: 0,
  Approved: 1,
  Partial: 2,
  Completed: 3,
  Rejected: 4,
  Picking: 5,

  OutOfStock: 6,
  InsufficientStock: 7,
  Picked: 8,
} as const;

// ===== STATUS MAP =====
const StatusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Chờ xử lý", color: "orange" },
  1: { label: "Đã duyệt", color: "blue" },
  2: { label: "Xuất một phần", color: "cyan" },
  3: { label: "Hoàn thành", color: "green" },
  4: { label: "Từ chối", color: "red" },
  5: { label: "Đang picking", color: "purple" },

  6: { label: "Hết hàng", color: "volcano" },
  7: { label: "Không đủ hàng", color: "gold" },
  8: { label: "Đã Pick đủ", color: "geekblue" },
};

export default function GoodsIssueList() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [filterCode, setFilterCode] = useState("");
  const [filterStatus, setFilterStatus] = useState<number | null>(null);

  const [selectedGIId, setSelectedGIId] =
    useState<string | null>(null);

  const [openDetail, setOpenDetail] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  // ===== LOAD =====
  useEffect(() => {
    fetchGIs();
  }, []);

  // ===== FETCH =====
  const fetchGIs = async () => {
    setLoading(true);

    try {
      const res = await outboundApi.queryGoodsIssues({
        status: undefined, // Or pass relevant status
      });

      const filtered = (res.data || []).filter(
        (x: any) => x.type === GIType.Production
      );

      setList(filtered);
    } catch {
      message.error("Không tải được danh sách GI");
    } finally {
      setLoading(false);
    }
  };

  // ===== APPROVE =====
  const approveGI = async (id: string) => {
    try {
      await outboundApi.approveGI(id);

      // update UI ngay
      setList((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
              ...x,
              status: GIStatus.Approved,
            }
            : x
        )
      );

      message.success("Duyệt GI thành công");

      // sync backend
      setTimeout(() => {
        fetchGIs();
      }, 500);
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ||
        "Approve thất bại"
      );
    }
  };

  // ===== UPDATE STATUS =====
  const updateStatus = async (
    id: string,
    status: number
  ) => {
    try {
      await outboundApi.updateGIStatus(id, status);

      // update UI ngay
      setList((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
              ...x,
              status,
            }
            : x
        )
      );

      message.success("Cập nhật trạng thái thành công");

      setTimeout(() => {
        fetchGIs();
      }, 300);
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ||
        "Cập nhật trạng thái thất bại"
      );
    }
  };

  // ===== OPEN DETAIL =====
  const openDetailModal = (gi: any) => {
    setSelectedGIId(gi.id);
    setOpenDetail(true);
  };

  // ===== TABLE COLUMNS =====
  const columns = [
    {
      title: "Mã GI",
      dataIndex: "code",
    },

    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (s: number) => {
        const info = StatusMap[s];

        return (
          <Tag color={info?.color}>
            {info?.label || "Không xác định"}
          </Tag>
        );
      },
    },

    {
      title: "Ngày tạo ",
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
      }
    },

    {
      title: "Hành động",
      render: (_: any, r: any) => {
        switch (r.status) {
          case GIStatus.Pending:
            return (
              <Space wrap>
                <Popconfirm
                  title={`Duyệt GI ${r.code}?`}
                  onConfirm={() => approveGI(r.id)}
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button type="primary" size="small">Duyệt</Button>
                </Popconfirm>

                <Popconfirm
                  title="Xác nhận từ chối phiếu xuất?"
                  onConfirm={() => updateStatus(r.id, GIStatus.Rejected)}
                  okText="Từ chối"
                  cancelText="Hủy"
                >
                  <Button danger size="small">Từ chối</Button>
                </Popconfirm>

                <Button size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(r)}>
                  Chi tiết
                </Button>
              </Space>
            );

          // ===== PICKING =====
          case GIStatus.Approved:
          case GIStatus.Partial:
          case GIStatus.Picking:
          case GIStatus.Picked:
            return (
              <Button
                type="primary"
                size="small"
                onClick={() =>
                  openDetailModal(r)
                }
              >
                Picking / Xuất
              </Button>
            );

          // ===== COMPLETE =====
          case GIStatus.Completed:
            return (
              <Space wrap>

                <Button size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(r)}>Chi tiết</Button>
              </Space>
            );

          // ===== OUT OF STOCK =====
          case GIStatus.OutOfStock:
            return (
              <Space wrap>
                <Tag color="volcano">Hết hàng</Tag>
                <Button size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(r)}>Chi tiết</Button>
              </Space>
            );

          // ===== INSUFFICIENT =====
          case GIStatus.InsufficientStock:
            return (
              <Space wrap>
                <Tag color="gold">Không đủ hàng</Tag>
                <Button size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(r)}>Chi tiết</Button>
              </Space>
            );

          // ===== REJECT =====
          case GIStatus.Rejected:
            return (
              <Space wrap>
                <Tag color="red">Đã từ chối</Tag>
                <Button size="small" icon={<EyeOutlined />} onClick={() => openDetailModal(r)}>Chi tiết</Button>
              </Space>
            );

          // ===== DEFAULT =====
          default:
            return (
              <Button
                size="small"
                onClick={() =>
                  openDetailModal(r)
                }
              >
                Xem
              </Button>
            );
        }
      },
    },
  ];

  const filteredList = list.filter((gi) => {
    let match = true;
    if (filterCode && !gi.code.toLowerCase().includes(filterCode.toLowerCase())) match = false;
    if (filterStatus !== null && gi.status !== filterStatus) match = false;
    return match;
  }).sort((a, b) => {
    const dateA = a.createdAt || a.issuedAt;
    const dateB = b.createdAt || b.issuedAt;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div>
      {/* ===== ACTIONS ===== */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <h2>Phiếu xuất</h2>
        <Button
          type="primary"
          onClick={() => setOpenCreate(true)}
        >
          Tạo GI sản xuất
        </Button>
      </div>

      {/* FILTER SECTION */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <Input
          placeholder="Tìm theo mã phiếu xuất..."
          value={filterCode}
          onChange={(e) => setFilterCode(e.target.value)}
          style={{ width: 250 }}
          prefix={<SearchOutlined />}
          allowClear
        />
        <Select
          placeholder="Trạng thái"
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 180 }}
          allowClear
        >
          <Select.Option value={0}>Chờ xử lý</Select.Option>
          <Select.Option value={1}>Đã duyệt</Select.Option>
          <Select.Option value={2}>Xuất một phần</Select.Option>
          <Select.Option value={3}>Hoàn thành</Select.Option>
          <Select.Option value={4}>Từ chối</Select.Option>
          <Select.Option value={5}>Đang picking</Select.Option>
          <Select.Option value={6}>Hết hàng</Select.Option>
          <Select.Option value={7}>Không đủ hàng</Select.Option>
          <Select.Option value={8}>Đã Pick đủ</Select.Option>
        </Select>
      </div>

      {/* ===== TABLE ===== */}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={filteredList}
        columns={columns}
        pagination={{
          pageSize: 10,
        }}
      />

      {/* ===== DETAIL ===== */}
      {selectedGIId && (
        <GoodsIssueDetailModal
          open={openDetail}
          goodsIssueId={selectedGIId}
          onClose={() => setOpenDetail(false)}
          onActionSuccess={fetchGIs}
        />
      )}

      {/* ===== CREATE ===== */}
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
