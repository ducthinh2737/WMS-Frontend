import { Modal, Form, Input, message } from "antd";
import { useEffect, useState } from "react";
import { permissionApi } from "../../api/permission.api";

interface Props {
  open: boolean;
  data: any | null; // null là thêm mới, có data là sửa
  onCancel: () => void;
  onSuccess: () => void;
}

export default function PermissionFormModal({ open, data, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (data) form.setFieldsValue(data);
      else form.resetFields();
    }
  }, [open, data, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (data) {
        await permissionApi.update(data.id, values); // Giả định bạn có api update
        message.success("Updated successfully");
      } else {
        await permissionApi.create(values);
        message.success("Created successfully");
      }
      onSuccess();
    } catch {
      message.error("Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={data ? "Edit Permission" : "Create Permission"}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Code" name="code" rules={[{ required: true }]}>
          <Input placeholder="user.create" />
        </Form.Item>
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={3} placeholder="Mô tả chức năng" />
        </Form.Item>
      </Form>
    </Modal>
  );
}