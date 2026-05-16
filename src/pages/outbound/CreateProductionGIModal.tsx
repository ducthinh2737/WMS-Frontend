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
import { outboundApi } from "../../api/outbound.api";
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

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    if (!open) return;

    // ✅ GET ALL WAREHOUSES
    warehouseApi
      .query(1, 1000)
      .then((res) => {
        setWarehouses(res.data.items || []);
      });

    // PRODUCTS
    productApi
      .getAll()
      .then((res) =>
        setProducts(res.data.filter((p: any) => p.isActive))
      );
  }, [open]);

  // =========================
  // SUBMIT
  // =========================
  const submit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await outboundApi.createProductionGI({
        warehouseId: values.warehouseId,
        items: values.items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });

      message.success("Tạo GI sản xuất thành công");

      form.resetFields();
      onSuccess();
    } catch (err) {
      console.error(err);
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
      destroyOnHidden
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ items: [{}] }}
      >
        {/* ===================== WAREHOUSE ===================== */}
        <Form.Item
          name="warehouseId"
          label="Kho"
          rules={[
            {
              required: true,
              message: "Vui lòng chọn kho",
            },
          ]}
        >
          <Select placeholder="Chọn kho">
            {warehouses.map((w) => (
              <Select.Option key={w.id} value={w.id}>
                {w.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* ===================== ITEMS ===================== */}
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Space
                  key={key}
                  align="baseline"
                  style={{
                    display: "flex",
                    marginBottom: 8,
                  }}
                >
                  {/* PRODUCT */}
                  <Form.Item
                    name={[name, "productId"]}
                    rules={[
                      {
                        required: true,
                        message: "Chọn sản phẩm",
                      },
                    ]}
                  >
                    <Select
                      style={{ width: 380 }}
                      placeholder="Chọn sản phẩm"
                      showSearch
                      optionFilterProp="children"
                    >
                      <Select.OptGroup label="Nguyên vật liệu">
                        {products
                          .filter((p) => p.type === 0)
                          .map((p) => (
                            <Select.Option key={p.id} value={p.id}>
                              {p.code} - {p.name}
                            </Select.Option>
                          ))}
                      </Select.OptGroup>

                      <Select.OptGroup label="Thành phẩm">
                        {products
                          .filter((p) => p.type === 1)
                          .map((p) => (
                            <Select.Option key={p.id} value={p.id}>
                              {p.code} - {p.name}
                            </Select.Option>
                          ))}
                      </Select.OptGroup>
                    </Select>
                  </Form.Item>

                  {/* QUANTITY */}
                  <Form.Item
                    name={[name, "quantity"]}
                    rules={[
                      {
                        required: true,
                        message: "Nhập SL",
                      },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      placeholder="SL"
                      style={{ width: 100 }}
                    />
                  </Form.Item>

                  {/* REMOVE */}
                  <Button danger onClick={() => remove(name)}>
                    X
                  </Button>
                </Space>
              ))}

              {/* ADD */}
              <Button
                block
                type="dashed"
                onClick={() => add()}
              >
                + Thêm sản phẩm
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}
