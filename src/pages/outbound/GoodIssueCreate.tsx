import {
  Card,
  Button,
  Form,
  InputNumber,
  Select,
  Table,
  message,
  Typography,
  Space,
  Divider
} from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { outboundApi } from "../../api/outbound.api";
import { goodsIssueApi } from "../../api/goodissue.api";
import { warehouseApi } from "../../api/warehouse.api";
import { locationApi } from "../../api/location.api";
import { inventoryApi } from "../../api/inventory.api";

const { Text, Title } = Typography;

export default function GoodsIssueCreate() {
  const [form] = Form.useForm();
  const [search] = useSearchParams();
  const soId = search.get("soId");
  const navigate = useNavigate();

  const [items, setItems] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationInventoryMap, setLocationInventoryMap] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!soId) {
      message.error("Không tìm thấy mã đơn hàng (soId)");
      return;
    }
    loadSO();
    loadWarehouses();
  }, [soId]);

  const loadSO = async () => {
    try {
      const res = await outboundApi.getOrder(soId!);
      setItems(res.data.items || []);
    } catch {
      message.error("Lỗi tải thông tin đơn bán hàng");
    }
  };

  const loadWarehouses = async () => {
    try {
      const res = await warehouseApi.query(1, 50);
      setWarehouses(res.data.items || []);
    } catch {
      message.error("Lỗi tải danh sách kho");
    }
  };

  const handleWarehouseChange = async (whId: string) => {
    setWarehouseId(whId);
    setLocations([]);
    setLocationInventoryMap({});
    form.setFieldsValue({ warehouseId: whId });

    // Reset location & qty
    const formValues = form.getFieldsValue();
    Object.keys(formValues).forEach(key => {
      if (key.startsWith("location_") || key.startsWith("qty_")) {
        form.setFieldValue(key, undefined);
      }
    });

    try {
      // Load locations
      const locRes = await locationApi.list(whId);
      setLocations(locRes.data || []);

      if (!locRes.data.length) message.warning("Kho chưa có vị trí (location) nào");

      // Load tồn kho từng location cho từng product
      const invRes = await inventoryApi.query({
        warehouseId: whId,
        productIds: items.map(i => i.productId)
      });

      const map: Record<number, any[]> = {};
      items.forEach((i) => {
        const invs = invRes.data
          .filter((x: any) => x.productId === i.productId)
          .map((x: any) => ({ locationId: x.locationId, code: x.locationCode, qty: x.availableQuantity }));
        map[i.productId] = invs;
      });
      setLocationInventoryMap(map);
    } catch {
      message.error("Lỗi tải vị trí / tồn kho kho này");
    }
  };

  const submit = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        outboundOrderId: soId,
        warehouseId: values.warehouseId,
        items: items.map((i) => ({
          productId: i.productId,
          locationId: values[`location_${i.productId}`],
          quantity: values[`qty_${i.productId}`],
        })),
      };
      await goodsIssueApi.create(payload);
      message.success("Tạo phiếu xuất kho thành công");
      navigate("/sales/orders");
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi tạo phiếu xuất kho");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={<Title level={4}>Lập phiếu xuất kho</Title>}>
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item
          label="Kho xuất hàng"
          name="warehouseId"
          rules={[{ required: true, message: "Vui lòng chọn kho" }]}
          style={{ width: 350 }}
        >
          <Select
            placeholder="Chọn kho"
            onChange={handleWarehouseChange}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          />
        </Form.Item>

        <Divider />

        <Table
          pagination={false}
          rowKey="productId"
          dataSource={items}
          bordered
          columns={[
            { title: "Sản phẩm", dataIndex: "productName", key: "productName" },
            { title: "SL Đơn hàng", dataIndex: "quantity", key: "quantity", align: "center" },
            {
              title: "Vị trí lấy hàng (Location)",
              key: "location",
              width: 300,
              render: (_, record) => {
                const options = (locationInventoryMap[record.productId] || []).map(loc => ({
                  value: loc.locationId,
                  label: `${loc.code} (tồn: ${loc.qty})`,
                  qty: loc.qty
                }));
                return (
                  <Form.Item
                    name={`location_${record.productId}`}
                    style={{ margin: 0 }}
                    rules={[{ required: true, message: "Chọn vị trí" }]}
                  >
                    <Select
                      placeholder={warehouseId ? "Chọn vị trí" : "Vui lòng chọn kho trước"}
                      disabled={!warehouseId || !options.length}
                      options={options}
                      onChange={(locId) => {
                        // Khi chọn location mới, set max cho SL
                        const selectedLoc = options.find(o => o.value === locId);
                        const currentQty = form.getFieldValue(`qty_${record.productId}`) || 0;
                        if (currentQty > selectedLoc?.qty) {
                          form.setFieldValue(`qty_${record.productId}`, selectedLoc?.qty || 0);
                        }
                      }}
                    />
                  </Form.Item>
                );
              }
            },
            {
              title: "SL Xuất",
              key: "qty",
              width: 150,
              render: (_, record) => {
                const selectedLocId = form.getFieldValue(`location_${record.productId}`);
                const maxQty = locationInventoryMap[record.productId]?.find(l => l.locationId === selectedLocId)?.qty ?? 0;
                return (
                  <Form.Item
                    name={`qty_${record.productId}`}
                    style={{ margin: 0 }}
                    initialValue={record.quantity}
                    rules={[{ required: true, message: "Nhập SL" }]}
                  >
                    <InputNumber min={1} max={maxQty} style={{ width: "100%" }} />
                  </Form.Item>
                );
              }
            }
          ]}
        />

        <div style={{ marginTop: 24, textAlign: "right" }}>
          <Space>
            <Button onClick={() => navigate(-1)}>Hủy bỏ</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!warehouseId || items.length === 0}
            >
              Hoàn tất xuất kho
            </Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
}

