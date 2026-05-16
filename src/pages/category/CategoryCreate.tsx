import { useState } from "react";
import { Card, Form, Input, Button, Switch, message } from "antd";
import { useNavigate } from "react-router-dom";
import { categoryApi } from "../../api/category.api";

export default function CategoryCreate() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            await categoryApi.create(values);
            message.success("Category created successfully");
            navigate("/category");
        } catch (err) {
            message.error("Failed to create category");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="Create Category" style={{ width: 500, margin: "40px auto" }}>
            <Form layout="vertical" onFinish={onFinish} initialValues={{ isActive: true }}>
                <Form.Item
                    label="Code"
                    name="code"
                    rules={[{ required: true, message: "Please enter code" }]}
                >
                    <Input placeholder="Enter code" />
                </Form.Item>

                <Form.Item
                    label="Name"
                    name="name"
                    rules={[{ required: true, message: "Please enter name" }]}
                >
                    <Input placeholder="Enter name" />
                </Form.Item>

                <Form.Item label="Active" name="isActive" valuePropName="checked">
                    <Switch />
                </Form.Item>

                <Button type="primary" htmlType="submit" block loading={loading}>
                    Create Category
                </Button>
            </Form>
        </Card>
    );
}
