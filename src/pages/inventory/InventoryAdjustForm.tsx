import { Button, Form, InputNumber, Input, Select, message, Modal } from "antd";
import { useEffect, useState } from "react";
import { warehouseApi } from "../../api/warehouse.api";
import { locationApi } from "../../api/location.api";
import { productApi } from "../../api/product.api";
import { inventoryApi } from "../../api/inventory.api";
import type { WarehouseDto } from "../../types/warehouse";
import type { Product } from "../../types/product";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ACTION_TYPES = [
  { label: "Nhập hàng", value: "Receive" },
  { label: "Xuất hàng", value: "Issue" },
  { label: "Điều chỉnh (+)", value: "AdjustIncrease" },
  { label: "Điều chỉnh (-)", value: "AdjustDecrease" },
  { label: "Kiểm kê", value: "StockCount" },
];

export default function InventoryAdjustForm({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      warehouseApi.query(1, 100).then(res => setWarehouses(res.data.items));
      productApi.getAll().then(res => setProducts(res.data));
    } else {
      form.resetFields(); // Reset form khi đóng pop-up
    }
  }, [open, form]);

  const onWarehouseChange = async (id: string) => {
    form.setFieldsValue({ locationId: undefined });
    const res = await locationApi.list(id);
    setLocations(res.data);
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      await inventoryApi.adjust(values);
      message.success("Thành công");
      onSuccess();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Lỗi thao tác");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Điều chỉnh kho"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      destroyOnClose
      width={400}
      okText="Xác nhận"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" onFinish={onFinish} size="middle">
        <Form.Item label="Kho" name="warehouseId" rules={[{ required: true }]}>
          <Select 
            placeholder="Chọn kho"
            onChange={onWarehouseChange} 
            options={warehouses.map(w => ({ label: w.name, value: w.id }))} 
          />
        </Form.Item>

        <Form.Item label="Vị trí" name="locationId" rules={[{ required: true }]}>
          <Select 
            placeholder="Chọn vị trí"
            options={locations.map(l => ({ label: l.code, value: l.id }))} 
            disabled={!locations.length}
          />
        </Form.Item>

        <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true }]}>
          <Select 
            showSearch 
            placeholder="Chọn sản phẩm"
            optionFilterProp="label" 
            options={products.map(p => ({ label: p.name, value: p.id }))} 
          />
        </Form.Item>

        <Form.Item label="Loại nghiệp vụ" name="actionType" rules={[{ required: true }]}>
          <Select placeholder="Chọn loại" options={ACTION_TYPES} />
        </Form.Item>

        <Form.Item label="Số lượng" name="qtyChange" rules={[{ required: true }]}>
          <InputNumber style={{ width: "100%" }} placeholder="Nhập số lượng" />
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <Input placeholder="Không bắt buộc" />
        </Form.Item>
      </Form>
    </Modal>
  );
}