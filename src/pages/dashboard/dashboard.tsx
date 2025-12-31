import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Progress, Table, Typography, message } from "antd";
import { DatabaseOutlined, HomeOutlined, BoxPlotOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import { inventoryApi } from "../../api/inventory.api";
import { warehouseApi } from "../../api/warehouse.api";
import { salesApi } from "../../api/sale.api";
import { productApi } from "../../api/product.api";

const { Text, Title } = Typography;

interface InventoryOverview {
  warehouseId: string;
  warehouseName: string;
  totalQty: number;
  availableQty: number;
}

interface SalesOverview {
  totalOrders: number;
  totalAmount: number;
  recentOrders: SalesOrderDto[];
}

export interface SalesOrderDto {
  id: string;
  code: string;
  customerName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function Dashboard() {
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalWarehouses, setTotalWarehouses] = useState(0);
  const [inventoryOverview, setInventoryOverview] = useState<InventoryOverview[]>([]);
  const [salesOverview, setSalesOverview] = useState<SalesOverview>({
    totalOrders: 0,
    totalAmount: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1️⃣ Load warehouses
      const whRes = await warehouseApi.query(1, 100);
      const warehouses = whRes.data.items || [];
      setTotalWarehouses(warehouses.length);

      // 2️⃣ Load inventory
      const invRes = await inventoryApi.query({});
      const inventories = invRes.data || [];

      const productIds = productApi.getAll();
      setTotalProducts((await productIds).data.length);

      const overview: InventoryOverview[] = warehouses.map(wh => {
        const whItems = inventories.filter(i => i.warehouseId === wh.id);
        const totalQty = whItems.reduce((sum, i) => sum + i.onHandQuantity, 0);
        const availableQty = whItems.reduce((sum, i) => sum + i.availableQuantity, 0);
        return {
          warehouseId: wh.id,
          warehouseName: wh.name,
          totalQty,
          availableQty
        };
      });
      setInventoryOverview(overview);

      // 3️⃣ Load sales orders
      const salesRes = await salesApi.query({ page: 1, pageSize: 5, sortBy: "createdAt", asc: false });
      const orders: SalesOrderDto[] = salesRes.data.items || [];
      const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
      setSalesOverview({
        totalOrders: orders.length,
        totalAmount,
        recentOrders: orders
      });
    } catch (error: any) {
      console.error(error);
      message.error("Lỗi tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const totalInventory = inventoryOverview.reduce((sum, i) => sum + i.totalQty, 0);

  return (
    <>
      {/* TOP STATS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic title="Tổng sản phẩm" value={totalProducts} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic title="Tổng kho" value={totalWarehouses} prefix={<HomeOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic title="Tồn kho tổng" value={totalInventory} prefix={<BoxPlotOutlined />} />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic title="Đơn hàng mới" value={salesOverview.totalOrders} prefix={<ShoppingCartOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* INVENTORY PROGRESS & SALES TABLE */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Tồn kho theo kho" loading={loading}>
            {inventoryOverview.map(wh => {
              const percent = wh.totalQty > 0 ? Math.round((wh.availableQty / wh.totalQty) * 100) : 0;
              return (
                <div key={wh.warehouseId} style={{ marginBottom: 16 }}>
                  <Text strong>{wh.warehouseName}</Text>
                  <Progress percent={percent} format={p => `${wh.availableQty}/${wh.totalQty}`} />
                </div>
              );
            })}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Đơn hàng mới" loading={loading}>
            <Table
              dataSource={salesOverview.recentOrders}
              rowKey="id"
              pagination={false}
              columns={[
                { title: "Mã đơn", dataIndex: "code" },
                { title: "Khách hàng", dataIndex: "customerName" },
                { title: "Tổng tiền", dataIndex: "totalAmount", render: (val: number) => val.toLocaleString() + " đ" },
                { title: "Trạng thái", dataIndex: "status" },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
