import { useEffect, useState } from "react";
import {
  Button,
  Input,
  message,
  Popconfirm,
  Space,
  Tag,
  Typography,
  Select,
} from "antd";
import {
  LockOutlined,
  UnlockOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { warehouseApi } from "../../api/warehouse.api";
import WmsTable from "../../components/Wmstable";
import PageHeader from "../../components/PageHeader";
import { useNavigate } from "react-router-dom";
import type {
  WarehouseDto,
  WarehouseStatus,
  WarehouseType,
} from "../../types/warehouse";
import {
  normalizeWarehouseStatus,
  normalizeWarehouseType,
} from "../../utils/warehouse-normalize";

import WarehouseCreateModal from "./WarehouseCreate";
import WarehouseEditModal from "./WarehouseEdit";

const { Text } = Typography;

/* ===================== CONST ===================== */

const warehouseTypeMap: Record<
  WarehouseType,
  { label: string; color: string }
> = {
  RawMaterial: { label: "Kho nguyên liệu", color: "blue" },
  FinishedGoods: { label: "Kho thành phẩm", color: "green" },
  Auxiliary: { label: "Kho phụ liệu", color: "gold" },
  Chemical: { label: "Kho hóa chất", color: "red" },
};

const warehouseTypeOptions = [
  { value: "RawMaterial", label: "Kho nguyên liệu" },
  { value: "FinishedGoods", label: "Kho thành phẩm" },
  { value: "Auxiliary", label: "Kho phụ liệu" },
  { value: "Chemical", label: "Kho hóa chất" },
];

/* ===================== COMPONENT ===================== */

export default function WarehouseList() {
  const navigate = useNavigate();

  const [data, setData] = useState<WarehouseDto[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState("");
  const [warehouseTypeFilter, setWarehouseTypeFilter] =
    useState<WarehouseType | undefined>();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>();

  /* ===================== LOAD ===================== */

  const load = async () => {
    setLoading(true);
    try {
      const res = await warehouseApi.query(1, 0, search, "name", true);

      const normalized: WarehouseDto[] = res.data.items.map((w: any) => ({
        ...w,
        warehouseType: normalizeWarehouseType(w.warehouseType),
        status: normalizeWarehouseStatus(w.status),
      }));

      setData(normalized);
    } catch {
      message.error("Không tải được danh sách kho");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search]);

  /* ===================== HELPERS ===================== */

  const isWarehouseActive = (status?: WarehouseStatus) =>
    status === "Active";

  const getStatusTag = (status?: WarehouseStatus) => {
    if (!status) return <Tag>Không xác định</Tag>;

    switch (status) {
      case "Active":
        return <Tag color="green">Hoạt động</Tag>;
      case "Locked":
        return <Tag color="red">Đã khóa</Tag>;
      case "Maintenance":
        return <Tag color="orange">Bảo trì</Tag>;
      case "Inactive":
        return <Tag>Ngừng hoạt động</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  /* ===================== FILTER ===================== */

  const filteredData = data.filter((w) => {
    if (!warehouseTypeFilter) return true;
    return w.warehouseType === warehouseTypeFilter;
  });

  /* ===================== ACTIONS ===================== */

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
    await warehouseApi.delete(id);
    message.success("Đã xóa kho");
    load();
  };

  /* ===================== RENDER ===================== */

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Quản lý kho"
        button={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreateOpen(true)}
          >
            Tạo kho mới
          </Button>
        }
      />

      {/* SEARCH & FILTER */}
      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <Input.Search
          placeholder="Tìm kiếm kho..."
          style={{ width: 300 }}
          allowClear
          onSearch={(v) => {
            setSearch(v.trim());
            setPage(1);
          }}
        />

        <Select
          placeholder="Loại kho"
          allowClear
          style={{ width: 220 }}
          options={warehouseTypeOptions}
          value={warehouseTypeFilter}
          onChange={(value) => {
            setWarehouseTypeFilter(value);
            setPage(1);
          }}
        />
      </div>

      {/* TABLE */}
      <WmsTable
        loading={loading}
        dataSource={filteredData}
        rowKey="id"
        pagination={{
  current: page,
  pageSize,
  total: filteredData.length,
  onChange: (p: number, ps: number) => {
    setPage(p);
    setPageSize(ps);
  },
}}

        columns={[
          {
            title: "ID",
            dataIndex: "id",
            render: (id: string) => (
              <Text copyable type="secondary">
                {id.slice(0, 8)}
              </Text>
            ),
          },
          {
            title: "Mã kho",
            dataIndex: "code",
            render: (v: string) => <b>{v}</b>,
          },
          { title: "Tên kho", dataIndex: "name" },
          {
            title: "Loại kho",
            dataIndex: "warehouseType",
            align: "center",
            render: (type?: WarehouseType) => {
              if (!type) return <Tag>Không xác định</Tag>;
              const t = warehouseTypeMap[type];
              return <Tag color={t.color}>{t.label}</Tag>;
            },
          },
          { title: "Địa chỉ", dataIndex: "address" },
          {
            title: "Trạng thái",
            dataIndex: "status",
            align: "center",
            render: getStatusTag,
          },
          {
            title: "Hành động",
            fixed: "right",
            render: (_: any, record: WarehouseDto) => {
              const active = isWarehouseActive(record.status);
              return (
                <Space>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setSelectedId(record.id);
                      setIsEditOpen(true);
                    }}
                  >
                    Sửa
                  </Button>

                  {active ? (
                    <Popconfirm
                      title="Khóa kho này?"
                      onConfirm={() => handleLock(record.id)}
                    >
                      <Button danger size="small" icon={<LockOutlined />}>
                        Khóa
                      </Button>
                    </Popconfirm>
                  ) : (
                    <Popconfirm
                      title="Mở khóa?"
                      onConfirm={() => handleUnlock(record.id)}
                    >
                      <Button size="small" icon={<UnlockOutlined />}>
                        Mở
                      </Button>
                    </Popconfirm>
                  )}

                  <Button
                    size="small"
                    type="dashed"
                    icon={<EnvironmentOutlined />}
                    disabled={!active}
                    onClick={() =>
                      navigate(`/warehouse/${record.id}/locations`)
                    }
                  >
                    Vị trí
                  </Button>

                  <Popconfirm
                    title="Xóa kho?"
                    onConfirm={() => handleDelete(record.id)}
                  >
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                </Space>
              );
            },
          },
        ]}
      />

      {/* MODALS */}
      <WarehouseCreateModal
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          load();
        }}
      />

      <WarehouseEditModal
        open={isEditOpen}
        warehouseId={selectedId}
        onCancel={() => setIsEditOpen(false)}
        onSuccess={() => {
          setIsEditOpen(false);
          load();
        }}
      />
    </div>
  );
}
