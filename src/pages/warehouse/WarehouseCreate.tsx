import { Button, Form, Input, message, Modal, Select } from "antd";
import { useState } from "react";
import { warehouseApi } from "../../api/warehouse.api";

interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function WarehouseCreateModal({ open, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const warehouseTypeOptions = [
  { value: "RawMaterial", label: "Kho nguyên vật liệu" },
  { value: "FinishedGoods", label: "Kho thành phẩm" },
  { value: "Auxiliary", label: "Kho phụ liệu" },
  { value: "Chemical", label: "Kho hóa chất" },
];

  const onFinish = async (values: any) => {
  setLoading(true);
  try {
    await warehouseApi.create({
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      address: values.address?.trim() || null,
      warehouseType: values.warehouseType, // 👈 thêm dòng này
    });
    message.success("Tạo kho thành công!");
    form.resetFields();
    onSuccess();
  } catch (err: any) {
    message.error(err.response?.data?.message || "Tạo kho thất bại");
  } finally {
    setLoading(false);
  }
};


  return (
    <Modal
      title="Tạo kho mới"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      okText="Tạo kho"
      cancelText="Hủy"
      centered
      destroyOnClose
    >
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onFinish}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          label="Mã kho"
          name="code"
          rules={[
            { required: true, message: "Vui lòng nhập mã kho" },
            {
              pattern: /^[A-Z0-9-]+$/,
              message: "Chỉ được dùng chữ hoa, số và dấu gạch ngang (-)",
            },
          ]}
        >
          <Input placeholder="Ví dụ: HCM-01" maxLength={20} />
        </Form.Item>

        <Form.Item
          label="Tên kho"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên kho" }]}
        >
          <Input placeholder="Ví dụ: Kho Tổng Miền Nam" />
        </Form.Item>
        <Form.Item
          label="Loại kho"
          name="warehouseType"
          rules={[{ required: true, message: "Vui lòng chọn loại kho" }]}
        >
          <Select
            placeholder="Chọn loại kho"
            options={warehouseTypeOptions}
          />
        </Form.Item>
        <Form.Item label="Địa chỉ" name="address">
          <Input.TextArea
            rows={3}
            placeholder="Nhập địa chỉ chi tiết..."
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}