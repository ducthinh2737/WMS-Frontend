import { Form, Input, Button, Modal, message } from "antd";
import { roleApi } from "../../api/role.api";
import { useState } from "react";

interface Props {
    open: boolean;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function RoleCreateModal({ open, onCancel, onSuccess }: Props) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await roleApi.create(values);
            message.success("Role created successfully");
            form.resetFields();
            onSuccess();
        } catch (err) {
            message.error("Failed to create role");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Create New Role"
            open={open}
            onCancel={onCancel}
            onOk={() => form.submit()} // Liên kết nút OK của Modal với Form submit
            confirmLoading={loading}
            destroyOnHidden
            okText="Create"
            cancelText="Cancel"
        >
            <Form 
                form={form} 
                layout="vertical" 
                onFinish={onFinish}
                style={{ marginTop: 20 }}
            >
                <Form.Item 
                    label="Role Name" 
                    name="roleName" 
                    rules={[{ required: true, message: "Please enter role name" }]}
                >
                    <Input placeholder="Example: Manager, Staff..." />
                </Form.Item>
            </Form>
        </Modal>
    );
}
