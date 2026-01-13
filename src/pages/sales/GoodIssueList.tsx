import { Card, Table, Button, Tag, Space, message, Modal } from "antd";
import { useEffect, useState } from "react";
import { salesApi } from "../../api/sale.api";
import GoodsIssueDetailModal from "./GoodsIssueDetailModal"; // component modal
// Map status number → label + màu
const statusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Pending", color: "default" },
  1: { label: "Approved", color: "green" },
  2: { label: "Partially Issued", color: "orange" },
  3: { label: "Complete", color: "blue" },
  4: { label: "Rejected", color: "red" },
  5: { label: "Picking", color: "purple" },
};

interface GoodsIssue {
  id: string;
  code: string;
  salesOrderId: string;
  salesOrderCode?: string;
  warehouseId: string;
  warehouseName?: string;
  status: number;
  issuedAt: string;
  createAt: string;
  items: any[];
}

export default function GoodsIssueList() {
  const [list, setList] = useState<GoodsIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // State modal
  const [selectedGIId, setSelectedGIId] = useState<string | null>(null);

  const loadList = async (params: { page?: number; pageSize?: number } = {}) => {
    const { page = 1, pageSize = 10 } = params;
    try {
      setLoading(true);
      const res = await salesApi.queryGI({ pageIndex: page, pageSize });
      const data = res.data?.items || res.data || [];
      const total = res.data?.total || data.length;
      setList(data);
      setPagination({ current: page, pageSize, total });
    } catch (err) {
      message.error("Không thể tải danh sách phiếu xuất kho");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleTableChange = (paginationInfo: any) => {
    loadList({
      page: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    });
  };

  const getStatusTag = (status: number) => {
    const { label, color } = statusMap[status] || { label: "Unknown", color: "default" };
    return <Tag color={color}>{label}</Tag>;
  };

  const handleViewDetail = (record: GoodsIssue) => {
    setSelectedGIId(record.id); // mở modal
  };

  const handleModalClose = () => {
    setSelectedGIId(null); // đóng modal
  };

  const columns = [
    { title: "Mã phiếu", dataIndex: "code", width: 160 },
    {
      title: "Đơn hàng gốc",
      dataIndex: "salesOrderCode",
      width: 180,
      render: (code: string, record: GoodsIssue) =>
        code || `SO-${record.salesOrderId?.slice(0, 8) ?? "N/A"}...`,
    },
    {
      title: "Kho",
      dataIndex: "warehouseName",
      width: 180,
      render: (name: string, record: GoodsIssue) =>
        name || `WH-${record.warehouseId?.slice(0, 8) ?? "N/A"}...`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 140,
      render: getStatusTag,
    },
    {
      title: "Số lượng items",
      width: 140,
      align: "center" as const,
      render: (_: any, record: GoodsIssue) => record.items?.length || 0,
    },
    {
      title: "Ngày xuất",
      dataIndex: "issuedAt",
      width: 180,
      render: (val: string) => (val ? new Date(val).toLocaleString("vi-VN") : "N/A"),
    },
    {
      title: "Thao tác",
      width: 120,
      align: "center" as const,
      render: (_: any, record: GoodsIssue) => (
        <Space size="small">
          <Button type="link" onClick={() => handleViewDetail(record)}>
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Danh sách phiếu xuất kho">
      <Table
        columns={columns}
        dataSource={list}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total} phiếu`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1000 }}
      />

      {/* Modal chi tiết */}
      <Modal
        title="Chi tiết phiếu xuất kho"
        open={!!selectedGIId}
        onCancel={handleModalClose}
        footer={null}
        width={1200}
        destroyOnClose
      >
        {selectedGIId && (
          <GoodsIssueDetailModal
            goodsIssueId={selectedGIId}
            onClose={handleModalClose}
            onActionSuccess={() => {
              // reload lại danh sách khi có picking/issue
              loadList({ page: pagination.current, pageSize: pagination.pageSize });
            }}
          />
        )}
      </Modal>
    </Card>
  );
}
