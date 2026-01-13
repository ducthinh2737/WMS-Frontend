import {
  Button,
  Form,
  InputNumber,
  Select,
  Table,
  message,
  Space,
  Divider,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { DeleteOutlined } from "@ant-design/icons";
import { salesApi } from "../../api/sale.api";
import { customerApi } from "../../api/customer.api";
import type { ColumnsType } from 'antd/es/table';  // Import kiểu ColumnsType
import { productApi } from "../../api/product.api";
import { inventoryApi } from "../../api/inventory.api";
import { warehouseApi } from "../../api/warehouse.api";

const { Title } = Typography;

/* ========= TYPES (khớp backend) ========= */
export interface SOItem {
  productId: number;
  productName: string;
  orderQty: number;       // Phải là orderQty
  price: number;          // Phải là price
  warehouseId: string;    // Bắt buộc
}

interface Inventory {
  id: string;
  productId: number;
  warehouseId: string;
  availableQuantity: number;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Props {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/* ========= COMPONENT ========= */
export default function SaleOrderCreateForm({ onSuccess, onCancel }: Props) {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; price?: number }[]>([]);
  const [items, setItems] = useState<SOItem[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseMap, setWarehouseMap] = useState<Record<string, string>>({});
  const [inventoryMap, setInventoryMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadProducts();
    loadWarehouses();
  }, []);

  /* ========= LOAD DATA ========= */
  const loadCustomers = async () => {
    try {
      const res = await customerApi.getAll();
      setCustomers(res.data || []);
    } catch {
      message.error("Lỗi tải danh sách khách hàng");
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productApi.getAll();
      setProducts(res.data || []);

      const productIds = res.data.map((p) => p.id);
      const invRes = await inventoryApi.query({ productIds });
      setInventories(invRes.data || []);

      // Tính tổng tồn kho mỗi sản phẩm (tất cả kho)
      const map: Record<number, number> = {};
      res.data.forEach((p) => {
        const productInvs = invRes.data.filter((i) => i.productId === p.id);
        map[p.id] = productInvs.reduce((sum, i) => sum + i.availableQuantity, 0);
      });
      setInventoryMap(map);
    } catch {
      message.error("Lỗi tải sản phẩm / tồn kho");
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await warehouseApi.query(1, 1000, undefined, "name", true);
      const items = res.data?.items || [];
      setWarehouses(items);

      const map: Record<string, string> = {};
      items.forEach((w) => (map[w.id] = w.name));
      setWarehouseMap(map);
    } catch {
      message.error("Lỗi tải danh sách kho");
    }
  };

  /* ========= ITEM HANDLER ========= */
  const addItem = (productId: number) => {
    if (items.some((i) => i.productId === productId)) {
      message.warning("Sản phẩm đã được thêm");
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setItems([
      ...items,
      {
        productId,
        productName: product.name,
        orderQty: 1,
        price: product.price || 0,
        warehouseId: "", // Bắt buộc chọn sau
      },
    ]);
  };

  const updateItem = (productId: number, data: Partial<SOItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, ...data } : i))
    );
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const calculateTotal = () =>
    items.reduce((sum, i) => sum + i.orderQty * i.price, 0);

  const getMaxQty = (item: SOItem): number => {
    // Nếu muốn giới hạn SL theo tồn kho kho đã chọn
    const inv = inventories.find(
      (i) => i.productId === item.productId && i.warehouseId === item.warehouseId
    );
    return inv ? inv.availableQuantity : 0;
  };

  /* ========= TABLE COLUMNS ========= */
const columns: ColumnsType<SOItem> = [    {
      title: "Sản phẩm",
      dataIndex: "productName",
      key: "productName",
      width: 220,
    },
    {
      title: "Kho xuất",
      key: "warehouseId",
      width: 280,
      render: (_: any, record: SOItem) => {
        const productInvs = inventories.filter(
          (inv) => inv.productId === record.productId
        );

        return (
          <Select
            style={{ width: "100%" }}
            placeholder="Chọn kho"
            value={record.warehouseId || undefined}
            onChange={(val) => updateItem(record.productId, { warehouseId: val })}
            showSearch
            optionFilterProp="children"
          >
            {productInvs.map((inv) => (
              <Select.Option key={inv.warehouseId} value={inv.warehouseId}>
                {warehouseMap[inv.warehouseId] || `Kho ${inv.warehouseId}`} - Tồn: <strong>{inv.availableQuantity}</strong>
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "Số lượng",
      key: "orderQty",
      width: 140,
      render: (_: any, record: SOItem) => {
        const max = getMaxQty(record);
        return (
          <InputNumber
            min={1}
            max={max || undefined}
            style={{ width: "100%" }}
            value={record.orderQty}
            onChange={(val) => {
              if (val && val > max) {
                message.warning(`Tồn kho tối đa tại kho này: ${max}`);
              }
              updateItem(record.productId, { orderQty: val || 1 });
            }}
          />
        );
      },
    },
    {
      title: "Đơn giá",
      key: "price",
      width: 140,
      render: (_: any, record: SOItem) => (
        <InputNumber
          min={0}
          style={{ width: "100%" }}
          value={record.price}
          onChange={(val) => updateItem(record.productId, { price: val || 0 })}
        />
      ),
    },
    {
      title: "Thành tiền",
      key: "subtotal",
      width: 140,
      align: "right",
      render: (_: any, record: SOItem) =>
        (record.orderQty * record.price).toLocaleString("vi-VN"),
    },
    {
      title: "",
      key: "action",
      width: 60,
      render: (_: any, record: SOItem) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(record.productId)}
        />
      ),
    },
  ];

  /* ========= SUBMIT ========= */
  const onFinish = async () => {
    try {
      await form.validateFields();

      if (items.length === 0) {
        return message.error("Vui lòng thêm ít nhất 1 sản phẩm");
      }

      const invalidItem = items.find((i) => !i.warehouseId);
      if (invalidItem) {
        return message.error(`Sản phẩm ${invalidItem.productName} chưa chọn kho`);
      }

      const overStock = items.find((i) => i.orderQty > getMaxQty(i));
      if (overStock) {
        return message.error(`Sản phẩm ${overStock.productName} vượt quá tồn kho tại kho đã chọn`);
      }

      setLoading(true);

      const payload = {
        customerId: form.getFieldValue("customerId"),
        // KHÔNG gửi code - backend tự sinh
        items: items.map((i) => ({
          productId: i.productId,
          warehouseId: i.warehouseId,
          orderQty: i.orderQty,
          price: i.price,
        })),
      };

      await salesApi.create(payload);
      message.success("Tạo đơn bán hàng thành công!");
      form.resetFields();
      setItems([]);
      onSuccess?.();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Lỗi tạo đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  /* ========= RENDER ========= */
  return (
    <Form layout="vertical" form={form} onFinish={onFinish}>
      <Title level={4}>Tạo đơn bán hàng mới</Title>

      <Space size="large" style={{ marginBottom: 24 }}>
        <Form.Item
          label="Khách hàng"
          name="customerId"
          rules={[{ required: true, message: "Vui lòng chọn khách hàng" }]}
        >
          <Select
            showSearch
            style={{ width: 320 }}
            placeholder="Chọn khách hàng"
            options={customers.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
      </Space>

      <Divider>Chi tiết sản phẩm</Divider>

      <Select
        showSearch
        placeholder="Tìm và thêm sản phẩm..."
        style={{ width: 400, marginBottom: 16 }}
        options={products.map((p) => ({
          value: p.id,
          label: `${p.name} (Giá: ${p.price?.toLocaleString() || "—"} | Tồn tổng: ${inventoryMap[p.id] || 0})`,
        }))}
        onChange={addItem}
        value={null}
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />

      <Table
        columns={columns}
        dataSource={items}
        rowKey="productId"
        pagination={false}
        bordered
        size="middle"
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={4}>
              <strong>Tổng cộng</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right">
              <strong>{calculateTotal().toLocaleString("vi-VN", { style: "currency", currency: "VND" })}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5} />
          </Table.Summary.Row>
        )}
      />

      <div style={{ marginTop: 32, textAlign: "right" }}>
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Tạo đơn hàng
          </Button>
        </Space>
      </div>
    </Form>
  );
}