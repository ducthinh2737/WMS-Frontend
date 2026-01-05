import { useEffect, useState } from "react";
import { 
  Button, 
  Input, 
  message, 
  Popconfirm, 
  Space, 
  Tag, 
  // Tooltip,  <-- Xóa cái này vì không dùng (Lỗi 6133)
  Typography 
} from "antd";
import { 
  LockOutlined, 
  UnlockOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EnvironmentOutlined, 
  PlusOutlined 
} from "@ant-design/icons";
import { warehouseApi } from "../../api/warehouse.api";
import WmsTable from "../../components/Wmstable";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import type { WarehouseDto } from "../../types/warehouse";

import WarehouseCreateModal from "./WarehouseCreate";
import WarehouseEditModal from "./WarehouseEdit";

const { Text } = Typography;

export default function WarehouseList() {
  const navigate = useNavigate();

  const [data, setData] = useState<WarehouseDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const load = async () => {
    setLoading(true);
    try {
      const res = await warehouseApi.query(page, pageSize, search);
      setData(res.data.items);
      setTotal(res.data.total);
    } catch {
      message.error("Không tải được danh sách kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, pageSize, search]);

  const handleLock = async (id: string) => {
    await warehouseApi.lock(id);
    message.success("Đã khóa kho");
    load();
  };

  const handleUnlock = async (id: string) => {
    await warehouseApi.unlock(id);
    message.success("Đã mở khóa kho");
    load();
  };

  const handleDelete = async (id: string) => {
    try {
      await warehouseApi.delete(id);
      message.success("Đã xóa kho");
      load();
    } catch {
      message.error("Không thể xóa kho");
    }
  };

  const isWarehouseActive = (status: any) => 
    typeof status === "string" ? status.toLowerCase() === "active" : status === 1;

  const getStatusTag = (status: any) => {
    const s = String(status).toLowerCase();
    if (s === "active" || status === 1) return <Tag color="green">Hoạt động</Tag>;
    if (s === "locked" || status === 3) return <Tag color="red">Đã khóa</Tag>;
    if (s === "maintenance" || status === 4) return <Tag color="orange">Bảo trì</Tag>;
    return <Tag color="default">{status}</Tag>;
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Quản lý kho"
        button={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            Tạo kho mới
          </Button>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Tìm kiếm kho..."
          style={{ width: 400 }}
          allowClear
          onSearch={(v) => { setSearch(v.trim()); setPage(1); }}
        />
      </div>

      <WmsTable
        loading={loading}
        dataSource={data}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total,
          // FIX LỖI 7006: Định nghĩa kiểu number cho p và ps
          onChange: (p: number, ps: number) => { 
            setPage(p); 
            setPageSize(ps); 
          },
        }}
        columns={[
          {
            title: "ID",
            dataIndex: "id",
            width: 100,
            render: (id: string) => <Text copyable={{ text: id }} type="secondary">{id.slice(0, 8)}</Text>,
          },
          { 
            title: "Mã kho", 
            dataIndex: "code", 
            width: 120, 
            // FIX LỖI 7006: Định nghĩa kiểu string cho v
            render: (v: string) => <b>{v}</b> 
          },
          { title: "Tên kho", dataIndex: "name", ellipsis: true },
          { title: "Địa chỉ", dataIndex: "address", ellipsis: true },
          { title: "Trạng thái", dataIndex: "status", width: 120, align: "center", render: getStatusTag },
          {
            title: "Hành động",
            width: 300,
            fixed: "right",
            // FIX LỖI 7006: Định nghĩa kiểu WarehouseDto cho record, _ dùng kiểu any
            render: (_: any, record: WarehouseDto) => {
              const active = isWarehouseActive(record.status);
              return (
                <Space size="middle">
                  <Button 
                    size="small" 
                    icon={<EditOutlined />} 
                    onClick={() => { setSelectedId(record.id); setIsEditOpen(true); }}
                  >
                    Sửa
                  </Button>

                  {active ? (
                    <Popconfirm title="Khóa kho này?" onConfirm={() => handleLock(record.id)}>
                      <Button danger size="small" icon={<LockOutlined />}>Khóa</Button>
                    </Popconfirm>
                  ) : (
                    <Popconfirm title="Mở khóa?" onConfirm={() => handleUnlock(record.id)}>
                      <Button size="small" icon={<UnlockOutlined />}>Mở</Button>
                    </Popconfirm>
                  )}

                  <Button
                    size="small"
                    type="dashed"
                    icon={<EnvironmentOutlined />}
                    onClick={() => navigate(`/warehouse/${record.id}/locations`)}
                    disabled={!active}
                  >
                    Vị trí
                  </Button>

                  <Popconfirm title="Xóa kho?" onConfirm={() => handleDelete(record.id)}>
                    <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]}
      />

      <WarehouseCreateModal 
        open={isCreateOpen} 
        onCancel={() => setIsCreateOpen(false)} 
        onSuccess={() => { setIsCreateOpen(false); load(); }} 
      />

      <WarehouseEditModal 
        open={isEditOpen} 
        warehouseId={selectedId} 
        onCancel={() => setIsEditOpen(false)} 
        onSuccess={() => { setIsEditOpen(false); load(); }} 
      />
    </div>
  );
}