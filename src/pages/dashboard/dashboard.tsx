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
  Select,
  Button,
  Space,
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
  SyncOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  SwapOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
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
} from "recharts";
import { inventoryApi } from "../../api/inventory.api";
import { warehouseApi } from "../../api/warehouse.api";
import { outboundApi } from "../../api/outbound.api";
import { productApi } from "../../api/product.api";
import { inboundApi } from "../../api/inbound.api";
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
  totalGRs: number;
  pendingGRs: number;
  totalGIs: number;
  pendingGIs: number;
}

/* ===================== CONSTANTS ===================== */

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
      styles={{ body: { padding: "20px 24px" } }}
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
              styles={{ content: { color: group.color, fontSize: 20, fontWeight: 700 } }}
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
              styles={{ content: { color: "#52c41a", fontSize: 20, fontWeight: 700 } }}
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
              styles={{ content: { color: "#fa8c16", fontSize: 20, fontWeight: 700 } }}
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
      size="small"
      style={{
        borderRadius: 10,
        background: "linear-gradient(135deg, #e6fffb 0%, #fff 100%)",
        border: "1px solid #b5f5ec",
        height: "100%",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <BoxPlotOutlined style={{ color: "#13c2c2", fontSize: 20 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#595959" }}>Tồn kho nổi bật</div>
          <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.2s", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item ? (
              <>
                <strong style={{ color: "#262626", fontSize: 13 }}>{item.productCode}</strong>
                <span style={{ fontSize: 16, fontWeight: 700, marginLeft: 8, color: "#13c2c2" }}>
                  {Math.round(item.totalQty).toLocaleString()}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 16, fontWeight: 700, color: "#13c2c2" }}>—</span>
            )}
          </div>
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
    totalGRs: 0,
    pendingGRs: 0,
    totalGIs: 0,
    pendingGIs: 0,
  });

  const [warehouseTypeGroups, setWarehouseTypeGroups] = useState<WarehouseTypeGroup[]>([]);
  const [inventoryByType, setInventoryByType] = useState<{ name: string; value: number; color: string }[]>([]);
  const [inventoryByProduct, setInventoryByProduct] = useState<{ productId: number; productCode: string; productName: string; totalQty: number; availableQty: number; warehouseCount: number }[]>([]);
  const [lowStockItems, setLowStockItems] = useState<{ productId: number; productCode: string; productName: string; totalQty: number; availableQty: number }[]>([]);
  const [pendingGRs, setPendingGRs] = useState<any[]>([]);
  const [pendingGIs, setPendingGIs] = useState<any[]>([]);
  const [trendChartData, setTrendChartData] = useState<{ date: string; Nhập: number; Xuất: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // FILTERS
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [filterWarehouseId, setFilterWarehouseId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  const loadDashboardData = useCallback(async (warehouseId?: string) => {
    setLoading(true);
    try {
      const extractArray = (res: any): any[] => {
        const r = res?.data ?? res;
        if (Array.isArray(r)) return r;
        if (Array.isArray(r?.items)) return r.items;
        if (Array.isArray(r?.data)) return r.data;
        if (Array.isArray(r?.data?.items)) return r.data.items;
        if (Array.isArray(r?.result)) return r.result;
        return [];
      };

      const extractPaged = (res: any): { items: any[]; total: number } => {
        const r = res?.data ?? res;
        if (Array.isArray(r?.items)) return { items: r.items, total: r.total ?? r.items.length };
        if (Array.isArray(r?.data?.items)) return { items: r.data.items, total: r.data.total ?? r.data.items.length };
        if (Array.isArray(r)) return { items: r, total: r.length };
        return { items: [], total: 0 };
      };

      // 1. Warehouses (Full list for categories/filtering)
      const whRes = await warehouseApi.query(1, 1000);
      const { items: allWarehouses } = extractPaged(whRes);
      if (warehouses.length === 0) setWarehouses(allWarehouses);

      // 2. Inventory (Filtered by warehouse if selected)
      const invRes = await inventoryApi.query({ warehouseId });
      const inventories: InventoryDto[] = extractArray(invRes);

      // 3. Products
      const productRes = await productApi.getAll();
      const productArr = extractArray(productRes);
      const totalProducts = productArr.length;

      // FIX: normalizeWarehouseType
      const normalizeWarehouseType = (raw: any): WarehouseType | null => {
        if (typeof raw === "number" && [0, 1, 2, 3].includes(raw)) return raw as WarehouseType;
        const num = parseInt(raw, 10);
        if (!isNaN(num) && [0, 1, 2, 3].includes(num)) return num as WarehouseType;
        return null;
      };

      const groups: WarehouseTypeGroup[] = ([0, 1, 2, 3] as WarehouseType[]).map((type) => {
        const cfg = WAREHOUSE_TYPE_CONFIG[type];
        const whOfType = allWarehouses.filter((w: any) => normalizeWarehouseType(w.warehouseType) === type);

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

      // 4. Goods Receipts (GRs)
      let grArr: any[] = [];
      let pendingGRList: any[] = [];
      let totalGRsCount = 0;
      let pendingGRsCount = 0;
      try {
        const grRes = await inboundApi.getGRs();
        grArr = extractArray(grRes);
        totalGRsCount = grArr.length;
        pendingGRsCount = grArr.filter((gr: any) => gr.status === 0).length; // status 0 is Pending
        pendingGRList = grArr.filter((gr: any) => gr.status === 0).slice(0, 5);
      } catch (e) {
        console.error("Lỗi tải phiếu nhập cho dashboard", e);
      }

      // 5. Goods Issues (GIs)
      let giArr: any[] = [];
      let pendingGIList: any[] = [];
      let totalGIsCount = 0;
      let pendingGIsCount = 0;
      try {
        const giRes = await outboundApi.queryGoodsIssues();
        giArr = extractArray(giRes);
        totalGIsCount = giArr.length;
        pendingGIsCount = giArr.filter((gi: any) => gi.status === 0).length; // status 0 is Pending
        pendingGIList = giArr.filter((gi: any) => gi.status === 0).slice(0, 5);
      } catch (e) {
        console.error("Lỗi tải phiếu xuất cho dashboard", e);
      }

      // 6. Calculate trend data for the last 7 days
      const trendMap = new Map<string, { date: string; Nhập: number; Xuất: number }>();
      const last7Days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        last7Days.push(dayStr);
        trendMap.set(dayStr, { date: dayStr, "Nhập": 0, "Xuất": 0 });
      }

      grArr.forEach((gr: any) => {
        const dateVal = gr.createdAt || gr.createAt;
        if (!dateVal) return;
        const d = new Date(dateVal);
        const dayStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        if (trendMap.has(dayStr)) {
          trendMap.get(dayStr)!.Nhập += 1;
        }
      });

      giArr.forEach((gi: any) => {
        const dateVal = gi.createAt || gi.createdAt;
        if (!dateVal) return;
        const d = new Date(dateVal);
        const dayStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        if (trendMap.has(dayStr)) {
          trendMap.get(dayStr)!.Xuất += 1;
        }
      });

      const trendData = last7Days.map(day => trendMap.get(day)!);
      setTrendChartData(trendData);

      setStats(prev => ({
        ...prev,
        totalProducts,
        totalWarehouses: allWarehouses.length,
        totalInventory,
        availableInventory,
        lockedInventory,
        totalGRs: totalGRsCount,
        pendingGRs: pendingGRsCount,
        totalGIs: totalGIsCount,
        pendingGIs: pendingGIsCount,
      }));

      setPendingGRs(pendingGRList);
      setPendingGIs(pendingGIList);

      setWarehouseTypeGroups(groups);
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

      const lowStock = productSummary.filter(p => p.totalQty < 50).sort((a, b) => a.totalQty - b.totalQty);
      setLowStockItems(lowStock);

      setLastRefresh(new Date());
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  }, [warehouses.length]);

  useEffect(() => {
    loadDashboardData(filterWarehouseId);
  }, [loadDashboardData, filterWarehouseId]);

  return (
    <div style={{ padding: "0 4px" }}>
      {/* HEADER & FILTERS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Tổng quan hệ thống</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Cập nhật lần cuối: {lastRefresh.toLocaleTimeString("vi-VN")}
          </Text>
        </div>

        <Space wrap>
          <Select
            placeholder="Chọn kho"
            style={{ width: 200 }}
            allowClear
            value={filterWarehouseId}
            onChange={(val) => setFilterWarehouseId(val)}
            options={warehouses.map(w => ({ label: w.name, value: w.id }))}
          />
          <Tooltip title="Làm mới dữ liệu">
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={() => loadDashboardData(filterWarehouseId)}
            >
              Làm mới
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ marginBottom: 20 }}>
        <Row gutter={[12, 12]}>
          {[
            { label: "Nhập kho", icon: <InboxOutlined />, color: "#1677ff", path: "/inbound/receipt" },
            { label: "Xuất kho", icon: <ShoppingCartOutlined />, color: "#52c41a", path: "/outbound/issue" },
            { label: "Chuyển kho", icon: <SwapOutlined />, color: "#fa8c16", path: "/transfer" },
            { label: "Sản phẩm", icon: <PlusOutlined />, color: "#eb2f96", path: "/product/create" },
          ].map((act, i) => (
            <Col key={i} xs={12} sm={12} md={6} lg={6}>
              <div
                onClick={() => navigate(act.path)}
                style={{
                  background: "#fff",
                  padding: "12px 8px",
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: "1px solid #f0f0f0",
                  transition: "all 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = act.color;
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = `0 4px 12px ${act.color}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#f0f0f0";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                }}
              >
                <div style={{ fontSize: 20, color: act.color, marginBottom: 4 }}>{act.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#595959" }}>{act.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* STATS CARDS GRID */}
      <Row gutter={[12, 12]}>
        {/* 1. Sản phẩm */}
        <Col xs={12} sm={8} md={4}>
          <Card loading={loading} size="small" style={{ borderRadius: 10, background: "linear-gradient(135deg, #e6f7ff 0%, #fff 100%)", border: "1px solid #91d5ff", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <DatabaseOutlined style={{ color: "#1890ff", fontSize: 20 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#595959", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Sản phẩm</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1890ff" }}>{stats.totalProducts}</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 2. Kho hàng */}
        <Col xs={12} sm={8} md={4}>
          <Card loading={loading} size="small" style={{ borderRadius: 10, background: "linear-gradient(135deg, #f9f0ff 0%, #fff 100%)", border: "1px solid #d3adf7", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <HomeOutlined style={{ color: "#722ed1", fontSize: 20 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#595959", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Kho hàng</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#722ed1" }}>{stats.totalWarehouses}</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 3. Tồn khả dụng */}
        <Col xs={12} sm={8} md={4}>
          <Card loading={loading} size="small" style={{ borderRadius: 10, background: "linear-gradient(135deg, #f6ffed 0%, #fff 100%)", border: "1px solid #b7eb8f", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 20 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#595959", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Tồn khả dụng</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#52c41a" }}>{stats.availableInventory.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 4. Đang bị khóa */}
        <Col xs={12} sm={8} md={4}>
          <Card loading={loading} size="small" style={{ borderRadius: 10, background: "linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)", border: "1px solid #ffd591", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <WarningOutlined style={{ color: "#fa8c16", fontSize: 20 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#595959", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Đang bị khóa</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fa8c16" }}>{stats.lockedInventory.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 5. Phiếu kho chờ duyệt */}
        <Col xs={12} sm={8} md={4}>
          <Card loading={loading} size="small" style={{ borderRadius: 10, background: "linear-gradient(135deg, #fff1f0 0%, #fff 100%)", border: "1px solid #ffa39e", height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ClockCircleOutlined style={{ color: "#f5222d", fontSize: 20 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#595959", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Chờ duyệt</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f5222d" }}>
                  {stats.pendingGRs + stats.pendingGIs} <span style={{ fontSize: 10, fontWeight: 400, color: "#8c8c8c" }}>({stats.pendingGRs}Nhập, {stats.pendingGIs}Xuất)</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 6. Tồn kho nổi bật */}
        <Col xs={12} sm={8} md={4}>
          <InventorySlideshow items={inventoryByProduct} loading={loading} />
        </Col>
      </Row>

      {/* MAIN TWO-COLUMN CONTAINER */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* LEFT COLUMN: Charts & Breakdowns (span 14) */}
        <Col xs={24} lg={14}>
          <Row gutter={[0, 16]}>
            {/* Trend Chart */}
            <Col xs={24}>
              <Card
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <RiseOutlined style={{ color: "#1890ff" }} />
                    <span>Xu hướng Xuất - Nhập kho (Số phiếu 7 ngày gần nhất)</span>
                  </div>
                }
                style={{ borderRadius: 12 }}
                loading={loading}
              >
                <div style={{ height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <RechartsTooltip />
                      <Legend wrapperStyle={{ fontSize: 12, marginTop: 5 }} />
                      <Bar dataKey="Nhập" fill="#1677ff" name="Phiếu nhập kho" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Xuất" fill="#52c41a" name="Phiếu xuất kho" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>

            {/* Warehouse breakdown */}
            <Col xs={24}>
              <Card
                title={<div style={{ display: "flex", alignItems: "center", gap: 8 }}><HomeOutlined /><span>Tồn kho theo loại kho</span></div>}
                style={{ borderRadius: 12 }}
                loading={loading}
              >
                <Tabs
                  defaultActiveKey="0"
                  tabBarExtraContent={
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {warehouseTypeGroups.reduce((s, g) => s + g.warehouses.length, 0)} kho tổng
                    </Text>
                  }
                  items={warehouseTypeGroups.map((group) => {
                    const cfg = WAREHOUSE_TYPE_CONFIG[group.type];
                    return {
                      key: String(group.type),
                      label: (
                        <span>
                          <span style={{ color: group.color, marginRight: 4 }}>{group.icon}</span>
                          {cfg.label}
                          {group.warehouses.length > 0 && (
                            <Badge count={group.warehouses.length} style={{ marginLeft: 6, backgroundColor: group.color, fontSize: 10 }} />
                          )}
                        </span>
                      ),
                      children: <WarehouseTypeTab group={group} loading={loading} />,
                    };
                  })}
                />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* RIGHT COLUMN: Pie allocation & Summary (span 10) */}
        <Col xs={24} lg={10}>
          <Row gutter={[0, 16]}>
            {/* Pie Chart: Allocation */}
            <Col xs={24}>
              <Card title="Phân bổ tồn kho" style={{ borderRadius: 12 }} loading={loading}>
                {inventoryByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={230}>
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

            {/* Warehouse Type Summary */}
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

            {/* Right: Pending Actions */}
            <Col xs={24}>
              <Card
                title={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span><ClockCircleOutlined style={{ marginRight: 6, color: "#1890ff" }} />Yêu cầu chờ xử lý</span>
                    {(pendingGRs.length + pendingGIs.length) > 0 && <Badge count={pendingGRs.length + pendingGIs.length} style={{ backgroundColor: "#1890ff" }} />}
                  </div>
                }
                style={{ borderRadius: 12, borderTop: "2px solid #1890ff" }}
                loading={loading}
              >
                {pendingGRs.length === 0 && pendingGIs.length === 0 ? (
                  <Empty description="Không có phiếu kho nào chờ xử lý" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <Tabs defaultActiveKey="1" size="small">
                    <Tabs.TabPane tab={`Phiếu nhập (${pendingGRs.length})`} key="1">
                      {pendingGRs.length === 0 ? (
                        <Empty description="Không có phiếu nhập kho chờ duyệt" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        <div style={{ maxHeight: 220, overflowY: "auto" }}>
                          {pendingGRs.map((gr) => (
                            <div key={gr.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                              <div>
                                <Text strong style={{ color: "#1890ff", cursor: "pointer", fontSize: 13 }} onClick={() => navigate("/inbound/receipt")}>
                                  {gr.code}
                                </Text>
                                <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                                  Tạo ngày: {new Date(gr.createdAt).toLocaleDateString("vi-VN")}
                                </div>
                              </div>
                              <Button type="link" size="small" onClick={() => navigate("/inbound/receipt")}>
                                Duyệt ngay <ArrowRightOutlined />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Tabs.TabPane>
                    <Tabs.TabPane tab={`Phiếu xuất (${pendingGIs.length})`} key="2">
                      {pendingGIs.length === 0 ? (
                        <Empty description="Không có phiếu xuất kho chờ duyệt" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        <div style={{ maxHeight: 220, overflowY: "auto" }}>
                          {pendingGIs.map((gi) => (
                            <div key={gi.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                              <div>
                                <Text strong style={{ color: "#52c41a", cursor: "pointer", fontSize: 13 }} onClick={() => navigate("/outbound/issue")}>
                                  {gi.code}
                                </Text>
                                <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                                  Tạo ngày: {new Date(gi.createAt || gi.createdAt).toLocaleDateString("vi-VN")}
                                </div>
                              </div>
                              <Button type="link" size="small" onClick={() => navigate("/outbound/issue")}>
                                Duyệt ngay <ArrowRightOutlined />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </Tabs.TabPane>
                  </Tabs>
                )}
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* BOTTOM SECTION: Alerts (span 24) */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Left: Low Stock Alerts */}
        <Col xs={24}>
          <Card
            title={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span><WarningOutlined style={{ marginRight: 6, color: "#faad14" }} />Cảnh báo tồn kho thấp</span>
                {lowStockItems.length > 0 && <Badge count={lowStockItems.length} style={{ backgroundColor: "#faad14" }} />}
              </div>
            }
            style={{ borderRadius: 12, borderTop: "2px solid #faad14" }}
            loading={loading}
          >
            {lowStockItems.length === 0 ? (
              <Empty description="Tất cả mặt hàng đều đủ tồn kho" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ maxHeight: 250, overflowY: "auto", paddingRight: 4 }}>
                <Row gutter={[8, 8]}>
                  {lowStockItems.map((item) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={item.productId}>
                      <div style={{ padding: "10px", background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                          <Text strong style={{ fontSize: 12 }}>{item.productCode}</Text>
                          <Tag color="error" style={{ margin: 0, fontSize: 11 }}>{item.totalQty.toLocaleString()}</Tag>
                        </div>
                        <div style={{ fontSize: 11, color: "#595959", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.productName}
                        </div>
                        <div style={{ fontSize: 10, color: "#8c8c8c", marginTop: 2 }}>
                          Khả dụng: {item.availableQty.toLocaleString()}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
