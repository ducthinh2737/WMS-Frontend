import {
  Modal,
  Form,
  Select,
  InputNumber,
  Button,
  Space,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { salesApi } from "../../api/sale.api";
import { warehouseApi } from "../../api/warehouse.api";
import { productApi } from "../../api/product.api";

export default function CreateProductionGIModal({
  open,
  onCancel,
  onSuccess,
}: any) {
  const [form] = Form.useForm();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    warehouseApi
      .getByWarehouseType({ warehousetype: 0 }) // RawMaterial
      .then((res) => setWarehouses(res.data.result || []));

    productApi
      .getAllByType(0)
      .then((res) => setProducts(res.data.filter((p: any) => p.isActive)));
  }, [open]);

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await salesApi.createProductionGI({
  warehouseId: values.warehouseId,
  items: values.items.map((i: any) => ({
    productId: i.productId,
    quantity: i.quantity,
  })),
});


      message.success("Tạo GI sản xuất thành công");
      form.resetFields();
      onSuccess();
    } catch {
      message.error("Tạo GI thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Tạo GI sản xuất"
      onCancel={onCancel}
      onOk={submit}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="warehouseId"
          label="Kho nguyên liệu"
          rules={[{ required: true }]}
        >
          <Select>
            {warehouses.map((w) => (
              <Select.Option key={w.id} value={w.id}>
                {w.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.List name="items" initialValue={[{}]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Space key={key}>
                  <Form.Item
                    name={[name, "productId"]}
                    rules={[{ required: true }]}
                  >
                    <Select style={{ width: 240 }}>
                      {products.map((p) => (
                        <Select.Option key={p.id} value={p.id}>
                          {p.code} - {p.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name={[name, "quantity"]}
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={1} />
                  </Form.Item>

                  <Button danger onClick={() => remove(name)}>
                    X
                  </Button>
                </Space>
              ))}
              <Button block type="dashed" onClick={() => add()}>
                + Thêm NVL
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
