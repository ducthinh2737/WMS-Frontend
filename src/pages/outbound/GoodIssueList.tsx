import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
} from "antd";
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
};

export default function GoodsIssueList() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
      title: "Ngày xuất",
      dataIndex: "issuedAt",
      render: (d: string | null) =>
        d
          ? new Date(d).toLocaleString("vi-VN")
          : "-",
    },

    {
      title: "Hành động",
      render: (_: any, r: any) => {
        switch (r.status) {
          // ===== PENDING =====
          case GIStatus.Pending:
            return (
              <Space wrap>
                <Popconfirm
                  title={`Duyệt GI ${r.code}?`}
                  onConfirm={() => approveGI(r.id)}
                  okText="Duyệt"
                  cancelText="Hủy"
                >
                  <Button
                    type="primary"
                    size="small"
                  >
                    Duyệt
                  </Button>
                </Popconfirm>

                <Button
                  danger
                  size="small"
                  onClick={() =>
                    updateStatus(
                      r.id,
                      GIStatus.OutOfStock
                    )
                  }
                >
                  Hết hàng
                </Button>

                <Button
                  size="small"
                  onClick={() =>
                    updateStatus(
                      r.id,
                      GIStatus.InsufficientStock
                    )
                  }
                >
                  Không đủ hàng
                </Button>
              </Space>
            );

          // ===== PICKING =====
          case GIStatus.Approved:
          case GIStatus.Partial:
          case GIStatus.Picking:
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
              <Tag color="green">
                Hoàn thành
              </Tag>
            );

          // ===== OUT OF STOCK =====
          case GIStatus.OutOfStock:
            return (
              <Tag color="volcano">
                Hết hàng
              </Tag>
            );

          // ===== INSUFFICIENT =====
          case GIStatus.InsufficientStock:
            return (
              <Tag color="gold">
                Không đủ hàng
              </Tag>
            );

          // ===== REJECT =====
          case GIStatus.Rejected:
            return (
              <Tag color="red">
                Đã từ chối
              </Tag>
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

  return (
    <div>
      {/* ===== ACTIONS ===== */}
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={() => setOpenCreate(true)}
        >
          Tạo GI sản xuất
        </Button>
      </Space>

      {/* ===== TABLE ===== */}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
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
