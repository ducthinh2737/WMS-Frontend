import { Form, Input, Button, Switch, message, Modal } from "antd";
import { userApi } from "../../api/user.api";
import { useState } from "react";

interface Props {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void; // Gọi để load lại danh sách sau khi tạo xong
}

export default function UserCreateModal({ open, onCancel, onSuccess }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const payload = {
                fullName: values.fullName,
                email: values.email,
                password: values.password,
                isActive: values.isActive ?? true,
            };

            await userApi.create(payload);
            message.success("User created successfully");
            form.resetFields(); // Xóa dữ liệu cũ trong form
            onSuccess(); // Đóng modal và load lại data ở trang List
        } catch (err) {
            message.error("Failed to create user");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Create New User"
            open={open}
            onCancel={onCancel}
            footer={null} // Để dùng nút Submit của Form
            destroyOnHidden // Xóa trắng form mỗi khi đóng/mở lại
        >
            <Form 
                form={form} 
                layout="vertical" 
                onFinish={onFinish} 
                initialValues={{ isActive: true }}
            >
                <Form.Item
                    label="Full Name"
                    name="fullName"
                    rules={[{ required: true, message: "Please enter full name" }]}
                >
                    <Input placeholder="Enter full name" />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: "Please enter email" },
                        { type: "email", message: "Invalid email" }
                    ]}
                >
                    <Input placeholder="Enter email" />
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: "Please enter password" }]}
                >
                    <Input.Password placeholder="Enter password" />
                </Form.Item>

                <Form.Item label="Active" name="isActive" valuePropName="checked">
                    <Switch />
                </Form.Item>

                <div style={{ textAlign: 'right' }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }}>
                        Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Create
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}
