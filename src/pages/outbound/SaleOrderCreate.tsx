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

import { outboundApi } from "../../api/outbound.api";
import { customerApi } from "../../api/customer.api";
import { inventoryApi } from "../../api/inventory.api";
import { warehouseApi } from "../../api/warehouse.api";
import { productApi } from "../../api/product.api";

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
  warehouseId: string;
  availableQuantity: number;
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
  const [loading, setLoading] = useState(false);

  /* ========= LOAD ========= */
  useEffect(() => {
    loadCustomers();
    loadProductsAndInventory();
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

  const loadProductsAndInventory = async () => {
    try {
      const productRes = await productApi.getAllByType(1);
      const productList = (productRes.data || []).filter((p: any) => p.isActive);

      setProducts(
        productList.map((p: any) => ({
          id: p.id,
          name: p.name,
        }))
      );

      const invRes = await inventoryApi.getByProductType(1);
      setInventories(invRes.data || []);
    } catch {
      message.error("Lỗi tải sản phẩm / tồn kho");
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await warehouseApi.getByWarehouseType({
        warehousetype: 1,
      });

      const list = res.data?.result || [];
      const map: Record<string, string> = {};
      list.forEach((w: any) => {
        map[String(w.id)] = w.name; // ⚠️ ép string cho chắc
      });

      setWarehouseMap(map);
    } catch {
      message.error("Lỗi tải kho thành phẩm");
    }
  };

  /* ========= HELPERS ========= */
  const getMaxQty = (item: SOItem) => {
    const inv = inventories.find(
      (i) =>
        i.productId === item.productId &&
        i.warehouseId === item.warehouseId
    );
    return inv?.availableQuantity || 0;
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

  const totalAmount = items.reduce(
    (sum, i) => sum + i.orderQty * i.price,
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
      width: 320,
      render: (_, record) => {
        const productInvs = inventories.filter(
          (i) =>
            i.productId === record.productId &&
            i.availableQuantity > 0
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
          >
            {productInvs.map((inv) => (
              <Select.Option
                key={`${record.productId}_${inv.warehouseId}`}
                value={inv.warehouseId}
              >
                {warehouseMap[inv.warehouseId] ?? inv.warehouseId}
                {" – Tồn: "}
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
            onChange={(v) =>
              updateItem(record.productId, { orderQty: v || 1 })
            }
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

      await outboundApi.createOrder({
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
        optionFilterProp="label"
        style={{ width: 420, marginBottom: 16 }}
        placeholder="Thêm sản phẩm thành phẩm"
        value={null}
        options={products
          .filter((p) =>
            inventories.some(
              (i) =>
                i.productId === p.id &&
                i.availableQuantity > 0
            )
          )
          .map((p) => ({
            value: p.id,
            label: p.name,
          }))}
        onChange={addItem}
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

