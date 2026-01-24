import { Form, Select, InputNumber, Button, message, Input, Space, Modal } from "antd";
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { purchaseApi } from "../../api/purchase.api";
import { productApi } from "../../api/product.api";
import { supplierApi } from "../../api/supplier.api";
import { warehouseApi } from "../../api/warehouse.api";
import type { Product } from "../../types/product";
import type { SupplierDto } from "../../types/supplier";
import type { WarehouseDto } from "../../types/warehouse";

interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function PurchaseCreateModal({ open, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      fetchInitialData();
    } else {
      form.resetFields();
      setSelectedSupplierId(null);
    }
  }, [open]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [suppRes, whRes] = await Promise.all([
        supplierApi.getAll(),
        warehouseApi.query(1, 999),
      ]);
      setSuppliers(suppRes.data);
      setWarehouses(whRes.data.items);
    } catch {
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };


const handleSupplierChange = async (supplierId: number) => {
  setSelectedSupplierId(supplierId);
  form.setFieldsValue({ items: [] });

  try {
    setLoadingProducts(true);

    // 1️⃣ Lấy tất cả MATERIAL
    const prodRes = await productApi.getAllByType(0); // 0 = Material

    // 2️⃣ Lọc theo supplier
    const filtered = prodRes.data.filter(
  p => p.supplierId === Number(supplierId)
  
);


    setProducts(filtered);
  } catch {
    message.error("Không thể tải sản phẩm");
  } finally {
    setLoadingProducts(false);
  }
};


  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!values.items || values.items.length === 0) {
        return message.error("Vui lòng thêm ít nhất một sản phẩm");
      }

      setLoading(true);
      await purchaseApi.createPOs({
        ...values,
        items: values.items.map((i: any) => ({ ...i, productId: String(i.productId) }))
      });
      message.success("Tạo đơn mua hàng thành công!");
      onSuccess();
    } catch (err: any) {
      if (err.errorFields) return; // Form validation failed
      message.error(err?.response?.data?.message || "Tạo thất bại");
    } finally {
      setLoading(false);
    }
  };

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
    >
      <Form form={form} layout="vertical">
        <Space style={{ display: "flex" }} align="baseline">
          <Form.Item label="Nhà cung cấp" name="supplierId" rules={[{ required: true }]} style={{ width: 300 }}>
            <Select placeholder="Chọn nhà cung cấp" onChange={handleSupplierChange}>
              {suppliers.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Mã PO" name="code" rules={[{ required: true }]} style={{ width: 300 }}>
            <Input placeholder="VD: PO20260001" />
          </Form.Item>
        </Space>

        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: "flex", marginBottom: 8 }} align="baseline">
                  <Form.Item {...restField} name={[name, "productId"]} rules={[{ required: true }]} >
                    <Select style={{ width: 220 }} placeholder="Sản phẩm" loading={loadingProducts} disabled={!selectedSupplierId}>
                      {products.map(p => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "warehouseId"]} rules={[{ required: true }]} >
                    <Select style={{ width: 180 }} placeholder="Kho nhận">
                      {warehouses.map(w => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
                    </Select>
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "quantity"]} rules={[{ required: true }]} >
                    <InputNumber min={1} placeholder="SL" style={{ width: 80 }} />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, "price"]} rules={[{ required: true }]} >
                    <InputNumber min={0} placeholder="Giá" style={{ width: 120 }} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red" }} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} disabled={!selectedSupplierId}>
                Thêm sản phẩm
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}