import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Card,
  Space,
  Divider,
  message,
  Row,
  Col,
  Typography
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { transferApi } from "../../api/transfer.api";
import { warehouseApi } from "../../api/warehouse.api";
import { locationApi } from "../../api/location.api";
import { productApi } from "../../api/product.api";
import { inventoryApi } from "../../api/inventory.api";
import type { TransferOrderDto } from "../../types/transfer";

const { Text } = Typography;

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TransferCreateForm({ onSuccess, onCancel }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [fromLocations, setFromLocations] = useState<any[]>([]);
  const [toLocations, setToLocations] = useState<any[]>([]);
  const [inventoryMap, setInventoryMap] = useState<Record<string, number>>({});

  useEffect(() => {
    warehouseApi.query(1, 100).then(res =>
      setWarehouses(res.data.items || res.data)
    );
    productApi.filter({ page: 1, pageSize: 100 }).then(res =>
      setProducts(res.data.items || res.data)
    );
  }, []);

  const onFromWarehouseChange = async (warehouseId: string) => {
    const res = await locationApi.list(warehouseId);
    setFromLocations(res.data);

    const invRes = await inventoryApi.query({ warehouseId });
    const map: Record<string, number> = {};
    (invRes.data || []).forEach((inv: any) => {
      map[`${inv.locationId}-${inv.productId}`] =
        inv.onHandQuantity - inv.lockedQuantity;
    });
    setInventoryMap(map);

    form.setFieldsValue({
      items: form.getFieldValue("items")?.map((i: any) => ({
        ...i,
        fromLocationId: undefined
      }))
    });
  };

  const onToWarehouseChange = async (warehouseId: string) => {
    const res = await locationApi.list(warehouseId);
    setToLocations(res.data);

    form.setFieldsValue({
      items: form.getFieldValue("items")?.map((i: any) => ({
        ...i,
        toLocationId: undefined
      }))
    });
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload: TransferOrderDto = {
        fromWarehouseId: values.fromWarehouseId,
        toWarehouseId: values.toWarehouseId,
        note: values.note,
        items: values.items.map((item: any) => ({
          productId: Number(item.productId),
          fromLocationId: item.fromLocationId,
          toLocationId: item.toLocationId,
          quantity: Number(item.quantity),
          note: item.itemNote
        }))
      };

      await transferApi.create(payload);
      message.success("Tạo phiếu chuyển kho thành công!");
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi tạo phiếu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ items: [{}] }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Từ Kho" name="fromWarehouseId" rules={[{ required: true }]}>
            <Select onChange={onFromWarehouseChange}>
              {warehouses.map(w => (
                <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Đến Kho" name="toWarehouseId" rules={[{ required: true }]}>
            <Select onChange={onToWarehouseChange}>
              {warehouses.map(w => (
                <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Ghi chú" name="note">
        <Input.TextArea rows={2} />
      </Form.Item>

      <Divider>Chi tiết sản phẩm</Divider>

      <Form.List name="items">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...rest }) => {
              const productId = form.getFieldValue(["items", name, "productId"]);
              const fromLocationId = form.getFieldValue(["items", name, "fromLocationId"]);
              const availableQty = inventoryMap[`${fromLocationId}-${productId}`] || 0;

              return (
                <Space key={key} align="baseline">
                  <Form.Item {...rest} name={[name, "productId"]} rules={[{ required: true }]}>
                    <Select style={{ width: 180 }}>
                      {products.map(p => (
                        <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item {...rest} name={[name, "fromLocationId"]} rules={[{ required: true }]}>
                    <Select style={{ width: 120 }}>
                      {fromLocations.map(l => (
                        <Select.Option key={l.id} value={l.id}>{l.code}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item {...rest} name={[name, "toLocationId"]} rules={[{ required: true }]}>
                    <Select style={{ width: 120 }}>
                      {toLocations.map(l => (
                        <Select.Option key={l.id} value={l.id}>{l.code}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item {...rest} name={[name, "quantity"]} rules={[
                    { required: true },
                    {
                      validator(_, val) {
                        if (val > availableQty)
                          return Promise.reject(`Vượt tồn (${availableQty})`);
                        return Promise.resolve();
                      }
                    }
                  ]}>
                    <InputNumber min={0.01} />
                  </Form.Item>

                  <Text type="secondary">{availableQty > 0 && `Tồn: ${availableQty}`}</Text>

                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              );
            })}
            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
              Thêm sản phẩm
            </Button>
          </>
        )}
      </Form.List>

      <Divider />

      <Row justify="end">
  <Space>
    <Button onClick={onCancel}>
      Hủy
    </Button>
    <Button
      type="primary"
      htmlType="submit"
      loading={loading}
    >
      Lưu nháp
    </Button>
  </Space>
</Row>
    </Form>
  );
}
