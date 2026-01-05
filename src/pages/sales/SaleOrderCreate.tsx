import {
  Card,
  Button,
  Form,
  InputNumber,
  Select,
  Table,
  message,
  Input,
  Space,
  Divider,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { salesApi } from "../../api/sale.api";
import { customerApi } from "../../api/customer.api";
import { productApi } from "../../api/product.api";
import { inventoryApi } from "../../api/inventory.api";

const { Text, Title } = Typography;

/* ========= TYPES ========= */

interface SOItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  inventoryId?: string; // ⭐ đổi thành string để khớp với Inventory.id
}

interface Inventory {
  id: string; // ⭐ API trả về string, không phải number
  productId: number;
  name?: string;
  availableQuantity: number; // ⭐ số lượng có sẵn trong kho
}

/* ========= COMPONENT ========= */

export default function SaleOrderCreate() {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; price?: number }[]>([]);
  const [items, setItems] = useState<SOItem[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Record<number, number>>({}); // ⭐ tổng số lượng theo productId
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  /* ========= LOAD DATA ========= */

  const loadCustomers = async () => {
    try {
      const res = await customerApi.getAll();
      setCustomers(res.data);
    } catch {
      message.error("Lỗi tải khách hàng");
    }
  };

  const loadProducts = async () => {
    try {
      const res = await productApi.getAll();
      setProducts(res.data);

      const invRes = await inventoryApi.query({
        productIds: res.data.map((p) => p.id),
      });

      setInventories(invRes.data);

      // ⭐ Tính tổng số lượng của mỗi sản phẩm từ tất cả các kho
      const map: Record<number, number> = {};
      res.data.forEach((p) => {
        const inventoriesOfProduct = invRes.data.filter(
          (inv) => inv.productId === p.id
        );
        const totalQty = inventoriesOfProduct.reduce(
          (sum, inv) => sum + (inv.availableQuantity || 0),
          0
        );
        map[p.id] = totalQty;
      });
      setInventoryMap(map);
    } catch {
      message.error("Lỗi tải sản phẩm / kho");
    }
  };

  /* ========= ITEM HANDLER ========= */

  // ⭐ Lấy số lượng khả dụng của kho đã chọn
  const getAvailableQty = (productId: number, inventoryId?: string) => {
    if (!inventoryId) return 0;
    const inv = inventories.find(
      (i) => i.productId === productId && String(i.id) === String(inventoryId)
    );
    return inv?.availableQuantity || 0;
  };

  const addItem = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (items.some((i) => i.productId === productId)) {
      message.warning("Sản phẩm đã tồn tại");
      return;
    }

    setItems([
      ...items,
      {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price || 0,
        inventoryId: undefined,
      },
    ]);
  };

  const removeItem = (productId: number) => {
    setItems(items.filter((i) => i.productId !== productId));
  };

  const updateItem = (productId: number, data: Partial<SOItem>) => {
    setItems((items) =>
      items.map((i) => (i.productId === productId ? { ...i, ...data } : i))
    );
  };

  const calculateTotal = () =>
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  /* ========= SUBMIT ========= */

  const onFinish = async (values: any) => {
    if (items.length === 0) {
      message.error("Vui lòng thêm sản phẩm");
      return;
    }

    if (items.some((i) => !i.inventoryId)) {
      message.error("Vui lòng chọn kho cho tất cả sản phẩm");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        customerId: values.customerId,
        code: values.code,
        items: items.map((i) => ({
          productId: i.productId,
          inventoryId: i.inventoryId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };

      await salesApi.create(payload);
      message.success("Tạo đơn hàng thành công");
      navigate("/sales/orders");
    } catch {
      message.error("Lỗi khi lưu đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  /* ========= RENDER ========= */

  return (
    <Card title={<Title level={4}>Tạo mới đơn bán hàng</Title>}>
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Space size="large">
          <Form.Item
            label="Khách hàng"
            name="customerId"
            rules={[{ required: true }]}
            style={{ width: 300 }}
          >
            <Select
              placeholder="Chọn khách hàng"
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          <Form.Item
            label="Mã đơn hàng"
            name="code"
            rules={[{ required: true }]}
            style={{ width: 250 }}
          >
            <Input />
          </Form.Item>
        </Space>

        <Divider orientation={"left" as unknown as any}>Chi tiết sản phẩm</Divider>

        <Select
          showSearch
          placeholder="Thêm sản phẩm"
          style={{ width: 400, marginBottom: 16 }}
          options={products.map((p) => ({
            value: p.id,
            label: `${p.name} (Tổng: ${inventoryMap[p.id] || 0})`, // ⭐ hiển thị tổng số lượng
          }))}
          onChange={(val: number) => addItem(val)}
          value={null}
        />

        <Table
          rowKey="productId"
          dataSource={items}
          pagination={false}
          bordered
          columns={[
            { title: "Sản phẩm", dataIndex: "productName" },

            {
              title: "Kho",
              width: 220,
              render: (_, record) => {
                const availableQty = getAvailableQty(
                  record.productId,
                  record.inventoryId
                );
                return (
                  <Space direction="vertical" size={4} style={{ width: "100%" }}>
                    <Select
                      placeholder="Chọn kho"
                      style={{ width: "100%" }}
                      value={record.inventoryId}
                      options={inventories
                        .filter((inv) => inv.productId === record.productId)
                        .map((inv) => ({
                          value: inv.id,
                          label: `${inv.name ?? `Kho #${inv.id}`} (${
                            inv.availableQuantity
                          })`, // ⭐ hiển thị số lượng trong kho
                        }))}
                      onChange={(val: string) =>
                        updateItem(record.productId, { inventoryId: val })
                      }
                    />
                    {record.inventoryId && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Còn lại: {availableQty}
                      </Text>
                    )}
                  </Space>
                );
              },
            },

            {
              title: "Số lượng",
              width: 120,
              render: (_, record) => {
                const availableQty = getAvailableQty(
                  record.productId,
                  record.inventoryId
                );
                return (
                  <InputNumber
                    min={1}
                    max={availableQty || undefined} // ⭐ giới hạn max
                    value={record.quantity}
                    status={
                      record.inventoryId && record.quantity > availableQty
                        ? "error" // ⭐ hiển thị lỗi nếu vượt quá
                        : undefined
                    }
                    onChange={(val) => {
                      const newQty = val || 1;
                      if (record.inventoryId && newQty > availableQty) {
                        message.warning(
                          `Kho chỉ còn ${availableQty} sản phẩm!`
                        );
                        return;
                      }
                      updateItem(record.productId, { quantity: newQty });
                    }}
                  />
                );
              },
            },

            {
              title: "Đơn giá",
              width: 150,
              render: (_, record) => (
                <InputNumber
                  min={0}
                  value={record.unitPrice}
                  onChange={(val) =>
                    updateItem(record.productId, { unitPrice: val || 0 })
                  }
                />
              ),
            },

            {
              title: "Thành tiền",
              align: "right",
              render: (_, record) => (
                <Text>
                  {(record.quantity * record.unitPrice).toLocaleString()} đ
                </Text>
              ),
            },

            {
              title: "Xóa",
              align: "center",
              render: (_, record) => (
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeItem(record.productId)}
                />
              ),
            },
          ]}
        />

        {/* Tổng tiền */}
        <div style={{ marginTop: 16, textAlign: "right" }}>
          <Text strong>Tổng tiền: {calculateTotal().toLocaleString()} đ</Text>
        </div>

        <div style={{ marginTop: 24, textAlign: "right" }}>
          <Space>
            <Button onClick={() => navigate("/sales/orders")}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<PlusOutlined />}
            >
              Lưu đơn hàng
            </Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
}