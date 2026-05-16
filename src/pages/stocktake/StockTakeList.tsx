import { Table, Tag, Button, Space, Card, message } from "antd";
import { PlayCircleOutlined, EditOutlined, PlusOutlined, EyeOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { stockTakeApi } from "../../api/stocktake.api";
import CreateStockTakeModal from "./CreateStockTakeModal";
import dayjs from "dayjs";
// FIX: Import Type để định nghĩa dữ liệu cho State
import type { StockTakeDto } from "../../types/stocktake";

export default function StockTakeList() {
  // FIX: Định nghĩa kiểu dữ liệu là StockTakeDto[] thay vì để tự suy luận thành never[]
  const [data, setData] = useState<StockTakeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await stockTakeApi.query();
      // FIX: Kiểm tra nếu data trả về là object có items (do phân trang) hoặc mảng trực tiếp
      const result = Array.isArray(res.data) ? res.data : (res.data as any).items;
      setData(result || []);
    } catch (err) {
      message.error("Không thể tải danh sách kiểm kê");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleStart = async (id: string) => {
    try {
      await stockTakeApi.start(id);
      message.success("Đã chốt số liệu snapshot!");
      fetchList();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Lỗi khi bắt đầu kiểm kê");
    }
  };

  const columns = [
    { 
      title: "Mã phiếu", 
      dataIndex: "code", 
      key: "code",
      render: (text: string) => <strong style={{ color: '#1890ff' }}>{text}</strong>
    },
    { title: "Kho", dataIndex: "warehouseName", key: "warehouseName" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: string) => {
        let color = "default";
        if (s === "Completed") color = "green";
        if (s === "InProgress") color = "orange";
        if (s === "Draft") color = "blue";
        return (
          <Tag color={color} style={{ fontWeight: 'bold' }}>
            {s?.toUpperCase()}
          </Tag>
        );
      }
    },
    { 
      title: "Ngày tạo", 
      dataIndex: "createdAt", 
      key: "createdAt",
      render: (d: any) => dayjs(d).format("DD/MM/YYYY HH:mm") 
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: StockTakeDto) => (
        <Space>
          {record.status === "Draft" && (
            <Button 
              type="primary" 
              size="small" 
              icon={<PlayCircleOutlined />} 
              onClick={() => handleStart(record.id)}
            >
              Bắt đầu
            </Button>
          )}
          
          {record.status === "InProgress" && (
            <Button 
              danger 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/stocktake/counting/${record.id}`)}
            >
              Kiểm đếm
            </Button>
          )}

          <Button 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/stocktake/counting/${record.id}`)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card 
      title="Quản lý Kiểm kê kho" 
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalOpen(true)}
        >
          Tạo phiếu mới
        </Button>
      }
    >
      <Table 
        dataSource={data} 
        columns={columns} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }} 
      />
      
      <CreateStockTakeModal 
        visible={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchList();
        }} 
      />
    </Card>
  );
}
