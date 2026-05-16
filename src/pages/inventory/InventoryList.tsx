import {
  Button,
  message,
  Select,
  Typography,
  Tag,
  Tooltip,
} from "antd";
import { useEffect, useState, useCallback } from "react";
import {
  SearchOutlined,
  PlusOutlined,
  HistoryOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

import { inventoryApi } from "../../api/inventory.api";
import { warehouseApi } from "../../api/warehouse.api";
import { locationApi } from "../../api/location.api";

import InventoryAdjustForm from "./InventoryAdjustForm";
import PageHeader from "../../components/PageHeader";
import InventoryLockActions from "./InventoryLockAction";
import WmsTable from "../../components/Wmstable";
import type { InventoryDto } from "../../types/inventory";
import InventoryHistoryModal from "./InventoryHistory";
import PutawayModal from "./PutawayModal";

import dayjs from "dayjs";

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

  const [putawayData, setPutawayData] = useState<{
    productId: number;
    warehouseId: string;
    fromLocationId: string;
    lotId: string;
    maxQty: number;
    toLocationId?: string;
  } | null>(null);

  const [warehouses, setWarehouses] = useState<
    { label: string; value: string }[]
  >([]);

  const [locations, setLocations] = useState<
    { label: string; value: string }[]
  >([]);

  // =========================
  // LOAD WAREHOUSE
  // =========================
  useEffect(() => {
    warehouseApi.query(1, 10000).then((res) => {
      setWarehouses(
        res.data.items.map((w: any) => ({
          label: w.name,
          value: w.id,
        }))
      );
    });
  }, []);

  // =========================
  // FETCH INVENTORY
  // =========================
  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await inventoryApi.query({
        warehouseId,
        locationId,
      });

      setData(res.data);
    } catch {
      message.error("Lỗi tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  }, [warehouseId, locationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =========================
  // CHANGE WAREHOUSE
  // =========================
  const handleWarehouseChange = async (id?: string) => {
    setWarehouseId(id);

    setLocationId(undefined);

    if (!id) {
      setLocations([]);
      return;
    }

    const res = await locationApi.list(id);

    setLocations(
      res.data.map((l: any) => ({
        label: l.code,
        value: l.id,
      }))
    );
  };

  // =========================
  // OPEN PUTAWAY
  // =========================
  const handleOpenPutaway = (record: InventoryDto) => {
    const targetWarehouseId = record.warehouseId || warehouseId;

    if (!targetWarehouseId) {
      message.warning("Vui lòng chọn kho trước khi Putaway");
      return;
    }

    setPutawayData({
      productId: record.productId,
      warehouseId: targetWarehouseId,
      fromLocationId: record.locationId,
      lotId: record.lotId,
      maxQty: record.availableQuantity,
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

      {/* FILTER */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 8,
        }}
      >
        <Select
          placeholder="Tìm kho theo tên..."
          allowClear
          showSearch
          style={{ width: 220 }}
          options={warehouses}
          onChange={handleWarehouseChange}
          optionFilterProp="label"
          filterOption={(input, option) =>
            (option?.label ?? "")
              .toString()
              .toLowerCase()
              .includes(input.toLowerCase())
          }
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

      {/* TABLE */}
      <WmsTable
        loading={loading}
        dataSource={data}
        rowKey={(record: InventoryDto) => record.id}
        scroll={{ x: 1300 }}
        expandable={{
          expandedRowRender: (record: InventoryDto) => (
            <InventoryLockActions
              record={record}
              onSuccess={fetchData}
            />
          ),

          rowExpandable: (record: InventoryDto) =>
            record.availableQuantity > 0 ||
            record.lockedQuantity > 0,
        }}
        columns={[
          {
            title: "Sản phẩm",
            key: "product",
            width: 220,
            fixed: "left",

            render: (_: any, record: InventoryDto) => (
              <div>
                <Text strong>{record.productName}</Text>

                <br />

                <Text
                  type="secondary"
                  style={{ fontSize: "12px" }}
                >
                  SKU: {record.productCode}
                </Text>
              </div>
            ),
          },

          {
            title: "Số Lô (Lot)",
            dataIndex: "lotCode",
            width: 150,

            render: (lot: string, record: InventoryDto) => (
              <div>
                <Tag
                  color="cyan"
                  style={{ fontWeight: "bold" }}
                >
                  {lot || "N/A"}
                </Tag>

                {record.expiryDate &&
                  record.expiryDate !==
                    "1900-12-31T16:53:30" && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#888",
                        marginTop: 4,
                      }}
                    >
                      <CalendarOutlined />{" "}
                      {dayjs(record.expiryDate).format(
                        "DD/MM/YYYY"
                      )}
                    </div>
                  )}
              </div>
            ),
          },

          {
            title: "Vị trí / Kho",
            key: "location_warehouse",
            width: 200,

            render: (_: any, record: InventoryDto) => (
              <div>
                <Tag color="blue">{record.locationCode}</Tag>

                <div
                  style={{
                    fontSize: "12px",
                    marginTop: 4,
                  }}
                >
                  <Text type="secondary">
                    {record.warehouseName}
                  </Text>
                </div>
              </div>
            ),
          },

          {
            title: "Loại vị trí",
            dataIndex: "locationType",
            align: "center",
            width: 120,

            render: (type?: number) => {
              const label =
                LOCATION_TYPE_LABELS[type!] || "-";

              const color =
                type === 1 ? "gold" : "default";

              return <Tag color={color}>{label}</Tag>;
            },
          },

          {
            title: "Thực tồn",
            dataIndex: "onHandQuantity",
            align: "right",
            width: 100,

            render: (v: number) => (
              <strong>{v.toLocaleString()}</strong>
            ),
          },

          {
            title: "Khả dụng",
            dataIndex: "availableQuantity",
            align: "right",
            width: 100,

            render: (v: number) => (
              <Text type="success" strong>
                {v.toLocaleString()}
              </Text>
            ),
          },

          {
            title: "Hành động",
            width: 180,
            fixed: "right",
            align: "center",

            render: (_: any, record: InventoryDto) => {
              const canPutaway =
                record.locationType === 1 &&
                record.availableQuantity > 0;

              return (
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    justifyContent: "center",
                  }}
                >
                  <Tooltip title="Xem lịch sử">
                    <Button
                      size="small"
                      icon={<HistoryOutlined />}
                      onClick={() => {
                        setSelectedProductId(
                          String(record.productId)
                        );

                        setIsHistoryOpen(true);
                      }}
                    />
                  </Tooltip>

                  {canPutaway && (
                    <Button
                      size="small"
                      type="primary"
                      onClick={() =>
                        handleOpenPutaway(record)
                      }
                    >
                      Putaway
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]}
      />

      {/* ADJUST */}
      <InventoryAdjustForm
        open={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        onSuccess={() => {
          setIsAdjustOpen(false);
          fetchData();
        }}
      />

      {/* HISTORY */}
      <InventoryHistoryModal
        open={isHistoryOpen}
        productId={selectedProductId}
        onCancel={() => setIsHistoryOpen(false)}
      />

      {/* PUTAWAY */}
      <PutawayModal
        open={isPutawayOpen}
        productId={putawayData?.productId ?? null}
        warehouseId={putawayData?.warehouseId}
        fromLocationId={putawayData?.fromLocationId}
        lotId={putawayData?.lotId}
        maxQty={putawayData?.maxQty}
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
