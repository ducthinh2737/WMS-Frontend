import { useEffect, useState } from "react";
import { Card, Form, Input, Button, Switch, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { categoryApi } from "../../api/category.api";

export default function CategoryEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (id) loadCategory(Number(id));
    }, [id]);

    const loadCategory = async (categoryId: number) => {
        try {
            const res = await categoryApi.get(categoryId);
            form.setFieldsValue({
                code: res.data.code,
                name: res.data.name,
                isActive: res.data.isActive
            });
        } catch {
            message.error("Failed to load category");
        }
    };

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            await categoryApi.update(Number(id), values);
            message.success("Category updated successfully");
            navigate("/categories");
        } catch {
            message.error("Failed to update category");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card title="Edit Category" style={{ width: 500, margin: "40px auto" }}>
            <Form layout="vertical" onFinish={onFinish} form={form}>
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
                    Update Category
                </Button>
            </Form>
        </Card>
    );
}
