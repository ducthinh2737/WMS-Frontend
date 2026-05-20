import {
  Modal,
  Form,
  Select,
  InputNumber,
  Button,
  Space,
  message,
  Typography,
  Row,
  Col,
  Divider,
  Input,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { outboundApi } from "../../api/outbound.api";
import { warehouseApi } from "../../api/warehouse.api";
import { productApi } from "../../api/product.api";
import { inventoryApi } from "../../api/inventory.api";
import { unitApi } from "../../api/unit.api";
import { customerApi } from "../../api/customer.api";

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
  const [productUomsMap, setProductUomsMap] = useState<Record<number, any[]>>({});
  const [customers, setCustomers] = useState<any[]>([]);

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setWarehouseId(undefined);
      setInventoryMap({});
      return;
    }

    // ✅ GET ALL WAREHOUSES
    warehouseApi
      .query(1, 1000)
      .then((res) => {
        setWarehouses(res.data.items || []);
      })
      .catch(() => {
        message.error("Lỗi tải danh sách kho");
      });

    // PRODUCTS
    productApi
      .getAll()
      .then((res) =>
        setProducts(res.data.filter((p: any) => p.isActive))
      )
      .catch(() => {
        message.error("Lỗi tải danh mục sản phẩm");
      });

    // UNITS
    unitApi
      .getAll()
      .then((res) => setUnits(res.data || []))
      .catch(() => {
        message.error("Lỗi tải danh mục đơn vị tính");
      });

    // CUSTOMERS
    customerApi
      .getAll()
      .then((res) => setCustomers(res.data || []))
      .catch(() => {
        message.error("Lỗi tải danh mục khách hàng");
      });
  }, [open, form]);

  // =========================
  // SUBMIT
  // =========================
  const submit = async () => {
    try {
      const values = await form.validateFields();

      if (!values.items || values.items.length === 0) {
        message.warning("Vui lòng thêm sản phẩm");
        return;
      }

      // Check missing unitId or unconfigured ProductUoms
      for (const item of values.items) {
        if (!item.unitId || item.unitId <= 0) {
          message.error("Vui lòng chọn đầy đủ đơn vị tính cho tất cả sản phẩm.");
          return;
        }

        const uoms = productUomsMap[item.productId];
        if (uoms === undefined) {
          message.error("Đang tải thông tin đơn vị tính cho sản phẩm, vui lòng đợi...");
          return;
        }
        if (!uoms || uoms.length === 0) {
          const prod = products.find(p => p.id === item.productId);
          const prodName = prod ? prod.name : `ID: ${item.productId}`;
          message.error(`Sản phẩm '${prodName}' chưa được thiết lập Đơn vị tính (ProductUom) trong dữ liệu danh mục!`);
          return;
        }
      }

      setLoading(true);

      await outboundApi.createProductionGI({
        warehouseId: values.warehouseId,
        customerId: values.customerId,
        address: values.address,
        items: values.items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitId: i.unitId,
        })),
      });

      message.success("Tạo phiếu xuất kho sản xuất thành công");

      form.resetFields();
      onSuccess();
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.message || "Tạo phiếu xuất kho thất bại");
    } finally {
      setLoading(false);
    }
  };

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
  const selectedWarehouseType = selectedWarehouse?.warehouseType;

  return (
    <Modal
      open={open}
      title="Tạo phiếu xuất kho Sản Xuất"
      onCancel={onCancel}
      width={750}
      footer={null}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
      >
        {/* ===================== WAREHOUSE ===================== */}
        <Form.Item
          name="warehouseId"
          label="Kho xuất"
          rules={[
            {
              required: true,
              message: "Vui lòng chọn kho xuất",
            },
          ]}
        >
          <Select 
            placeholder="Chọn kho"
            onChange={(val) => {
              setWarehouseId(val);
              form.setFieldValue("items", [{}]);
              setInventoryMap({});
              
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

        <Row gutter={16}>
          <Col span={12}>
            {/* ===================== CUSTOMER ===================== */}
            <Form.Item
              name="customerId"
              label="Khách hàng"
            >
              <Select
                placeholder="Chọn khách hàng (tùy chọn)"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    ?.toLowerCase()
                    .includes(input.toLowerCase())
                }
                onChange={(val) => {
                  if (val) {
                    const customer = customers.find(c => c.id === val);
                    if (customer?.address) {
                      form.setFieldValue("address", customer.address);
                    }
                  }
                }}
              >
                {customers.map((c) => (
                  <Select.Option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            {/* ===================== ADDRESS ===================== */}
            <Form.Item
              name="address"
              label="Địa chỉ"
            >
              <Input placeholder="Nhập địa chỉ giao hàng (tùy chọn)" />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Chi tiết sản phẩm xuất</Divider>

        {/* ===================== ITEMS ===================== */}
        <Form.List name="items" initialValue={[{}]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row
                  key={key}
                  gutter={8}
                  align="bottom"
                  style={{ marginBottom: 12 }}
                >
                  {/* PRODUCT */}
                  <Col span={10}>
                    <Form.Item
                      {...restField}
                      name={[name, "productId"]}
                      label="Sản phẩm"
                      rules={[{ required: true, message: "Chọn sản phẩm" }]}
                    >
                      <Select
                        placeholder={warehouseId ? "Chọn sản phẩm" : "Vui lòng chọn kho trước"}
                        disabled={!warehouseId}
                        showSearch
                        optionFilterProp="label"
                        optionLabelProp="label"
                        onChange={(val) => {
                          form.setFieldValue(["items", name, "unitId"], undefined);
                          const defaultUnit = products.find(p => p.id === val)?.unitId;
                          const currentProductId = val;

                          if (!productUomsMap[currentProductId]) {
                            productApi.getUoms(currentProductId).then(res => {
                              setProductUomsMap(prev => ({ ...prev, [currentProductId]: res.data }));
                              const latestProductId = form.getFieldValue(["items", name, "productId"]);
                              if (latestProductId === currentProductId) {
                                form.setFieldValue(["items", name, "unitId"], defaultUnit);
                              }
                            }).catch(() => {
                              setProductUomsMap(prev => ({ ...prev, [currentProductId]: [] }));
                            });
                          } else {
                            form.setFieldValue(["items", name, "unitId"], defaultUnit);
                          }
                        }}
                      >
                        {selectedWarehouseType !== 1 && (
                          <Select.OptGroup label="Nguyên vật liệu">
                            {products
                              .filter((p) => p.type === 0)
                              .map((p) => (
                                <Select.Option key={p.id} value={p.id} label={`${p.code} - ${p.name}`}>
                                  <div style={{ display: 'flex', flexDirection: 'column', padding: "4px 0" }}>
                                    <span style={{ fontWeight: 500 }}>{p.code} - {p.name}</span>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      Tồn kho khả dụng: <Text strong type={inventoryMap[p.id] > 0 ? "success" : "danger"}>{inventoryMap[p.id] || 0}</Text>
                                    </Text>
                                  </div>
                                </Select.Option>
                              ))}
                          </Select.OptGroup>
                        )}

                        {selectedWarehouseType === 1 && (
                          <Select.OptGroup label="Thành phẩm">
                            {products
                              .filter((p) => p.type === 1)
                              .map((p) => (
                                <Select.Option key={p.id} value={p.id} label={`${p.code} - ${p.name}`}>
                                  <div style={{ display: 'flex', flexDirection: 'column', padding: "4px 0" }}>
                                    <span style={{ fontWeight: 500 }}>{p.code} - {p.name}</span>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                      Tồn kho khả dụng: <Text strong type={inventoryMap[p.id] > 0 ? "success" : "danger"}>{inventoryMap[p.id] || 0}</Text>
                                    </Text>
                                  </div>
                                </Select.Option>
                              ))}
                          </Select.OptGroup>
                        )}
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* QUANTITY */}
                  <Col span={6}>
                    <Form.Item
                      {...restField}
                      name={[name, "quantity"]}
                      label="Số lượng"
                      rules={[
                        { required: true, message: "Nhập SL" },
                        {
                          type: "number",
                          min: 1,
                          message: "Phải lớn hơn 0",
                        },
                      ]}
                    >
                      <InputNumber
                        min={1}
                        precision={0}
                        style={{ width: "100%" }}
                        placeholder="Số lượng"
                      />
                    </Form.Item>
                  </Col>

                  {/* UNIT */}
                  <Col span={6}>
                    <Form.Item
                      shouldUpdate={(prevValues, currentValues) => {
                        return prevValues.items?.[name]?.productId !== currentValues.items?.[name]?.productId;
                      }}
                      noStyle
                    >
                      {() => {
                        const productId = form.getFieldValue(["items", name, "productId"]);
                        const defaultUnitId = products.find(p => p.id === productId)?.unitId;
                        const uoms = productUomsMap[productId] || [];

                        return (
                          <Form.Item
                            {...restField}
                            name={[name, "unitId"]}
                            label="ĐVT"
                            rules={[{ required: true, message: "Chọn ĐVT" }]}
                          >
                            <Select placeholder="ĐVT" style={{ width: "100%" }}>
                              {uoms.length > 0 ? (
                                uoms.map((u: any) => {
                                  const unitName = units.find(un => un.id === u.unitId)?.name || u.unitName || u.unitId;
                                  return (
                                    <Select.Option key={u.unitId} value={u.unitId}>
                                      {unitName}
                                    </Select.Option>
                                  );
                                })
                              ) : (
                                defaultUnitId && (
                                  <Select.Option value={defaultUnitId}>
                                    {units.find(u => u.id === defaultUnitId)?.name || defaultUnitId}
                                  </Select.Option>
                                )
                              )}
                            </Select>
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                  </Col>

                  {/* REMOVE */}
                  <Col span={2}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      style={{ marginBottom: 24 }}
                    />
                  </Col>
                </Row>
              ))}

              {/* ADD ROW */}
              <Button
                type="dashed"
                onClick={() => add()}
                block
                icon={<PlusOutlined />}
                style={{ marginTop: 8 }}
              >
                Thêm dòng
              </Button>
            </>
          )}
        </Form.List>

        {/* ================= ACTION ================= */}
        <div style={{ textAlign: "right", marginTop: 24 }}>
          <Space>
            <Button onClick={onCancel}>Hủy</Button>
            <Button
              type="primary"
              loading={loading}
              onClick={submit}
            >
              Tạo phiếu
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
}
