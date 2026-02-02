import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  Space,
  message,
  Select,
} from "antd";
import { useEffect, useState } from "react";
import { purchaseApi } from "../../api/purchase.api";
import { warehouseApi } from "../../api/warehouse.api";
import { productApi } from "../../api/product.api";
import type { WarehouseSimpleDto } from "../../api/warehouse.api";
import type { ProductionGRCreateRequest } from "../../types/purchase";
import type { Product } from "../../types/product";

interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CreateProductionGRModal({
  open,
  onCancel,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseSimpleDto[]>([]);

  const [loadingProduct, setLoadingProduct] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // =======================
  // Load kho thành phẩm
  // =======================
  useEffect(() => {
    if (!open) return;

    const loadWarehouses = async () => {
      try {
        setLoadingWarehouse(true);

        const res = await warehouseApi.getByWarehouseType({
          warehousetype: 1, // FinishedGoods
        });

        const data: WarehouseSimpleDto[] =
          (res.data.result || [])
            .filter((w: any) => w.status === 1)
            .map((w: any) => ({
              id: w.id,
              name: w.name,
            }));

        setWarehouses(data);
      } catch {
        message.error("Không tải được danh sách kho thành phẩm");
        setWarehouses([]);
      } finally {
        setLoadingWarehouse(false);
      }
    };

    loadWarehouses();
  }, [open]);

  // =======================
  // Load sản phẩm thành phẩm
  // =======================
  useEffect(() => {
    if (!open) return;

    const loadProducts = async () => {
      try {
        setLoadingProduct(true);

        const res = await productApi.getAllByType(1); // Thành phẩm

        setProducts(res.data.filter((p) => p.isActive));
      } catch {
        message.error("Không tải được danh sách sản phẩm");
        setProducts([]);
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProducts();
  }, [open]);

  // =======================
  // Submit
  // =======================
  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload: ProductionGRCreateRequest = {
        code: values.code,
        warehouseId: values.warehouseId,
        receiptType: 1, // PRODUCTION
        productionReceiptItems: values.items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      };

      await purchaseApi.createGR(payload);

      message.success("Tạo GR sản xuất thành công");
      form.resetFields();
      onSuccess();
    } catch {
      message.error("Tạo GR thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Tạo GR sản xuất"
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        {/* Mã GR */}
        <Form.Item
          name="code"
          label="Mã GR"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        {/* Kho thành phẩm */}
        <Form.Item
          name="warehouseId"
          label="Kho thành phẩm"
          rules={[{ required: true }]}
        >
          <Select
            showSearch
            placeholder="Chọn kho thành phẩm"
            loading={loadingWarehouse}
            disabled={loadingWarehouse}
            allowClear
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label as string)
                .toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {warehouses.map((w) => (
              <Select.Option
                key={w.id}
                value={w.id}
                label={w.name}
              >
                {w.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Danh sách sản phẩm */}
        <Form.List name="items" initialValue={[{}]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Space
                  key={key}
                  style={{ display: "flex" }}
                  align="baseline"
                >
                  {/* Product */}
                  <Form.Item
                    name={[name, "productId"]}
                    rules={[{ required: true }]}
                  >
                    <Select
                      showSearch
                      placeholder="Chọn sản phẩm"
                      loading={loadingProduct}
                      optionFilterProp="label"
                      filterOption={(input, option) =>
                        (option?.label as string)
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      style={{ width: 280 }}
                    >
                      {products.map((p) => (
                        <Select.Option
                          key={p.id}
                          value={p.id}
                          label={`${p.code} - ${p.name}`}
                        >
                          {p.code} - {p.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {/* Quantity */}
                  <Form.Item
                    name={[name, "quantity"]}
                    rules={[{ required: true }]}
                  >
                    <InputNumber min={1} placeholder="Số lượng" />
                  </Form.Item>

                  <Button danger onClick={() => remove(name)}>
                    X
                  </Button>
                </Space>
              ))}

              <Button type="dashed" onClick={() => add()} block>
                + Thêm sản phẩm
              </Button>
            </>
          )}
        </Form.List>

        {/* Action */}
        <Space style={{ marginTop: 20 }}>
          <Button onClick={onCancel}>Hủy</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={onSubmit}
            disabled={loadingWarehouse || loadingProduct}
          >
            Tạo GR
          </Button>
        </Space>
      </Form>
    </Modal>
  );
}
