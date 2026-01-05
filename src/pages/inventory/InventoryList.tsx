import { Button, message, Select, Typography, Input } from "antd";
import { useEffect, useState, useCallback } from "react";
import { SearchOutlined, PlusOutlined, HistoryOutlined } from "@ant-design/icons";
import { inventoryApi } from "../../api/inventory.api";
import { warehouseApi } from "../../api/warehouse.api";
import { locationApi } from "../../api/location.api";
import InventoryAdjustForm from "./InventoryAdjustForm";
import PageHeader from "../../components/PageHeader"; // Dùng chung component
import WmsTable from "../../components/Wmstable";    // Dùng chung component
import type { InventoryDto } from "../../types/inventory";
import InventoryHistoryModal from "./InventoryHistory"; 

const { Text } = Typography;

export default function InventoryList() {
  const [data, setData] = useState<InventoryDto[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>();
  const [locationId, setLocationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>();

  const [warehouses, setWarehouses] = useState<{ label: string; value: string }[]>([]);
  const [locations, setLocations] = useState<{ label: string; value: string }[]>([]);

  // Load danh sách kho
  useEffect(() => {
    warehouseApi.query(1, 100).then((res) => {
      setWarehouses(res.data.items.map((w: any) => ({ label: w.name, value: w.id })));
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryApi.query({ warehouseId, locationId });
      setData(res.data);
    } catch {
      message.error("Lỗi tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  }, [warehouseId, locationId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleWarehouseChange = async (id?: string) => {
    setWarehouseId(id);
    setLocationId(undefined);
    if (!id) {
      setLocations([]);
      return;
    }
    const res = await locationApi.list(id);
    setLocations(res.data.map((l: any) => ({ label: l.code, value: l.id })));
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Quản lý tồn kho"
        button={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => setIsAdjustOpen(true)}
          >
            Điều chỉnh kho
          </Button>
        }
      />

      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <Select
          placeholder="Chọn Kho"
          allowClear
          style={{ width: 220 }}
          options={warehouses}
          onChange={handleWarehouseChange}
        />
        <Select
          placeholder="Vị trí"
          allowClear
          style={{ width: 180 }}
          options={locations}
          value={locationId}
          onChange={setLocationId}
          disabled={!warehouseId}
        />
        <Button 
          type="primary" 
          icon={<SearchOutlined />} 
          onClick={fetchData}
        >
          Lọc
        </Button>
      </div>

      <WmsTable
        loading={loading}
        dataSource={data}
        rowKey={(record: InventoryDto) => `${record.productId}-${record.locationId}`}
        scroll={{ x: 1000 }}
        columns={[
          {
            title: "Mã sản phẩm",
            dataIndex: "productId",
            render: (id: string) => <Text strong>{id}</Text>,
          },
          {
            title: "Vị trí",
            dataIndex: "locationCode",
            render: (code: string, record: any) => code || record.locationId,
          },
          {
            title: "Thực tồn",
            dataIndex: "onHandQuantity",
            align: "right",
            width: 120,
          },
          {
            title: "Tạm khóa",
            dataIndex: "lockedQuantity",
            align: "right",
            width: 120,
            render: (v: number) => <Text type="danger">{v}</Text>
          },
          {
            title: "Khả dụng",
            dataIndex: "availableQuantity",
            align: "right",
            width: 120,
            render: (v: number) => <Text type="success" strong>{v}</Text>
          },
          {
      title: "Hành động",
      width: 120,
      fixed: "right" as const,
      align: "center" as const,
      render: (_: any, record: InventoryDto) => (
        <Button 
          size="small" 
          icon={<HistoryOutlined />}
          onClick={() => {
  // Thêm String() để chuyển số thành chuỗi
  setSelectedProductId(String(record.productId)); 
  setIsHistoryOpen(true);
}}
        >
          Lịch sử
        </Button>
      ),
    },
        ]}
      />

      <InventoryAdjustForm 
        open={isAdjustOpen} 
        onClose={() => setIsAdjustOpen(false)} 
        onSuccess={() => {
          setIsAdjustOpen(false);
          fetchData();
        }}
      />
      {/* Modal lịch sử (mới thêm) */}
      <InventoryHistoryModal 
        open={isHistoryOpen}
        productId={selectedProductId}
        onCancel={() => setIsHistoryOpen(false)}
      />
    </div>
  );
}