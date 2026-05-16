import {
  Modal,
  Form,
  InputNumber,
  Button,
  Space,
  message,
  Select,
  Row,
  Col,
  Divider,
} from "antd";

import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

import { inboundApi } from "../../api/inbound.api";
import { warehouseApi } from "../../api/warehouse.api";
import { productApi } from "../../api/product.api";

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

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // ================= LOAD DATA =================
  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    const fetchData = async () => {
      try {
        const [whRes, prodRes] = await Promise.all([
          // ✅ GET ALL WAREHOUSES (FIX HERE)
          warehouseApi.query(1, 1000),

          // PRODUCTS
          productApi.getAll(),
        ]);

        setWarehouses(whRes.data.items || []);
        setProducts(prodRes.data || []);
      } catch {
        message.error("Không thể tải dữ liệu danh mục");
      }
    };

    fetchData();
  }, [open, form]);

  // ================= SUBMIT =================
  const onSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!values.items || values.items.length === 0) {
        message.warning("Vui lòng thêm sản phẩm");
        return;
      }

      setLoading(true);

      const payload = {
        warehouseId: values.warehouseId,
        code: "",
        receiptType: 1,
        productionReceiptItems: values.items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          lotCode: "",
          status: 1,
        })),
      };

      await inboundApi.createGR(payload);

      message.success("Tạo phiếu nhập thành công");

      form.resetFields();
      onSuccess();
    } catch (error: any) {
      const apiErrors = error.response?.data?.errors;

      if (apiErrors) {
        message.error(
          "Lỗi dữ liệu: " +
          Object.values(apiErrors).flat().join(", ")
        );
      } else {
        message.error(error.response?.data?.message || "Thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedWarehouseId = Form.useWatch("warehouseId", form);
  const selectedWarehouse = warehouses.find((w) => w.id === selectedWarehouseId);

  const filteredProducts = products.filter((p) => {
    if (!selectedWarehouse) return true; // Nếu chưa chọn kho thì hiện hết hoặc rỗng tùy ý (đây chọn hiện hết)

    // Quy tắc lọc:
    // WarehouseType: 0 (RawMaterial), 2 (Auxiliary), 3 (Chemical) -> ProductType: 0 (Material)
    // WarehouseType: 1 (FinishedGoods) -> ProductType: 1 (Production)
    if (selectedWarehouse.warehouseType === 1) {
      return p.type === 1;
    }
    return p.type === 0;
  });

  // ================= RENDER =================
  return (
    <Modal
      open={open}
      title="Tạo phiếu nhập Sản Xuất"
      onCancel={onCancel}
      width={750}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">

        {/* ================= WAREHOUSE ================= */}
        <Form.Item
          name="warehouseId"
          label="Kho nhận"
          rules={[
            {
              required: true,
              message: "Chọn kho",
            },
          ]}
        >
          <Select
            placeholder="Chọn kho"
            onChange={() => {
              // Reset items when warehouse changes to avoid invalid product-warehouse combination
              form.setFieldValue("items", [{}]);
            }}
          >
            {warehouses.map((w) => (
              <Select.Option key={w.id} value={w.id}>
                {w.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Chi tiết sản phẩm</Divider>

        {/* ================= ITEMS ================= */}
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
                  <Col span={14}>
                    <Form.Item
                      {...restField}
                      name={[name, "productId"]}
                      label="Sản phẩm"
                      rules={[{ required: true }]}
                    >
                      <Select
                        showSearch
                        optionFilterProp="children"
                        placeholder={selectedWarehouseId ? "Chọn sản phẩm" : "Vui lòng chọn kho trước"}
                        disabled={!selectedWarehouseId}
                        filterOption={(input, option) =>
                          (option?.children as unknown as string)
                            ?.toLowerCase()
                            .includes(input.toLowerCase())
                        }
                      >
                        {filteredProducts.map((p) => (
                          <Select.Option key={p.id} value={p.id}>
                            {p.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  {/* QUANTITY */}
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, "quantity"]}
                      label="Số lượng"
                      rules={[
                        { required: true },
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
                      />
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
              onClick={onSubmit}
            >
              Tạo phiếu
            </Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
}
