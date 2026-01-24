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
import type { ColumnsType } from "antd/es/table";

import { salesApi } from "../../api/sale.api";
import { customerApi } from "../../api/customer.api";
import { inventoryApi } from "../../api/inventory.api";
import { warehouseApi } from "../../api/warehouse.api";

const { Title } = Typography;

/* ========= TYPES ========= */
export interface SOItem {
  productId: number;
  productName: string;
  orderQty: number;
  price: number;
  warehouseId: string;
}

interface Inventory {
  id: string;
  productId: number;
  productName: string;
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
  const [products, setProducts] = useState<{ id: number; name: string }[]>([]);
  const [items, setItems] = useState<SOItem[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [warehouseMap, setWarehouseMap] = useState<Record<string, string>>({});
  const [inventoryMap, setInventoryMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);

  /* ========= LOAD ========= */
  useEffect(() => {
    loadCustomers();
    loadProducts();
    loadWarehouses();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await customerApi.getAll();
      setCustomers(res.data || []);
    } catch {
      message.error("Lỗi tải khách hàng");
    }
  };

  const loadProducts = async () => {
    try {
      // 🔥 chỉ lấy inventory của product type = Production
      const invRes = await inventoryApi.getByProductType(1);
      const invs: Inventory[] = invRes.data || [];
      setInventories(invs);

      // map product list
      const map = new Map<number, { id: number; name: string }>();
      invs.forEach((i) => {
        if (!map.has(i.productId)) {
          map.set(i.productId, {
            id: i.productId,
            name: i.productName,
          });
        }
      });
      setProducts(Array.from(map.values()));

      // tổng tồn
      const invTotal: Record<number, number> = {};
      invs.forEach((i) => {
        invTotal[i.productId] =
          (invTotal[i.productId] || 0) + i.availableQuantity;
      });
      setInventoryMap(invTotal);
    } catch {
      message.error("Lỗi tải sản phẩm");
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await warehouseApi.query(1, 1000);
      const items = res.data?.items || [];
      const map: Record<string, string> = {};
      items.forEach((w: Warehouse) => (map[w.id] = w.name));
      setWarehouseMap(map);
    } catch {
      message.error("Lỗi tải kho");
    }
  };

  /* ========= ITEM HANDLER ========= */
  const addItem = (productId: number) => {
    if (items.some((i) => i.productId === productId)) {
      message.warning("Sản phẩm đã tồn tại");
      return;
    }
    const p = products.find((x) => x.id === productId);
    if (!p) return;

    setItems((prev) => [
      ...prev,
      {
        productId,
        productName: p.name,
        orderQty: 1,
        price: 0,
        warehouseId: "",
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

  const getMaxQty = (item: SOItem) => {
    const inv = inventories.find(
      (i) =>
        i.productId === item.productId &&
        i.warehouseId === item.warehouseId
    );
    return inv?.availableQuantity || 0;
  };

  const totalAmount = items.reduce(
    (s, i) => s + i.orderQty * i.price,
    0
  );

  /* ========= TABLE ========= */
  const columns: ColumnsType<SOItem> = [
    {
      title: "Sản phẩm",
      dataIndex: "productName",
      width: 220,
    },
    {
      title: "Kho xuất",
      width: 300,
      render: (_, record) => {
        const productInvs = inventories.filter(
          (i) => i.productId === record.productId
        );

        return (
          <Select
            style={{ width: "100%" }}
            placeholder="Chọn kho"
            value={record.warehouseId || undefined}
            onChange={(val) =>
              updateItem(record.productId, {
                warehouseId: val,
                orderQty: 1,
              })
            }
            showSearch
            optionFilterProp="children"
          >
            {productInvs.map((inv) => (
              <Select.Option
                key={`${record.productId}_${inv.warehouseId}`}
                value={inv.warehouseId}
              >
                {warehouseMap[inv.warehouseId] || inv.warehouseId} – Tồn:{" "}
                <strong>{inv.availableQuantity}</strong>
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: "Số lượng",
      width: 140,
      render: (_, record) => {
        const max = getMaxQty(record);
        return (
          <InputNumber
            min={1}
            max={max || undefined}
            value={record.orderQty}
            style={{ width: "100%" }}
            onChange={(v) => {
              if (v && v > max) {
                message.warning(`Tồn kho tối đa: ${max}`);
              }
              updateItem(record.productId, { orderQty: v || 1 });
            }}
          />
        );
      },
    },
    {
      title: "Đơn giá",
      width: 140,
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.price}
          style={{ width: "100%" }}
          onChange={(v) =>
            updateItem(record.productId, { price: v || 0 })
          }
        />
      ),
    },
    {
      title: "Thành tiền",
      width: 150,
      align: "right",
      render: (_, r) =>
        (r.orderQty * r.price).toLocaleString("vi-VN"),
    },
    {
      title: "",
      width: 60,
      render: (_, r) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItem(r.productId)}
        />
      ),
    },
  ];

  /* ========= SUBMIT ========= */
  const onFinish = async () => {
    try {
      await form.validateFields();

      if (!items.length) {
        return message.error("Chưa có sản phẩm");
      }

      const invalid = items.find((i) => !i.warehouseId);
      if (invalid) {
        return message.error(
          `Sản phẩm ${invalid.productName} chưa chọn kho`
        );
      }

      const over = items.find((i) => i.orderQty > getMaxQty(i));
      if (over) {
        return message.error(
          `Sản phẩm ${over.productName} vượt tồn kho`
        );
      }

      setLoading(true);

      await salesApi.create({
        customerId: form.getFieldValue("customerId"),
        items: items.map((i) => ({
          productId: i.productId,
          warehouseId: i.warehouseId,
          orderQty: i.orderQty,
          price: i.price,
        })),
      });

      message.success("Tạo đơn hàng thành công");
      form.resetFields();
      setItems([]);
      onSuccess?.();
    } catch (e: any) {
      message.error(e.response?.data?.message || "Lỗi tạo đơn");
    } finally {
      setLoading(false);
    }
  };

  /* ========= RENDER ========= */
  return (
    <Form layout="vertical" form={form} onFinish={onFinish}>
      <Title level={4}>Tạo đơn bán hàng</Title>

      <Form.Item
        label="Khách hàng"
        name="customerId"
        rules={[{ required: true }]}
      >
        <Select
          showSearch
          style={{ width: 320 }}
          options={customers.map((c) => ({
            value: c.id,
            label: c.name,
          }))}
        />
      </Form.Item>

      <Divider />

      <Select
        showSearch
        style={{ width: 420, marginBottom: 16 }}
        placeholder="Thêm sản phẩm"
        value={null}
        options={products.map((p) => ({
          value: p.id,
          label: `${p.name} | Tồn: ${inventoryMap[p.id] || 0}`,
        }))}
        onChange={addItem}
        filterOption={(i, o) =>
          (o?.label ?? "").toLowerCase().includes(i.toLowerCase())
        }
      />

      <Table
  rowKey="productId"
  columns={columns}
  dataSource={items}
  pagination={false}
  bordered
  summary={() => (
    <Table.Summary.Row>
      <Table.Summary.Cell index={0} colSpan={4}>
        <strong>Tổng cộng</strong>
      </Table.Summary.Cell>

      <Table.Summary.Cell index={4} align="right">
        <strong>
          {totalAmount.toLocaleString("vi-VN", {
            style: "currency",
            currency: "VND",
          })}
        </strong>
      </Table.Summary.Cell>

      <Table.Summary.Cell index={5} />
    </Table.Summary.Row>
  )}
/>
      <div style={{ marginTop: 24, textAlign: "right" }}>
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Tạo đơn
          </Button>
        </Space>
      </div>
    </Form>
  );
}
