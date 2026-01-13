import { Button, message, Select, Typography } from "antd";
import { useEffect, useState, useCallback } from "react";
import { SearchOutlined, PlusOutlined, HistoryOutlined } from "@ant-design/icons";
import { inventoryApi } from "../../api/inventory.api";
import { warehouseApi } from "../../api/warehouse.api";
import { locationApi } from "../../api/location.api";
import InventoryAdjustForm from "./InventoryAdjustForm";
import PageHeader from "../../components/PageHeader";
import WmsTable from "../../components/Wmstable";
import type { InventoryDto } from "../../types/inventory";
import InventoryHistoryModal from "./InventoryHistory"; 
import PutawayModal from "./PutawayModal";

const { Text } = Typography;

const LOCATION_TYPE_LABELS: Record<number, string> = {
  1: "Receiving",
  2: "Storage",
  3: "Shipping",
  4: "Damage",
  5: "Return",
  6: "Picking",
};

export default function InventoryList() {
  const [data, setData] = useState<InventoryDto[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>();
  const [locationId, setLocationId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>();
  const [isPutawayOpen, setIsPutawayOpen] = useState(false);
  
  // ⬅️ Thay đổi: Lưu cả productId và warehouseId
  const [putawayData, setPutawayData] = useState<{ 
    productId: number; 
    warehouseId: string 
  } | null>(null);

  const [warehouses, setWarehouses] = useState<{ label: string; value: string }[]>([]);
  const [locations, setLocations] = useState<{ label: string; value: string }[]>([]);

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

  // ⬅️ Handler mới cho Putaway
  const handleOpenPutaway = (record: InventoryDto) => {
    // Lấy warehouseId từ record hoặc từ filter
    const targetWarehouseId = record.warehouseId || warehouseId;
    
    if (!targetWarehouseId) {
      message.warning("Vui lòng chọn kho trước khi thực hiện Putaway!");
      return;
    }

    setPutawayData({
      productId: record.productId,
      warehouseId: targetWarehouseId
    });
    setIsPutawayOpen(true);
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
  sorter: (a: InventoryDto, b: InventoryDto) => a.productId - b.productId,
  sortDirections: ["ascend", "descend"],
  render: (id: number) => <Text strong>{id}</Text>,
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
            title: "Loại vị trí",
            dataIndex: "locationType",
            align: "center",
            width: 120,
            render: (type?: number) => LOCATION_TYPE_LABELS[type!] || "-",
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
  width: 180,
  fixed: "right" as const,
  align: "center" as const,
  render: (_: any, record: InventoryDto) => {
    const canPutaway =
      record.locationType === 1 && record.availableQuantity > 0;

    return (
      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
        <Button 
          size="small" 
          icon={<HistoryOutlined />}
          onClick={() => {
            setSelectedProductId(String(record.productId)); 
            setIsHistoryOpen(true);
          }}
        >
          Lịch sử
        </Button>

        {canPutaway && (
          <Button
            size="small"
            type="primary"
            onClick={() => handleOpenPutaway(record)}
          >
            Putaway
          </Button>
        )}
      </div>
    );
  },
}

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
      
      <InventoryHistoryModal 
        open={isHistoryOpen}
        productId={selectedProductId}
        onCancel={() => setIsHistoryOpen(false)}
      />
      
      {/* ⬅️ Sửa lại modal */}
      <PutawayModal
        open={isPutawayOpen}
        productId={putawayData?.productId ?? null}
        warehouseId={putawayData?.warehouseId}
        onClose={() => {
          setIsPutawayOpen(false);
          setPutawayData(null);
        }}
        onSuccess={() => {
          setIsPutawayOpen(false);
          setPutawayData(null);
          fetchData();
        }}
      />
    </div>
  );
}