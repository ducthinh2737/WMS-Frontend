import { useEffect, useState } from "react";
import { Button, Popconfirm, message, Tag, Select, Spin, Empty, Typography, Space } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { locationApi } from "../../api/location.api";
import { warehouseApi } from "../../api/warehouse.api";
import WmsTable from "../../components/Wmstable";
import PageHeader from "../../components/PageHeader";
import { useParams } from "react-router-dom";
import type { LocationDto } from "../../types/location";

// Import các Modal thành phần
import LocationCreateModal from "./LocationCreate";
import LocationEditModal from "./LocationEdit";

const { Text } = Typography;

// Mapping nhãn và màu sắc cho Loại vị trí
export const LocationTypeLabels: Record<number, string> = {
  1: "Khu nhận hàng",
  2: "Khu lưu kho",
  3: "Khu xuất hàng",
  4: "Khu hàng lỗi",
  5: "Khu trả hàng",
};

export const LocationTypeColors: Record<number, string> = {
  1: "blue",
  2: "green",
  3: "purple",
  4: "red",
  5: "orange",
};

export default function LocationList() {
  // Lấy warehouseId từ URL nếu người dùng đi từ danh sách kho sang
  const { warehouseId: urlWarehouseId } = useParams<{ warehouseId: string }>();

  // States dữ liệu
  const [data, setData] = useState<LocationDto[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string; code: string }[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(urlWarehouseId);
  const [loading, setLoading] = useState(false);

  // States điều khiển Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>();

  // 1. Load danh sách kho để đổ vào Selectbox
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await warehouseApi.query(1, 10000);
        setWarehouses(res.data.items.map((w: any) => ({ 
          id: w.id, 
          name: w.name, 
          code: w.code 
        })));
      } catch (err) {
        message.error("Không thể tải danh sách kho");
      }
    };
    fetchWarehouses();
  }, []);

  // 2. Load danh sách vị trí dựa trên kho được chọn
  const loadLocations = async () => {
    if (!selectedWarehouseId) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const res = await locationApi.list(selectedWarehouseId);
      setData(res.data);
    } catch (err) {
      message.error("Lỗi tải danh sách vị trí lưu trữ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [selectedWarehouseId]);

  // 3. Xử lý xóa vị trí
  const handleDelete = async (id: string) => {
    try {
      await locationApi.delete(selectedWarehouseId!, id);
      message.success("Đã xóa vị trí thành công");
      loadLocations();
    } catch (err) {
      message.error("Xóa thất bại. Vị trí có thể đang chứa hàng.");
    }
  };

  const currentWarehouse = warehouses.find(w => w.id === selectedWarehouseId);

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title={currentWarehouse ? `Vị trí: ${currentWarehouse.name}` : "Vị trí lưu trữ"}
        button={
          selectedWarehouseId && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setIsCreateOpen(true)}
            >
              Thêm vị trí mới
            </Button>
          )
        }
      />

      <div style={{ marginBottom: 20, background: '#f5f5f5', padding: '12px 16px', borderRadius: 8 }}>
        <Space size="large">
          <Space>
            <Text strong>Kho quản lý:</Text>
            <Select
              showSearch
              placeholder="Chọn kho để xem vị trí..."
              value={selectedWarehouseId}
              onChange={setSelectedWarehouseId}
              style={{ width: 350 }}
              options={warehouses.map(w => ({ 
                value: w.id, 
                label: `[${w.code}] ${w.name}` 
              }))}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Space>
          {currentWarehouse && (
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              Mã hệ thống: {currentWarehouse.id}
            </Tag>
          )}
        </Space>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin tip="Đang tải dữ liệu vị trí..." size="large" />
        </div>
      ) : !selectedWarehouseId ? (
        <Empty description="Vui lòng chọn một kho để bắt đầu quản lý vị trí lưu trữ" />
      ) : (
        <WmsTable
          dataSource={data}
          rowKey="id"
          scroll={{ x: 1000 }}
          columns={[
            {
              title: "Mã vị trí",
              dataIndex: "code",
              width: 180,
              fixed: "left",
              sorter: (a: LocationDto, b: LocationDto) => a.code.localeCompare(b.code),
              render: (code: string) => <Text copyable strong>{code}</Text>
            },
            {
              title: "Phân loại",
              dataIndex: "type",
              width: 150,
              render: (type: number) => (
                <Tag color={LocationTypeColors[type] || "default"}>
                  {LocationTypeLabels[type] || "Không xác định"}
                </Tag>
              )
            },
            {
              title: "Trạng thái",
              dataIndex: "isActive",
              width: 150,
              align: "center",
              render: (active: boolean) => (
                <Tag color={active ? "success" : "error"}>
                  {active ? "Đang hoạt động" : "Ngừng sử dụng"}
                </Tag>
              )
            },
            {
              title: "Mô tả / Ghi chú",
              dataIndex: "description",
              ellipsis: true,
              render: (text: string) => text || <Text type="secondary">---</Text>
            },
            {
              title: "Thao tác",
              width: 160,
              fixed: "right",
              align: "center",
              render: (_: any, record: LocationDto) => (
                <Space>
                  <Button 
                    type="link" 
                    size="small" 
                    icon={<EditOutlined />}
                    onClick={() => {
                      setSelectedLocationId(record.id);
                      setIsEditOpen(true);
                    }}
                  >
                    Sửa
                  </Button>
                  <Popconfirm 
                    title="Xác nhận xóa vị trí?" 
                    description="Dữ liệu đã xóa sẽ không thể khôi phục."
                    onConfirm={() => handleDelete(record.id)}
                    okText="Xóa"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                      Xóa
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      )}

      {/* Modal Thêm mới */}
      {selectedWarehouseId && (
        <LocationCreateModal
          open={isCreateOpen}
          warehouseId={selectedWarehouseId}
          onCancel={() => setIsCreateOpen(false)}
          onSuccess={() => { 
            setIsCreateOpen(false); 
            loadLocations(); 
          }}
        />
      )}

      {/* Modal Chỉnh sửa */}
      {selectedWarehouseId && selectedLocationId && (
        <LocationEditModal
          open={isEditOpen}
          warehouseId={selectedWarehouseId}
          locationId={selectedLocationId}
          onCancel={() => {
            setIsEditOpen(false);
            setSelectedLocationId(undefined);
          }}
          onSuccess={() => {
            setIsEditOpen(false);
            loadLocations();
          }}
        />
      )}
    </div>
  );
}
