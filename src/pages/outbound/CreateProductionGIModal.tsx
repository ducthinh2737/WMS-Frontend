import {
  Modal,
  Form,
  Select,
  InputNumber,
  Button,
  Space,
  message,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { outboundApi } from "../../api/outbound.api";
import { warehouseApi } from "../../api/warehouse.api";
import { productApi } from "../../api/product.api";
import { inventoryApi } from "../../api/inventory.api";
import { unitApi } from "../../api/unit.api";

const { Text } = Typography;

export default function CreateProductionGIModal({
  open,
  onCancel,
  onSuccess,
}: any) {
  const [form] = Form.useForm();

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehouseId, setWarehouseId] = useState<string>();
  const [inventoryMap, setInventoryMap] = useState<Record<number, number>>({});

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

    // UNITS
    unitApi.getAll().then(res => setUnits(res.data || []));
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

  const selectedWarehouseType = warehouses.find((w) => w.id === warehouseId)?.warehouseType;

  return (
    <Modal
      open={open}
      title="Tạo phiếu xuất kho"
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
          <Select 
            placeholder="Chọn kho"
            onChange={(val) => {
              setWarehouseId(val);
              inventoryApi.query({ warehouseId: val }).then(res => {
                const map: Record<number, number> = {};
                (res.data || []).forEach((inv: any) => {
                  if (!map[inv.productId]) map[inv.productId] = 0;
                  map[inv.productId] += inv.availableQuantity;
                });
                setInventoryMap(map);
              }).catch(() => {
                message.error("Lỗi tải thông tin tồn kho");
              });
            }}
          >
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
              {fields.length > 0 && (
                <Space
                  style={{
                    display: "flex",
                    marginBottom: 8,
                    paddingBottom: 4,
                    borderBottom: "1px solid #f0f0f0",
                  }}
                  align="baseline"
                >
                  <div style={{ width: 380, fontWeight: 600 }}>Tên sản phẩm</div>
                  <div style={{ width: 100, fontWeight: 600 }}>Số lượng</div>
                  <div style={{ width: 80, fontWeight: 600, textAlign: "center" }}>ĐVT</div>
                  <div style={{ width: 32 }}></div>
                </Space>
              )}

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
                      optionFilterProp="label"
                      optionLabelProp="label"
                    >
                      {selectedWarehouseType !== 1 && (
                        <Select.OptGroup label="Nguyên vật liệu">
                          {products
                            .filter((p) => p.type === 0)
                            .map((p) => (
                              <Select.Option key={p.id} value={p.id} label={`${p.code} - ${p.name}`}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span>{p.code} - {p.name}</span>
                                  {warehouseId && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Tồn kho hiện có: <Text strong type="success">{inventoryMap[p.id] || 0}</Text>
                                    </Text>
                                  )}
                                </div>
                              </Select.Option>
                            ))}
                        </Select.OptGroup>
                      )}

                      {selectedWarehouseType !== 0 && (
                        <Select.OptGroup label="Thành phẩm">
                          {products
                            .filter((p) => p.type === 1)
                            .map((p) => (
                              <Select.Option key={p.id} value={p.id} label={`${p.code} - ${p.name}`}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span>{p.code} - {p.name}</span>
                                  {warehouseId && (
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Tồn kho hiện có: <Text strong type="success">{inventoryMap[p.id] || 0}</Text>
                                    </Text>
                                  )}
                                </div>
                              </Select.Option>
                            ))}
                        </Select.OptGroup>
                      )}
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

                  {/* UNIT DISPLAY */}
                  <Form.Item
                    shouldUpdate={(prevValues, currentValues) => {
                      return prevValues.items?.[name]?.productId !== currentValues.items?.[name]?.productId;
                    }}
                  >
                    {() => {
                      const productId = form.getFieldValue(["items", name, "productId"]);
                      const prod = products.find(p => p.id === productId);
                      const unitName = units.find(u => u.id === prod?.unitId)?.name || "-";
                      return (
                        <div style={{ width: 80, textAlign: 'center', lineHeight: '30px', backgroundColor: '#fafafa', border: '1px solid #d9d9d9', borderRadius: 6 }}>
                          {unitName}
                        </div>
                      );
                    }}
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
