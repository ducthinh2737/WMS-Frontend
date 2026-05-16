import { useEffect, useState } from "react";
import { Form, Input, Button, message, Switch, Drawer, Space, Spin } from "antd";
import { userApi } from "../../api/user.api";
import type { UpdateUserDto } from "../../types/user";

interface Props {
  open: boolean;
  userId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserEditDrawer({ open, userId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (open && userId) {
      loadUser();
    } else {
      form.resetFields();
    }
  }, [open, userId]);

  const loadUser = async () => {
    setFetching(true);
    try {
      const res = await userApi.getById(Number(userId));
      const data: UpdateUserDto = res.data;
      form.setFieldsValue({
        fullName: data.fullName,
        email: data.email,
        isActive: data.isActive,
      });
    } catch (err) {
      message.error("Không thể tải thông tin người dùng");
      onClose();
    } finally {
      setFetching(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const dto: UpdateUserDto = {
        fullName: values.fullName,
        email: values.email,
        isActive: values.isActive,
        password: values.password || undefined,
      };

      await userApi.update(Number(userId), dto);
      message.success("Cập nhật thành công");
      onSuccess();
    } catch (err) {
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="Chỉnh sửa thông tin người dùng"
      width={400}
      onClose={onClose}
      open={open}
      bodyStyle={{ paddingBottom: 80 }}
      extra={
        <Space>
          <Button onClick={onClose}>Hủy</Button>
          <Button onClick={() => form.submit()} type="primary" loading={loading}>
            Lưu thay đổi
          </Button>
        </Space>
      }
    >
      <Spin spinning={fetching}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item 
            label="Họ và tên" 
            name="fullName" 
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item 
            label="Email" 
            name="email" 
            rules={[{ required: true, type: "email", message: 'Email không hợp lệ' }]}
          >
            <Input placeholder="example@mail.com" />
          </Form.Item>

          <Form.Item 
            label="Mật khẩu mới" 
            name="password"
            help="Để trống nếu không muốn đổi mật khẩu"
          >
            <Input.Password placeholder="********" />
          </Form.Item>

          <Form.Item 
            label="Trạng thái hoạt động" 
            name="isActive" 
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Spin>
    </Drawer>
  );
}
