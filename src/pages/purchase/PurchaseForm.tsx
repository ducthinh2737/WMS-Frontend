import {
  Form,
  Select,
  InputNumber,
  Button,
  message,
  Modal,
  Alert,
} from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";

import { purchaseApi } from "../../api/purchase.api";
import { productApi } from "../../api/product.api";
import { supplierApi } from "../../api/supplier.api";
import { warehouseApi } from "../../api/warehouse.api";

import type { Product } from "../../types/product";
import type { SupplierDto } from "../../types/supplier";
import type { WarehouseSimpleDto } from "../../api/warehouse.api";

interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function PurchaseCreateModal({
  open,
  onCancel,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const items = Form.useWatch("items", form) || [];

  /* ================= STATE ================= */
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseSimpleDto[]>([]);

  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /* ================= HELPERS ================= */
  const clearError = () => setSubmitError(null);

  const calcItemTotal = (item: any) =>
    (item?.quantity || 0) * (item?.price || 0);

  const totalAmount = items.reduce(
    (sum: number, i: any) => sum + calcItemTotal(i),
    0
  );

  /* ================= EFFECT ================= */
  useEffect(() => {
    if (open) {
      loadInit();
    } else {
      form.resetFields();
      setSelectedSupplierId(null);
      setSubmitError(null);
    }
  }, [open]);

  /* ================= LOAD INIT ================= */
  const loadInit = async () => {
    try {
      setLoading(true);

      const [supRes, whRes] = await Promise.all([
        supplierApi.getAll(),
        warehouseApi.getByWarehouseType({ warehousetype: 0 }),
      ]);

      setSuppliers(supRes.data);
      setWarehouses(
        whRes.data.result.map((w) => ({
          id: w.id,
          name: w.name,
        }))
      );
    } catch {
      message.error("Không thể tải dữ liệu khởi tạo");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SUPPLIER CHANGE ================= */
  const handleSupplierChange = async (supplierId: number) => {
    clearError();
    setSelectedSupplierId(supplierId);
    form.setFieldsValue({ items: [] });

    try {
      setLoadingProducts(true);
      const res = await productApi.getAllByType(0);
      setProducts(res.data.filter((p) => p.supplierId === supplierId));
    } catch {
      message.error("Không thể tải sản phẩm");
    } finally {
      setLoadingProducts(false);
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    setSubmitError(null);

    try {
      const values = await form.validateFields();

      if (!values.items?.length) {
        setSubmitError("Vui lòng thêm ít nhất một sản phẩm");
        return;
      }

      setLoading(true);

      // Không gửi code — backend tự sinh
      await purchaseApi.createPOs({
        supplierId: values.supplierId,
        code: "",
        items: values.items.map((i: any) => ({
          ...i,
          productId: String(i.productId),
        })),
      });

      message.success("Tạo đơn mua hàng thành công");
      onSuccess();
    } catch (err: any) {
      if (err?.errorFields) return;

      setSubmitError(
        err?.response?.data?.message ||
          "Không thể tạo đơn mua hàng. Vui lòng kiểm tra lại dữ liệu."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= RENDER ================= */
  return (
    <Modal
      title="Tạo đơn mua hàng mới"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={1000}
      okText="Tạo đơn"
      cancelText="Hủy"
      destroyOnClose
      maskClosable={false}
    >
      {submitError && (
        <Alert
          type="error"
          showIcon
          message="Không thể tạo đơn mua hàng"
          description={submitError}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} layout="vertical">
        {/* ===== HEADER ===== */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          <Form.Item
            label="Nhà cung cấp"
            name="supplierId"
            rules={[{ required: true }]}
            style={{ width: 300 }}
          >
            <Select
              showSearch
              placeholder="Chọn nhà cung cấp"
              optionFilterProp="label"
              onChange={handleSupplierChange}
            >
              {suppliers.map((s) => (
                <Select.Option key={s.id} value={s.id} label={s.name}>
                  {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        {/* ===== ITEMS ===== */}
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...rest }) => {
                const item = items[name] || {};
                const total = calcItemTotal(item);

                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    {/* Product */}
                    <Form.Item
                      {...rest}
                      name={[name, "productId"]}
                      rules={[{ required: true }]}
                      style={{ width: 220, marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        placeholder="Sản phẩm"
                        loading={loadingProducts}
                        disabled={!selectedSupplierId}
                        optionFilterProp="label"
                      >
                        {products.map((p) => (
                          <Select.Option key={p.id} value={p.id} label={p.name}>
                            {p.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {/* Warehouse */}
                    <Form.Item
                      {...rest}
                      name={[name, "warehouseId"]}
                      rules={[{ required: true }]}
                      style={{ width: 200, marginBottom: 0 }}
                    >
                      <Select
                        showSearch
                        placeholder="Kho vật liệu"
                        optionFilterProp="label"
                      >
                        {warehouses.map((w) => (
                          <Select.Option key={w.id} value={w.id} label={w.name}>
                            {w.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    {/* Qty */}
                    <Form.Item
                      {...rest}
                      name={[name, "quantity"]}
                      rules={[{ required: true }]}
                      style={{ width: 90, marginBottom: 0 }}
                    >
                      <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>

                    {/* Price */}
                    <Form.Item
                      {...rest}
                      name={[name, "price"]}
                      rules={[{ required: true }]}
                      style={{ width: 120, marginBottom: 0 }}
                    >
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>

                    {/* Total */}
                    <div style={{ width: 140, textAlign: "right" }}>
                      {total.toLocaleString("vi-VN")} ₫
                    </div>

                    <MinusCircleOutlined
                      style={{ color: "red" }}
                      onClick={() => remove(name)}
                    />
                  </div>
                );
              })}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => add()}
                block
                disabled={!selectedSupplierId}
              >
                Thêm sản phẩm
              </Button>
            </>
          )}
        </Form.List>
      </Form>

      {/* ===== TOTAL ===== */}
      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid #f0f0f0",
          textAlign: "right",
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        Tổng tiền:{" "}
        <span style={{ color: "#1677ff", fontSize: 18 }}>
          {totalAmount.toLocaleString("vi-VN")} ₫
        </span>
      </div>
    </Modal>
  );
}