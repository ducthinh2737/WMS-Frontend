import { Modal, message, Typography, Tag } from "antd";
import { useEffect, useState } from "react";
import { inventoryApi } from "../../api/inventory.api";
import WmsTable from "../../components/Wmstable";
import type { InventoryHistoryDto } from "../../types/inventory";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
  open: boolean;
  productId?: string;
  onCancel: () => void;
}

export default function InventoryHistoryModal({ open, productId, onCancel }: Props) {
  const [data, setData] = useState<InventoryHistoryDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && productId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          // Ép kiểu productId sang number nếu Backend yêu cầu number
          const res = await inventoryApi.history(Number(productId));
          setData(res.data);
        } catch {
          message.error("Không thể tải lịch sử tồn kho");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setData([]); // Reset dữ liệu khi đóng
    }
  }, [open, productId]);

  const columns = [
    { 
      title: "Ngày tạo", 
      dataIndex: "createdAt", 
      width: 160,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY HH:mm") 
    },
    { 
      title: "Loại", 
      dataIndex: "actionType", 
      width: 120,
      render: (v: string) => <Tag color="blue">{v}</Tag> 
    },
    {
      title: "Thay đổi",
      dataIndex: "quantityChange",
      align: "right" as const,
      width: 100,
      render: (v: number) => (
        <Text strong style={{ color: v > 0 ? "#52c41a" : "#f5222d" }}>
          {v > 0 ? `+${v}` : v}
        </Text>
      ),
    },
    { title: "Mã tham chiếu", dataIndex: "referenceCode", width: 130 },
    { title: "Ghi chú", dataIndex: "note", ellipsis: true },
  ];

  return (
    <Modal
      title={`Lịch sử biến động - Sản phẩm: ${productId}`}
      open={open}
      onCancel={onCancel}
      footer={null} // Chỉ xem, không cần nút OK/Cancel bên dưới
      width={800}
      centered
    >
      <WmsTable
        loading={loading}
        columns={columns}
        dataSource={data}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10 }}
        scroll={{ y: 400 }} // Giới hạn chiều cao để không bị tràn modal
      />
    </Modal>
  );
}
