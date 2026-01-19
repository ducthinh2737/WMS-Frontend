import {
  Table,
  Tag,
  Button,
  Space,
  Card,
  message,
  Modal,
  Descriptions,
  Divider
} from "antd";
import {
  CheckCircleOutlined,
  EyeOutlined,
  SwapOutlined,
  PlusOutlined
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { transferApi } from "../../api/transfer.api";
import type { TransferOrderDto, TransferOrderItemDto } from "../../types/transfer";
import dayjs from "dayjs";
import TransferCreateForm from "./TransferCreate";

export default function TransferList() {
  const [data, setData] = useState<TransferOrderDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Detail modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await transferApi.query();
      setData(res.data);
    } catch {
      message.error("Không thể tải danh sách phiếu chuyển kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const showDetail = async (id: string) => {
    try {
      const res = await transferApi.get(id);
      setSelectedOrder(res.data);
      setIsDetailOpen(true);
    } catch {
      message.error("Không thể lấy thông tin chi tiết");
    }
  };

  const handleApprove = (id: string) => {
    Modal.confirm({
      title: "Xác nhận duyệt phiếu chuyển kho",
      content:
        "Hệ thống sẽ thực hiện trừ tồn kho ở vị trí nguồn và cộng vào vị trí đích. Bạn có chắc chắn không?",
      okText: "Duyệt ngay",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await transferApi.approve(id);
          message.success("Duyệt phiếu chuyển kho thành công!");
          fetchTransfers();
        } catch (error: any) {
          message.error(
            error.response?.data?.message || "Lỗi khi duyệt phiếu"
          );
        }
      }
    });
  };

  const columns = [
    {
      title: "Mã phiếu",
      dataIndex: "code",
      render: (text: string) => <b>{text}</b>
    },
    {
      title: "Từ kho",
      dataIndex: "fromWarehouseName"
    },
    {
      title: "Đến kho",
      dataIndex: "toWarehouseName"
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm")
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: string) => {
        const color =
          status === "Approved"
            ? "green"
            : status === "Cancelled"
            ? "red"
            : "blue";
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      }
    },
    {
      title: "Thao tác",
      render: (_: any, record: any) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => showDetail(record.id)}
          >
            Chi tiết
          </Button>

          {record.status === "Draft" && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              style={{ backgroundColor: "#52c41a", border: "none" }}
              onClick={() => handleApprove(record.id)}
            >
              Duyệt
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card
      title={
        <Space>
          <SwapOutlined />
          Quản lý lệnh chuyển kho
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateOpen(true)}
        >
          Tạo phiếu
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      {/* ===== MODAL CREATE ===== */}
      <Modal
        title="Tạo phiếu chuyển kho"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        footer={null}
        width={1000}
        destroyOnClose
      >
        <TransferCreateForm
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchTransfers();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>

      {/* ===== MODAL DETAIL ===== */}
      <Modal
        title={`Chi tiết phiếu: ${selectedOrder?.code || ""}`}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setIsDetailOpen(false)}>
            Đóng
          </Button>
        ]}
      >
        {selectedOrder && (
          <>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Mã phiếu">
                {selectedOrder.code}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag
                  color={
                    selectedOrder.status === "Approved" ? "green" : "blue"
                  }
                >
                  {selectedOrder.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Từ Kho">
                {selectedOrder.fromWarehouseName}
              </Descriptions.Item>
              <Descriptions.Item label="Đến Kho">
                {selectedOrder.toWarehouseName}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú" span={2}>
                {selectedOrder.note || "---"}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation= {"left" as any}>Danh sách mặt hàng</Divider>

            <Table
              dataSource={selectedOrder.items}
              pagination={false}
              size="small"
              rowKey={(r: TransferOrderItemDto) =>
                `${r.productId}-${r.fromLocationId}`
              }
              columns={[
                { title: "SP", dataIndex: "productId" },
                { title: "Vị trí đi", dataIndex: "fromLocationId" },
                { title: "Vị trí đến", dataIndex: "toLocationId" },
                {
                  title: "Số lượng",
                  dataIndex: "quantity",
                  render: (v) => <b style={{ color: "#1890ff" }}>{v}</b>
                },
                { title: "Ghi chú", dataIndex: "note" }
              ]}
            />
          </>
        )}
      </Modal>
    </Card>
  );
}
