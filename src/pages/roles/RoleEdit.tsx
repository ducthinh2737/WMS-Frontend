import { Form, Input, Modal, message, Spin } from "antd";
import { roleApi } from "../../api/role.api";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  roleId?: number; // Nhận ID từ trang cha truyền vào
  onCancel: () => void;
  onSuccess: () => void;
}

export default function RoleEditModal({ open, roleId, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false); // Loading khi bấm Save
  const [fetching, setFetching] = useState(false); // Loading khi đang tải dữ liệu cũ

  // Tự động load dữ liệu mỗi khi mở Modal và có roleId
  useEffect(() => {
    if (open && roleId) {
      loadRole();
    } else {
      form.resetFields();
    }
  }, [open, roleId]);

  const loadRole = async () => {
    setFetching(true);
    try {
      const res = await roleApi.get(Number(roleId));
      form.setFieldsValue(res.data);
    } catch (err) {
      message.error("Không thể lấy thông tin quyền");
      onCancel();
    } finally {
      setFetching(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await roleApi.update(Number(roleId), values);
      message.success("Cập nhật thành công");
      onSuccess();
    } catch (err) {
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Role"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()} // Tận dụng nút của Modal
      confirmLoading={loading}
      okText="Save"
      cancelText="Cancel"
      destroyOnHidden
    >
      <Spin spinning={fetching}>
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          style={{ marginTop: 20 }}
        >
          <Form.Item 
            label="Role Name" 
            name="roleName" 
            rules={[{ required: true, message: "Vui lòng nhập tên quyền" }]}
          >
            <Input placeholder="Enter role name..." />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
