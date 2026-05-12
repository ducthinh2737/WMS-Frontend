import {
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Space,
  Divider,
  message,
  Row,
  Col,
  Typography,
  Tag,
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

interface ItemRowProps {
  name: number;
  rest: any;
  form: ReturnType<typeof Form.useForm>[0];
  fromLocations: any[];
  toLocations: any[];
  products: any[];
  inventoryMap: Record<string, number>;
  locationQtyMap: Record<string, number>;
  onRemove: () => void;
  showLabel: boolean;
}

function ItemRow({
  name,
  rest,
  form,
  fromLocations,
  toLocations,
  products,
  inventoryMap,
  locationQtyMap,
  onRemove,
  showLabel,
}: ItemRowProps) {
  const productId      = Form.useWatch(["items", name, "productId"],      form);
  const fromLocationId = Form.useWatch(["items", name, "fromLocationId"], form);

  const mapKey = `${String(fromLocationId)}-${String(productId)}`;
  const availableQty =
    productId != null && fromLocationId != null
      ? (inventoryMap[mapKey] ?? 0)
      : 0;

  const noStock = productId != null && fromLocationId != null && availableQty === 0;

  return (
    <Row gutter={12} align="bottom" style={{ marginBottom: 8 }}>

      {/* ── Sản phẩm ── */}
      <Col span={6}>
        <Form.Item
          {...rest}
          label={showLabel ? "Sản phẩm" : undefined}
          name={[name, "productId"]}
          rules={[{ required: true, message: "Chọn sản phẩm" }]}
        >
          <Select showSearch optionFilterProp="children" placeholder="Chọn sản phẩm">
            {products.map((p) => (
              <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      {/* ── Vị trí nguồn ── */}
      <Col span={7}>
        <Form.Item
          {...rest}
          label={showLabel ? "Vị trí nguồn" : undefined}
          name={[name, "fromLocationId"]}
          rules={[{ required: true, message: "Chọn vị trí nguồn" }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder="Chọn vị trí"
            popupMatchSelectWidth={false}
            style={{ width: "100%" }}
            optionLabelProp="label"
          >
            {fromLocations.map((l) => {
              const qty = locationQtyMap[String(l.id)] ?? 0;
              return (
                <Select.Option key={l.id} value={l.id} label={l.code ?? l.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span>{l.code ?? l.name}</span>
                    <Tag
                      color={qty > 0 ? "blue" : "default"}
                      style={{ margin: 0, flexShrink: 0 }}
                    >
                      {qty > 0 ? `Tồn: ${qty}` : "Trống"}
                    </Tag>
                  </div>
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
      </Col>

      {/* ── Vị trí đích ── */}
      <Col span={5}>
        <Form.Item
          {...rest}
          label={showLabel ? "Vị trí đích" : undefined}
          name={[name, "toLocationId"]}
          rules={[{ required: true, message: "Chọn vị trí đích" }]}
        >
          <Select
            showSearch
            optionFilterProp="children"
            placeholder="Chọn vị trí"
            popupMatchSelectWidth={false}
            style={{ width: "100%" }}
          >
            {toLocations.map((l) => (
              <Select.Option key={l.id} value={l.id}>{l.code ?? l.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      {/* ── Số lượng ── */}
      <Col span={4}>
        <Form.Item
          {...rest}
          label={
            showLabel ? (
              <span>
                Số lượng{" "}
                {availableQty > 0 && (
                  <Text type="secondary" style={{ fontWeight: 400 }}>
                    (KD: {availableQty})
                  </Text>
                )}
              </span>
            ) : (
              // label ẩn ở dòng 2+ nhưng vẫn hiển thị KD
              availableQty > 0 ? (
                <Text type="secondary" style={{ fontWeight: 400, fontSize: 12 }}>
                  KD: {availableQty}
                </Text>
              ) : undefined
            )
          }
          name={[name, "quantity"]}
          rules={[
            { required: true, message: "Nhập số lượng" },
            {
              validator(_, val) {
                if (productId == null || fromLocationId == null)
                  return Promise.resolve();
                // ✅ Chỉ chặn khi vượt tồn, không chặn khi = 0
                if (val && Number(val) > availableQty && availableQty > 0)
                  return Promise.reject(`Vượt tồn khả dụng (${availableQty})`);
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            min={0.01}
            style={{
              width: "100%",
              // ✅ Viền cam khi không có hàng tại vị trí này
              ...(noStock && { borderColor: "#fa8c16" }),
            }}
            placeholder="0"
            status={noStock ? "warning" : undefined}
          />
        </Form.Item>

        {/* ✅ Cảnh báo mềm — không block submit */}
        {noStock && (
          <div style={{ marginTop: -20, marginBottom: 8 }}>
            <Text type="warning" style={{ fontSize: 12 }}>
              ⚠ Sản phẩm này chưa có tồn tại vị trí đã chọn
            </Text>
          </div>
        )}
      </Col>

      {/* ── Xóa dòng ── */}
      <Col
        span={2}
        style={{ paddingBottom: showLabel ? 24 : 8, textAlign: "center" }}
      >
        <MinusCircleOutlined
          style={{ fontSize: 18, color: "#ff4d4f", cursor: "pointer" }}
          onClick={onRemove}
        />
      </Col>
    </Row>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function TransferCreateForm({ onSuccess, onCancel }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [warehouses,     setWarehouses]     = useState<any[]>([]);
  const [products,       setProducts]       = useState<any[]>([]);
  const [fromLocations,  setFromLocations]  = useState<any[]>([]);
  const [toLocations,    setToLocations]    = useState<any[]>([]);
  const [inventoryMap,   setInventoryMap]   = useState<Record<string, number>>({});
  const [locationQtyMap, setLocationQtyMap] = useState<Record<string, number>>({});

  useEffect(() => {
    warehouseApi.query(1, 100).then((res) => setWarehouses(res.data.items || res.data));
    productApi.filter({ page: 1, pageSize: 100 }).then((res) => setProducts(res.data.items || res.data));
  }, []);

  const onFromWarehouseChange = async (warehouseId: string) => {
    const [locRes, invRes] = await Promise.all([
      locationApi.list(warehouseId),
      inventoryApi.query({ warehouseId }),
    ]);

    setFromLocations(locRes.data);

    const map:    Record<string, number> = {};
    const locMap: Record<string, number> = {};

    (invRes.data || []).forEach((inv: any) => {
      const available = (inv.onHandQuantity ?? 0) - (inv.lockedQuantity ?? 0);
      const key = `${String(inv.locationId)}-${String(inv.productId)}`;
      map[key] = available;
      locMap[String(inv.locationId)] =
        (locMap[String(inv.locationId)] || 0) + available;
    });

    setInventoryMap(map);
    setLocationQtyMap(locMap);

    form.setFieldsValue({
      items: form
        .getFieldValue("items")
        ?.map((i: any) => ({ ...i, fromLocationId: undefined })),
    });
  };

  const onToWarehouseChange = async (warehouseId: string) => {
    const res = await locationApi.list(warehouseId);
    setToLocations(res.data);
    form.setFieldsValue({
      items: form
        .getFieldValue("items")
        ?.map((i: any) => ({ ...i, toLocationId: undefined })),
    });
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload: TransferOrderDto = {
        fromWarehouseId: values.fromWarehouseId,
        toWarehouseId:   values.toWarehouseId,
        note:            values.note,
        items: values.items.map((item: any) => ({
          productId:      Number(item.productId),
          fromLocationId: item.fromLocationId,
          toLocationId:   item.toLocationId,
          quantity:       Number(item.quantity),
          note:           item.itemNote,
        })),
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
          <Form.Item
            label="Từ Kho"
            name="fromWarehouseId"
            rules={[{ required: true, message: "Chọn kho nguồn" }]}
          >
            <Select onChange={onFromWarehouseChange} placeholder="Chọn kho nguồn">
              {warehouses.map((w) => (
                <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Đến Kho"
            name="toWarehouseId"
            rules={[{ required: true, message: "Chọn kho đích" }]}
          >
            <Select onChange={onToWarehouseChange} placeholder="Chọn kho đích">
              {warehouses.map((w) => (
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
            {fields.map(({ key, name, ...rest }) => (
              <ItemRow
                key={key}
                name={name}
                rest={rest}
                form={form}
                fromLocations={fromLocations}
                toLocations={toLocations}
                products={products}
                inventoryMap={inventoryMap}
                locationQtyMap={locationQtyMap}
                onRemove={() => remove(name)}
                showLabel={name === 0}
              />
            ))}

            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
              Thêm sản phẩm
            </Button>
          </>
        )}
      </Form.List>

      <Divider />

      <Row justify="end">
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu nháp
          </Button>
        </Space>
      </Row>
    </Form>
  );
}