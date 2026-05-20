import { Button, Form, InputNumber, Input, Select, message, Modal } from "antd";
import { useEffect, useState } from "react";
import { warehouseApi } from "../../api/warehouse.api";
import { locationApi } from "../../api/location.api";
import { productApi } from "../../api/product.api";
import { inventoryApi } from "../../api/inventory.api";
import type { WarehouseDto } from "../../types/warehouse";
import type { Product } from "../../types/product";
import type { InventoryAdjustRequest } from "../../types/inventory";


interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Enum backend nhận số, không string
const ACTION_TYPES = [
  { label: "Nhập hàng", value: 0 },        // Receive
  { label: "Xuất hàng", value: 1 },        // Issue
  { label: "Điều chỉnh (+)", value: 2 },   // AdjustIncrease
  { label: "Điều chỉnh (-)", value: 3 },   // AdjustDecrease
];

interface LocationDto {
  id: string;
  code: string;
}

export default function InventoryAdjustForm({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [warehouses, setWarehouses] = useState<WarehouseDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [submitting, setSubmitting] = useState(false);


  // Load kho & sản phẩm khi mở form
  useEffect(() => {
    if (!open) return;

    warehouseApi.query(1, 100).then(res => setWarehouses(res.data.items));
    productApi.getAll().then(res => setProducts(res.data));

    form.resetFields();
    setLocations([]);
  }, [open, form]);

  // Load vị trí khi chọn kho
  const onWarehouseChange = async (id: string) => {
    form.setFieldsValue({ locationId: undefined });
    try {
      const res = await locationApi.list(id);
      setLocations(res.data);
    } catch {
      setLocations([]);
    }
  };

  // Submit form
  const onFinish = async (values: any) => {
    const payload: InventoryAdjustRequest = {
      warehouseId: values.warehouseId,
      locationId: values.locationId,
      productId: values.productId,
      qtyChange: values.qtyChange,
      actionType: values.actionType, // Gửi số, backend nhận đúng
      refCode: values.refCode || null,
      note: values.note || null,
    };

    setSubmitting(true);
    try {
      await inventoryApi.adjust(payload);
      message.success("Điều chỉnh tồn kho thành công");
      

      onSuccess();
      form.resetFields();
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
      destroyOnHidden
      width={400}
      okText="Xác nhận"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical" onFinish={onFinish} size="middle">
        <Form.Item label="Kho" name="warehouseId" rules={[{ required: true, message: "Chọn kho" }]}>
          <Select
            placeholder="Chọn kho"
            onChange={onWarehouseChange}
            options={warehouses.map(w => ({ label: w.name, value: w.id }))}
          />
        </Form.Item>

        <Form.Item label="Vị trí" name="locationId" rules={[{ required: true, message: "Chọn vị trí" }]}>
          <Select
            placeholder="Chọn vị trí"
            options={locations.map(l => ({ label: l.code, value: l.id }))}
            disabled={!locations.length}
          />
        </Form.Item>

        <Form.Item label="Sản phẩm" name="productId" rules={[{ required: true, message: "Chọn sản phẩm" }]}>
          <Select
            showSearch
            placeholder="Chọn sản phẩm"
            optionFilterProp="label"
            options={products.map(p => ({ label: p.name, value: p.id }))}
          />
        </Form.Item>

        <Form.Item label="Loại nghiệp vụ" name="actionType" rules={[{ required: true, message: "Chọn loại nghiệp vụ" }]}>
          <Select placeholder="Chọn loại" options={ACTION_TYPES} />
        </Form.Item>

        <Form.Item label="Số lượng" name="qtyChange" rules={[{ required: true, message: "Nhập số lượng" }]}>
          <InputNumber min={1} style={{ width: "100%" }} placeholder="Nhập số lượng" />
        </Form.Item>

        <Form.Item label="Ghi chú" name="note">
          <Input placeholder="Không bắt buộc" />
        </Form.Item>

        <Form.Item label="Mã tham chiếu" name="refCode">
          <Input placeholder="Không bắt buộc" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
