import { useEffect, useState, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  Table,
  Typography,
  message,
  Pagination,
  Tag,
  Badge,
  Tabs,
  Spin,
  Divider,
  Tooltip,
  Empty,
} from "antd";
import {
  DatabaseOutlined,
  HomeOutlined,
  BoxPlotOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  ExperimentOutlined,
  GoldOutlined,
  FireOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { inventoryApi } from "../../api/inventory.api";
import { warehouseApi } from "../../api/warehouse.api";
import { salesApi } from "../../api/sale.api";
import { productApi } from "../../api/product.api";
import { purchaseApi } from "../../api/purchase.api";
import type { WarehouseDto, WarehouseType } from "../../types/warehouse";
import type { InventoryDto } from "../../types/inventory";

const { Text, Title } = Typography;
const { TabPane } = Tabs;

/* ===================== TYPES ===================== */

interface WarehouseInventorySummary {
  warehouseId: string;
  warehouseName: string;
  warehouseType: WarehouseType;
  totalQty: number;
  availableQty: number;
  lockedQty: number;
  inTransitQty: number;
  locationCount?: number;
  productCount: number;
}

interface WarehouseTypeGroup {
  type: WarehouseType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  warehouses: WarehouseInventorySummary[];
  totalQty: number;
  availableQty: number;
  lockedQty: number;
}

interface DashboardStats {
  totalProducts: number;
  totalWarehouses: number;
  totalInventory: number;
  availableInventory: number;
  lockedInventory: number;
  totalOrders: number;
  pendingOrders: number;
  totalSalesAmount: number;
  totalPOs: number;
  pendingPOs: number;
  totalGRs: number;
  pendingGRs: number;
}

/* ===================== CONSTANTS ===================== */

// FIX: dùng numeric keys (0|1|2|3) cho khớp với WarehouseType = 0 | 1 | 2 | 3
const WAREHOUSE_TYPE_CONFIG: Record<
  WarehouseType,
  { label: string; icon: React.ReactNode; color: string; bgColor: string; chartColor: string }
> = {
  0: {
    label: "Kho nguyên vật liệu",
    icon: <InboxOutlined />,
    color: "#1677ff",
    bgColor: "#e6f4ff",
    chartColor: "#1677ff",
  },
  1: {
    label: "Kho thành phẩm",
    icon: <GoldOutlined />,
    color: "#52c41a",
    bgColor: "#f6ffed",
    chartColor: "#52c41a",
  },
  2: {
    label: "Kho phụ liệu",
    icon: <BoxPlotOutlined />,
    color: "#fa8c16",
    bgColor: "#fff7e6",
    chartColor: "#fa8c16",
  },
  3: {
    label: "Kho hóa chất",
    icon: <ExperimentOutlined />,
    color: "#f5222d",
    bgColor: "#fff1f0",
    chartColor: "#f5222d",
  },
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "orange",
  Approved: "blue",
  Completed: "green",
  Rejected: "red",
  Processing: "cyan",
  Cancelled: "default",
};

const PIE_COLORS = ["#1677ff", "#52c41a", "#fa8c16", "#f5222d", "#722ed1", "#13c2c2"];

/* ===================== HELPERS ===================== */

const formatCurrency = (val: number) =>
  val.toLocaleString("vi-VN") + " đ";

const getStatusTag = (status: string) => (
  <Tag color={STATUS_COLORS[status] || "default"}>{status}</Tag>
);

/* ===================== STAT CARD ===================== */

interface StatCardProps {
  title: string;
  value: number | string;
  prefix?: React.ReactNode;
  suffix?: string;
  loading?: boolean;
  color?: string;
  trend?: { value: number; label: string };
  subValue?: string;
}

function StatCard({ title, value, prefix, suffix, loading, color, trend, subValue }: StatCardProps) {
  return (
    <Card
      loading={loading}
      style={{
        borderRadius: 12,
        border: "1px solid #f0f0f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {title}
          </Text>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: color || "#262626",
              marginTop: 4,
              lineHeight: 1.2,
            }}
          >
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix && (
              <span style={{ fontSize: 14, fontWeight: 400, color: "#8c8c8c", marginLeft: 4 }}>
                {suffix}
              </span>
            )}
          </div>
          {subValue && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 2, display: "block" }}>
              {subValue}
            </Text>
          )}
          {trend && (
            <div style={{ marginTop: 6 }}>
              {trend.value >= 0 ? (
                <Text style={{ color: "#52c41a", fontSize: 12 }}>
                  <RiseOutlined /> +{trend.value}% {trend.label}
                </Text>
              ) : (
                <Text style={{ color: "#f5222d", fontSize: 12 }}>
                  <FallOutlined /> {trend.value}% {trend.label}
                </Text>
              )}
            </div>
          )}
        </div>
        {prefix && (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: color ? `${color}18` : "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              color: color || "#8c8c8c",
              flexShrink: 0,
            }}
          >
            {prefix}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ===================== WAREHOUSE TYPE TAB ===================== */

interface WarehouseTypeTabProps {
  group: WarehouseTypeGroup;
  loading: boolean;
}

function WarehouseTypeTab({ group, loading }: WarehouseTypeTabProps) {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const paged = group.warehouses.slice((page - 1) * pageSize, page * pageSize);

  const chartData = group.warehouses
    .filter((wh) => wh.totalQty > 0)
    .slice(0, 15)
    .map((wh) => ({
      name: wh.warehouseName.replace("Kho Nhựa Kỹ Thuật", "KNK").trim(),
      "Tồn kho": Math.round(wh.totalQty),
      "Đang khóa": Math.round(wh.lockedQty),
      "Khả dụng": Math.round(wh.availableQty),
    }));

  if (loading) return <Spin style={{ display: "block", margin: "40px auto" }} />;
  if (group.warehouses.length === 0)
    return <Empty description="Không có kho nào thuộc loại này" style={{ margin: "40px 0" }} />;

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        <Col xs={8}>
          <Card
            size="small"
            style={{ background: group.bgColor, border: `1px solid ${group.color}30`, borderRadius: 8 }}
          >
            <Statistic
              title={<span style={{ fontSize: 12 }}>Tổng tồn kho</span>}
              value={group.totalQty}
              valueStyle={{ color: group.color, fontSize: 20, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card
            size="small"
            style={{ background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 8 }}
          >
            <Statistic
              title={<span style={{ fontSize: 12 }}>Khả dụng</span>}
              value={group.availableQty}
              valueStyle={{ color: "#52c41a", fontSize: 20, fontWeight: 700 }}
            />
          </Card>
        </Col>
        <Col xs={8}>
          <Card
            size="small"
            style={{ background: "#fff7e6", border: "1px solid #ffd591", borderRadius: 8 }}
          >
            <Statistic
              title={<span style={{ fontSize: 12 }}>Đang khóa</span>}
              value={group.lockedQty}
              valueStyle={{ color: "#fa8c16", fontSize: 20, fontWeight: 700 }}
            />
          </Card>
        </Col>
      </Row>

      {group.warehouses.length > 0 && (
        <Card
          size="small"
          style={{ marginBottom: 16, borderRadius: 8 }}
          title={<span style={{ fontSize: 13 }}>Phân bổ tồn kho theo kho</span>}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RechartsTooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Tồn kho" fill={group.color} radius={[3, 3, 0, 0]} />
              {group.lockedQty > 0 && (
                <Bar dataKey="Đang khóa" fill="#fa8c16" radius={[3, 3, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {paged.map((wh) => {
        const availPercent =
          wh.totalQty > 0 ? Math.round((wh.availableQty / wh.totalQty) * 100) : 0;
        const lockedPercent =
          wh.totalQty > 0 ? Math.round((wh.lockedQty / wh.totalQty) * 100) : 0;

        return (
          <div
            key={wh.warehouseId}
            style={{ padding: "12px 0", borderBottom: "1px solid #f5f5f5" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div>
                <Text strong style={{ fontSize: 14 }}>
                  {wh.warehouseName}
                </Text>
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {wh.productCount} sản phẩm • {wh.locationCount ?? "—"} vị trí
                  </Text>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: group.color }}>
                  {wh.totalQty.toLocaleString()} đơn vị
                </div>
                <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                  Khả dụng: {wh.availableQty.toLocaleString()}
                </div>
              </div>
            </div>
            <Tooltip
              title={`Khả dụng: ${wh.availableQty} | Đã khóa: ${wh.lockedQty} | Tổng: ${wh.totalQty}`}
            >
              <Progress
                percent={availPercent}
                success={{ percent: availPercent - lockedPercent }}
                strokeColor={group.color}
                format={(p) => `${p}%`}
                size="small"
              />
            </Tooltip>
          </div>
        );
      })}

      {group.warehouses.length > pageSize && (
        <Pagination
          style={{ marginTop: 12, textAlign: "right" }}
          current={page}
          pageSize={pageSize}
          total={group.warehouses.length}
          showSizeChanger={false}
          size="small"
          onChange={setPage}
        />
      )}
    </div>
  );
}

/* ===================== INVENTORY SLIDESHOW ===================== */

interface InventorySlideItem {
  productId: number;
  productCode: string;
  productName: string;
  totalQty: number;
  availableQty: number;
  warehouseCount: number;
}

function InventorySlideshow({ items, loading }: { items: InventorySlideItem[]; loading: boolean }) {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % items.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [items.length]);

  const item = items[current];

  return (
    <Card
      loading={loading}
      style={{
        borderRadius: 12,
        border: "1px solid #b5f5ec",
        background: "linear-gradient(135deg, #e6fffb 0%, #f0fffe 100%)",
        height: "100%",
        overflow: "hidden",
      }}
      bodyStyle={{ padding: "16px 20px" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Tồn kho theo sản phẩm</Text>
          <div
            style={{
              marginTop: 4,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.4s ease, transform 0.4s ease",
            }}
          >
            {item ? (
              <>
                <div style={{ fontSize: 11, color: "#08979c", fontWeight: 600, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.productCode}
                </div>
                <div style={{ fontSize: 12, color: "#595959", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.productName}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#13c2c2", lineHeight: 1.1 }}>
                  {Math.round(item.totalQty).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "#52c41a", marginTop: 2 }}>
                  Khả dụng: {Math.round(item.availableQty).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 1 }}>
                  {item.warehouseCount} kho lưu trữ
                </div>
              </>
            ) : (
              <div style={{ fontSize: 24, fontWeight: 700, color: "#13c2c2" }}>—</div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "#b5f5ec", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#13c2c2" }}>
            <BoxPlotOutlined />
          </div>
          {items.length > 1 && (
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 44, justifyContent: "center" }}>
              {items.slice(0, Math.min(items.length, 8)).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === current % Math.min(items.length, 8) ? 12 : 5,
                    height: 5,
                    borderRadius: 3,
                    background: i === current % Math.min(items.length, 8) ? "#13c2c2" : "#d9d9d9",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}
          {items.length > 0 && (
            <div style={{ fontSize: 10, color: "#8c8c8c", textAlign: "center" }}>
              {current + 1}/{items.length}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ===================== MAIN DASHBOARD ===================== */

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalWarehouses: 0,
    totalInventory: 0,
    availableInventory: 0,
    lockedInventory: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalSalesAmount: 0,
    totalPOs: 0,
    pendingPOs: 0,
    totalGRs: 0,
    pendingGRs: 0,
  });

  const [warehouseTypeGroups, setWarehouseTypeGroups] = useState<WarehouseTypeGroup[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentPOs, setRecentPOs] = useState<any[]>([]);
  const [recentGRs, setRecentGRs] = useState<any[]>([]);
  const [inventoryByType, setInventoryByType] = useState<{ name: string; value: number; color: string }[]>([]);
  const [inventoryByProduct, setInventoryByProduct] = useState<{ productId: number; productCode: string; productName: string; totalQty: number; availableQty: number; warehouseCount: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const extractArray = (res: any): any[] => {
        const r = res?.data ?? res;
        if (Array.isArray(r)) return r;
        if (Array.isArray(r?.items)) return r.items;
        if (Array.isArray(r?.data)) return r.data;
        if (Array.isArray(r?.data?.items)) return r.data.items;
        if (Array.isArray(r?.result)) return r.result;
        console.warn("[Dashboard] extractArray: unknown shape", r);
        return [];
      };

      const extractPaged = (res: any): { items: any[]; total: number } => {
        const r = res?.data ?? res;
        if (Array.isArray(r?.items)) return { items: r.items, total: r.total ?? r.items.length };
        if (Array.isArray(r?.data?.items)) return { items: r.data.items, total: r.data.total ?? r.data.items.length };
        if (Array.isArray(r)) return { items: r, total: r.length };
        console.warn("[Dashboard] extractPaged: unknown shape", r);
        return { items: [], total: 0 };
      };

      // 1. Warehouses
      const whRes = await warehouseApi.query(1, 1000);
      const { items: warehouses } = extractPaged(whRes);

      // 2. Inventory
      const invRes = await inventoryApi.query({});
      const inventories: InventoryDto[] = extractArray(invRes);

      // 3. Products
      const productRes = await productApi.getAll();
      const productArr = extractArray(productRes);
      const totalProducts = productArr.length;

      // 4. Sales Orders
      const salesRes = await salesApi.query({ page: 1, pageSize: 10, sortBy: "createdAt", asc: false });
      const { items: orders } = extractPaged(salesRes);
      const pendingOrders = orders.filter((o: any) => ["Pending", "Processing", "0", 0].includes(o.status)).length;
      const totalSalesAmount = orders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);

      // 5. Purchase Orders
      let recentPOList: any[] = [];
      let pendingPOs = 0;
      try {
        const poRes = await purchaseApi.getPOs({ page: 1, pageSize: 10 });
        recentPOList = extractArray(poRes);
        pendingPOs = recentPOList.filter((p: any) => ["Pending", "0", 0].includes(p.status)).length;
      } catch (e) { console.warn("[Dashboard] PO fetch failed:", e); }

      // 6. Goods Receipts
      let recentGRList: any[] = [];
      let pendingGRs = 0;
      try {
        const grRes = await purchaseApi.getGRs({ page: 1, pageSize: 10 });
        recentGRList = extractArray(grRes);
        pendingGRs = recentGRList.filter((g: any) => [0, "0", "Pending"].includes(g.status)).length;
      } catch (e) { console.warn("[Dashboard] GR fetch failed:", e); }

      // FIX: normalizeWarehouseType — BE có thể trả string hoặc number, đều normalize về WarehouseType (0|1|2|3)
      const normalizeWarehouseType = (raw: any): WarehouseType | null => {
        // Nếu đã là number hợp lệ
        if (typeof raw === "number" && [0, 1, 2, 3].includes(raw)) return raw as WarehouseType;
        // Nếu là string số "0","1","2","3"
        const num = parseInt(raw, 10);
        if (!isNaN(num) && [0, 1, 2, 3].includes(num)) return num as WarehouseType;
        return null;
      };

      // FIX: dùng [0,1,2,3] as WarehouseType[] thay vì string array
      const groups: WarehouseTypeGroup[] = ([0, 1, 2, 3] as WarehouseType[]).map((type) => {
        const cfg = WAREHOUSE_TYPE_CONFIG[type];
        const whOfType = warehouses.filter((w: any) => normalizeWarehouseType(w.warehouseType) === type);

        const summaries: WarehouseInventorySummary[] = whOfType.map((wh: any) => {
          const whItems = inventories.filter((i) => i.warehouseId === wh.id);
          const uniqueProducts = new Set(whItems.map((i) => i.productId)).size;
          return {
            warehouseId: wh.id,
            warehouseName: wh.name,
            warehouseType: type,
            totalQty: whItems.reduce((s, i) => s + i.onHandQuantity, 0),
            availableQty: whItems.reduce((s, i) => s + i.availableQuantity, 0),
            lockedQty: whItems.reduce((s, i) => s + i.lockedQuantity, 0),
            inTransitQty: whItems.reduce((s, i) => s + (i.inTransitQuantity || 0), 0),
            locationCount: wh.locationCount,
            productCount: uniqueProducts,
          };
        });

        return {
          type,
          label: cfg.label,
          icon: cfg.icon,
          color: cfg.color,
          bgColor: cfg.bgColor,
          warehouses: summaries,
          totalQty: summaries.reduce((s, w) => s + w.totalQty, 0),
          availableQty: summaries.reduce((s, w) => s + w.availableQty, 0),
          lockedQty: summaries.reduce((s, w) => s + w.lockedQty, 0),
        };
      });

      // Pie data
      const pieData = groups
        .filter((g) => g.totalQty > 0)
        .map((g) => ({
          name: g.label,
          value: g.totalQty,
          color: WAREHOUSE_TYPE_CONFIG[g.type].chartColor,
        }));

      const totalInventory = inventories.reduce((s, i) => s + i.onHandQuantity, 0);
      const availableInventory = inventories.reduce((s, i) => s + i.availableQuantity, 0);
      const lockedInventory = inventories.reduce((s, i) => s + i.lockedQuantity, 0);

      setStats({
        totalProducts,
        totalWarehouses: warehouses.length,
        totalInventory,
        availableInventory,
        lockedInventory,
        totalOrders: orders.length,
        pendingOrders,
        totalSalesAmount,
        totalPOs: recentPOList.length,
        pendingPOs,
        totalGRs: recentGRList.length,
        pendingGRs,
      });

      setWarehouseTypeGroups(groups);
      setRecentOrders(orders.slice(0, 5));
      setRecentPOs(recentPOList.slice(0, 5));
      setRecentGRs(recentGRList.slice(0, 5));
      setInventoryByType(pieData);

      // Inventory by product (slideshow)
      const productMap = new Map<number, { productId: number; productCode: string; productName: string; totalQty: number; availableQty: number; warehouses: Set<string> }>();
      for (const inv of inventories) {
        if (!productMap.has(inv.productId)) {
          productMap.set(inv.productId, { productId: inv.productId, productCode: inv.productCode, productName: inv.productName, totalQty: 0, availableQty: 0, warehouses: new Set() });
        }
        const p = productMap.get(inv.productId)!;
        p.totalQty += inv.onHandQuantity;
        p.availableQty += inv.availableQuantity;
        p.warehouses.add(inv.warehouseId);
      }
      const productSummary = Array.from(productMap.values())
        .filter(p => p.totalQty > 0)
        .sort((a, b) => b.totalQty - a.totalQty)
        .map(p => ({ ...p, warehouseCount: p.warehouses.size }));
      setInventoryByProduct(productSummary);
      setLastRefresh(new Date());
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  /* ===================== RENDER ===================== */

  return (
    <div style={{ padding: "0 4px" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Tổng quan hệ thống</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Cập nhật lần cuối: {lastRefresh.toLocaleTimeString("vi-VN")}
          </Text>
        </div>
        <Tooltip title="Làm mới dữ liệu">
          <div
            onClick={loadDashboardData}
            style={{ cursor: "pointer", padding: "6px 14px", background: "#f5f5f5", borderRadius: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#595959", border: "1px solid #e8e8e8" }}
          >
            <ReloadOutlined spin={loading} /> Làm mới
          </div>
        </Tooltip>
      </div>

      {/* TOP STATS */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={8} md={4}>
          <StatCard title="Sản phẩm" value={stats.totalProducts} prefix={<DatabaseOutlined />} loading={loading} color="#1677ff" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard title="Kho hàng" value={stats.totalWarehouses} prefix={<HomeOutlined />} loading={loading} color="#722ed1" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <InventorySlideshow items={inventoryByProduct} loading={loading} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard title="Đơn hàng" value={stats.totalOrders} prefix={<ShoppingCartOutlined />} loading={loading} color="#52c41a" subValue={`Chờ xử lý: ${stats.pendingOrders}`} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard title="Đặt hàng (PO)" value={stats.totalPOs} prefix={<InboxOutlined />} loading={loading} color="#fa8c16" subValue={`Chờ duyệt: ${stats.pendingPOs}`} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard title="Phiếu nhập (GR)" value={stats.totalGRs} prefix={<FireOutlined />} loading={loading} color="#f5222d" subValue={`Chờ xử lý: ${stats.pendingGRs}`} />
        </Col>
      </Row>

      {/* INVENTORY DETAIL */}
      <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
        <Col xs={8}>
          <Card loading={loading} size="small" style={{ borderRadius: 10, background: "linear-gradient(135deg, #e6f4ff 0%, #f0f9ff 100%)", border: "1px solid #91caff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircleOutlined style={{ color: "#1677ff", fontSize: 22 }} />
              <div>
                <div style={{ fontSize: 11, color: "#595959" }}>Tồn kho khả dụng</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#1677ff" }}>{stats.availableInventory.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={8}>
          <Card loading={loading} size="small" style={{ borderRadius: 10, background: "linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)", border: "1px solid #ffd591" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <WarningOutlined style={{ color: "#fa8c16", fontSize: 22 }} />
              <div>
                <div style={{ fontSize: 11, color: "#595959" }}>Đang bị khóa</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#fa8c16" }}>{stats.lockedInventory.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={8}>
          <Card loading={loading} size="small" style={{ borderRadius: 10, background: "linear-gradient(135deg, #f9f0ff 0%, #fff 100%)", border: "1px solid #d3adf7" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ClockCircleOutlined style={{ color: "#722ed1", fontSize: 22 }} />
              <div>
                <div style={{ fontSize: 11, color: "#595959" }}>Doanh thu mẫu</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#722ed1", lineHeight: 1.3 }}>{formatCurrency(stats.totalSalesAmount)}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* MAIN CONTENT */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* LEFT: Warehouse breakdown */}
        <Col xs={24} lg={14}>
          <Card
            title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><HomeOutlined /><span>Tồn kho theo loại kho</span></div>}
            style={{ borderRadius: 12, height: "100%" }}
            loading={loading}
          >
            {/* FIX: defaultActiveKey dùng string "0" cho khớp với key={String(group.type)} */}
            <Tabs
              defaultActiveKey="0"
              tabBarExtraContent={
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {warehouseTypeGroups.reduce((s, g) => s + g.warehouses.length, 0)} kho tổng
                </Text>
              }
            >
              {warehouseTypeGroups.map((group) => {
                const cfg = WAREHOUSE_TYPE_CONFIG[group.type];
                return (
                  // FIX: key phải là string, dùng String(group.type) → "0","1","2","3"
                  <TabPane
                    key={String(group.type)}
                    tab={
                      <span>
                        <span style={{ color: group.color, marginRight: 4 }}>{group.icon}</span>
                        {cfg.label}
                        {group.warehouses.length > 0 && (
                          <Badge count={group.warehouses.length} style={{ marginLeft: 6, backgroundColor: group.color, fontSize: 10 }} />
                        )}
                      </span>
                    }
                  >
                    <WarehouseTypeTab group={group} loading={loading} />
                  </TabPane>
                );
              })}
            </Tabs>
          </Card>
        </Col>

        {/* RIGHT: Pie + summary */}
        <Col xs={24} lg={10}>
          <Row gutter={[0, 16]}>
            <Col xs={24}>
              <Card title="Phân bổ tồn kho" style={{ borderRadius: 12 }} loading={loading}>
                {inventoryByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={inventoryByType} cx="50%" cy="50%" outerRadius={80} innerRadius={45} dataKey="value" label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {inventoryByType.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val: number | undefined) => [(val ?? 0).toLocaleString(), "Số lượng"]} />
                      <Legend formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="Chưa có dữ liệu" style={{ margin: "20px 0" }} />
                )}
              </Card>
            </Col>
            <Col xs={24}>
              <Card title="Tổng hợp theo loại kho" size="small" style={{ borderRadius: 12 }} loading={loading}>
                {warehouseTypeGroups.map((g) => {
                  const cfg = WAREHOUSE_TYPE_CONFIG[g.type];
                  return (
                    <div key={g.type} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: g.bgColor, display: "flex", alignItems: "center", justifyContent: "center", color: g.color, fontSize: 14 }}>
                          {g.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{cfg.label}</div>
                          <div style={{ fontSize: 11, color: "#8c8c8c" }}>{g.warehouses.length} kho</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: g.color }}>{g.totalQty.toLocaleString()}</div>
                        <div style={{ fontSize: 11, color: "#52c41a" }}>KD: {g.availableQty.toLocaleString()}</div>
                      </div>
                    </div>
                  );
                })}
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* BOTTOM: Recent lists */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        

        {/* Purchase Orders */}
        <Col xs={24} md={8}>
          <Card
            title={<div style={{ display: "flex", justifyContent: "space-between" }}><span><InboxOutlined style={{ marginRight: 6 }} />Đặt hàng (PO) gần đây</span>{stats.pendingPOs > 0 && <Badge count={stats.pendingPOs} color="blue" />}</div>}
            style={{ borderRadius: 12 }}
            loading={loading}
          >
            {recentPOs.length === 0 ? <Empty description="Không có PO nào" /> : recentPOs.map((po) => (
              <div key={po.id} style={{ padding: "8px 0", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{po.code}</div>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>{po.supplier?.name || "—"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {getStatusTag(po.status || "Pending")}
                  <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>{new Date(po.createdAt).toLocaleDateString("vi-VN")}</div>
                </div>
              </div>
            ))}
          </Card>
        </Col>

        {/* Goods Receipts */}
        <Col xs={24} md={8}>
          <Card
            title={<div style={{ display: "flex", justifyContent: "space-between" }}><span><FireOutlined style={{ marginRight: 6 }} />Phiếu nhập (GR) gần đây</span>{stats.pendingGRs > 0 && <Badge count={stats.pendingGRs} color="red" />}</div>}
            style={{ borderRadius: 12 }}
            loading={loading}
          >
            {recentGRs.length === 0 ? <Empty description="Không có phiếu nhập nào" /> : recentGRs.map((gr) => (
              <div key={gr.id} style={{ padding: "8px 0", borderBottom: "1px solid #f5f5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{gr.code}</div>
                  <div style={{ fontSize: 11, color: "#8c8c8c" }}>{gr.receiptType === 0 ? "Mua hàng" : "Sản xuất"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <Tag color={gr.status === 0 ? "orange" : gr.status === 1 ? "blue" : "green"}>
                    {gr.status === 0 ? "Chờ xử lý" : gr.status === 1 ? "Đang xử lý" : "Hoàn thành"}
                  </Tag>
                  <div style={{ fontSize: 11, color: "#8c8c8c", marginTop: 2 }}>{new Date(gr.createdAt).toLocaleDateString("vi-VN")}</div>
                </div>
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}