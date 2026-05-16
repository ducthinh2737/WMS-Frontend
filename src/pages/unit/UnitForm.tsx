// src/pages/unit/UnitForm.tsx
import { Button, Form, Input, Switch, message } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import { unitApi } from "../../api/unit.api";
import type { CreateUnitDto, UpdateUnitDto } from "../../types/unit";

export default function UnitForm() {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        if (id) {
            unitApi.get(+id).then(res => {
                form.setFieldsValue(res.data);
            });
        }
    }, [id]);

    const onFinish = async (values: any) => {
        try {
            if (id) {
                const payload: UpdateUnitDto = values;
                await unitApi.update(+id, payload);
                message.success("Unit updated");
            } else {
                const payload: CreateUnitDto = values;
                await unitApi.create(payload);
                message.success("Unit created");
            }
            navigate("/unit");
        } catch {
            message.error("Save failed");
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item name="code" label="Code" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                <Input />
            </Form.Item>
            <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
            </Form.Item>
            <Form.Item>
                <Button type="primary" htmlType="submit">{id ? "Update" : "Create"}</Button>
            </Form.Item>
        </Form>
    );
}
