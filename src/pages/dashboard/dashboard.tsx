import { useEffect, useState } from "react";
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
} from "antd";
import {
  DatabaseOutlined,
  HomeOutlined,
  BoxPlotOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { inventoryApi } from "../../api/inventory.api";
import { warehouseApi } from "../../api/warehouse.api";
import { salesApi } from "../../api/sale.api";
import { productApi } from "../../api/product.api";

const { Text } = Typography;

/* ===================== TYPES ===================== */

interface InventoryOverview {
  warehouseId: string;
  warehouseName: string;
  totalQty: number;
  availableQty: number;
}

export interface SalesOrderDto {
  id: string;
  code: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface SalesOverview {
  totalOrders: number;
  totalAmount: number;
  recentOrders: SalesOrderDto[];
}

/* ===================== COMPONENT ===================== */

export default function Dashboard() {
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalWarehouses, setTotalWarehouses] = useState(0);
  const [inventoryOverview, setInventoryOverview] = useState<InventoryOverview[]>([]);
  const [salesOverview, setSalesOverview] = useState<SalesOverview>({
    totalOrders: 0,
    totalAmount: 0,
    recentOrders: [],
  });

  const [loading, setLoading] = useState(false);

  /* ===== Pagination cho tồn kho theo kho ===== */
  const [invPage, setInvPage] = useState(1);
  const [invPageSize, setInvPageSize] = useState(5);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    setInvPage(1);
  }, [inventoryOverview]);

  /* ===================== LOAD DATA ===================== */

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      /* 1️⃣ Warehouses */
      const whRes = await warehouseApi.query(1, 1000);
      const warehouses = whRes.data.items || [];
      setTotalWarehouses(warehouses.length);

      /* 2️⃣ Inventory */
      const invRes = await inventoryApi.query({});
      const inventories = invRes.data || [];

      /* 3️⃣ Products */
      const productRes = await productApi.getAll();
      setTotalProducts(productRes.data.length);

      /* 4️⃣ Inventory overview by warehouse */
      const overview: InventoryOverview[] = warehouses.map((wh) => {
        const whItems = inventories.filter((i) => i.warehouseId === wh.id);
        const totalQty = whItems.reduce((sum, i) => sum + i.onHandQuantity, 0);
        const availableQty = whItems.reduce(
          (sum, i) => sum + i.availableQuantity,
          0
        );

        return {
          warehouseId: wh.id,
          warehouseName: wh.name,
          totalQty,
          availableQty,
        };
      });

      setInventoryOverview(overview);

      /* 5️⃣ Sales orders */
      const salesRes = await salesApi.query({
        page: 1,
        pageSize: 5,
        sortBy: "createdAt",
        asc: false,
      });

      const orders: SalesOrderDto[] = salesRes.data.items || [];
      const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

      setSalesOverview({
        totalOrders: orders.length,
        totalAmount,
        recentOrders: orders,
      });
    } catch (error) {
      console.error(error);
      message.error("Lỗi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  /* ===================== DERIVED DATA ===================== */

  const totalInventory = inventoryOverview.reduce(
    (sum, i) => sum + i.totalQty,
    0
  );

  const pagedInventoryOverview = inventoryOverview.slice(
    (invPage - 1) * invPageSize,
    invPage * invPageSize
  );

  /* ===================== RENDER ===================== */

  return (
    <>
      {/* ===== TOP STATS ===== */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng sản phẩm"
              value={totalProducts}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng kho"
              value={totalWarehouses}
              prefix={<HomeOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Tồn kho tổng"
              value={totalInventory}
              prefix={<BoxPlotOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic
              title="Đơn hàng mới"
              value={salesOverview.totalOrders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* ===== INVENTORY & SALES ===== */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* INVENTORY BY WAREHOUSE */}
        <Col xs={24} md={12}>
          <Card title="Tồn kho theo kho" loading={loading}>
            {pagedInventoryOverview.map((wh) => {
              const percent =
                wh.totalQty > 0
                  ? Math.round((wh.availableQty / wh.totalQty) * 100)
                  : 0;

              return (
                <div key={wh.warehouseId} style={{ marginBottom: 16 }}>
                  <Text strong>{wh.warehouseName}</Text>
                  <Progress
                    percent={percent}
                    format={() => `${wh.availableQty}/${wh.totalQty}`}
                  />
                </div>
              );
            })}

            <Pagination
              style={{ marginTop: 16, textAlign: "right" }}
              current={invPage}
              pageSize={invPageSize}   // cố định = 5
              total={inventoryOverview.length}
              showSizeChanger={false}
              onChange={(page) => {
                setInvPage(page);
              }}
            />

          </Card>
        </Col>

        {/* SALES */}
        <Col xs={24} md={12}>
          <Card title="Đơn hàng mới" loading={loading}>
            <Table
              dataSource={salesOverview.recentOrders}
              rowKey="id"
              pagination={false}
              columns={[
                { title: "Mã đơn", dataIndex: "code" },
                { title: "Khách hàng", dataIndex: "customerName" },
                {
                  title: "Tổng tiền",
                  dataIndex: "totalAmount",
                  render: (val: number) =>
                    val.toLocaleString("vi-VN") + " đ",
                },
                { title: "Trạng thái", dataIndex: "status" },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
