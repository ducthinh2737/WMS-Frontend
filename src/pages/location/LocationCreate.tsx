import { Form, Input, Modal, message, Select, Switch, Space } from "antd";
import { useState } from "react";
import { locationApi } from "../../api/location.api";

interface Props {
  open: boolean;
  warehouseId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const LocationTypeOptions = [
  { value: 1, label: "Khu vực tiếp nhận" },
  { value: 2, label: "Khu vực lưu trữ" },
  { value: 3, label: "Khu vực xuất hàng" },
  { value: 4, label: "Khu vực hàng hỏng" },
  { value: 5, label: "Khu vực hàng trả" }
];

export default function LocationCreateModal({ open, warehouseId, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await locationApi.create(warehouseId, {
        ...values,
        warehouseId: warehouseId,
      });
      message.success("Tạo vị trí thành công");
      form.resetFields();
      onSuccess();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Tạo vị trí thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Thêm vị trí lưu trữ mới"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ type: 2, isActive: true }}>
        <Form.Item
          label="Mã vị trí"
          name="code"
          rules={[
            { required: true, message: "Vui lòng nhập mã vị trí" },
            { pattern: /^[A-Z]\d-\d{2}-\d{2}$/, message: "Định dạng đúng: A1-01-03" },
          ]}
        >
          <Input placeholder="Ví dụ: A1-01-03" />
        </Form.Item>

        <Form.Item label="Loại vị trí" name="type" rules={[{ required: true }]}>
          <Select options={LocationTypeOptions} />
        </Form.Item>

        <Form.Item label="Mô tả" name="description">
          <Input.TextArea rows={2} placeholder="Không bắt buộc" />
        </Form.Item>

        <Form.Item label="Trạng thái hoạt động" name="isActive" valuePropName="checked">
          <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
        </Form.Item>
      </Form>
    </Modal>
  );
}