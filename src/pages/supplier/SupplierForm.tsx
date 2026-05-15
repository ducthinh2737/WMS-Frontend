import { Button, Form, Input, message, Switch, Card, Row, Col, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supplierApi } from "../../api/supplier.api";
import type { SupplierDto, CreateSupplierDto, UpdateSupplierDto } from "../../types/supplier";

interface SupplierFormProps {
    mode: "create" | "edit";
}

export default function SupplierForm({ mode }: SupplierFormProps) {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        if (mode === "edit" && id) {
            supplierApi.get(+id).then(res => {
                const data: SupplierDto = res.data;
                form.setFieldsValue({
                    code: data.code,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    isActive: data.isActive
                });
            }).catch(() => {
                message.error("Failed to load supplier");
            });
        }
    }, [mode, id, form]);

    const onFinish = async (values: any) => {
        try {
            if (mode === "create") {
                const payload: CreateSupplierDto = values;
                await supplierApi.create(payload);
                message.success("Nhà cung cấp đã được tạo");
            } else if (mode === "edit" && id) {
                const payload: UpdateSupplierDto = values;
                await supplierApi.update(+id, payload);
                message.success("Nhà cung cấp đã được cập nhật");
            }
            navigate("/supplier");
        } catch {
            message.error("Thao tác thất bại");
        }
    };

    return (
        <div style={{ padding: "24px" }}>
            <Card
                title={
                    <Space>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => navigate("/supplier")} 
                            type="text" 
                        />
                        <span>{mode === "create" ? "Thêm mới nhà cung cấp" : "Chỉnh sửa nhà cung cấp"}</span>
                    </Space>
                }
                bordered={false}
                style={{ maxWidth: 800, margin: "0 auto", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
            >
                <Form 
                    form={form} 
                    layout="vertical" 
                    onFinish={onFinish}
                    initialValues={{ isActive: true }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Mã nhà cung cấp" name="code" rules={[{ required: true, message: "Vui lòng nhập mã" }]}>
                                <Input placeholder="Ví dụ: SUP001" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Tên nhà cung cấp" name="name" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
                                <Input placeholder="Nhập tên nhà cung cấp" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Email liên hệ" name="email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                                <Input placeholder="example@domain.com" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Số điện thoại" name="phone">
                                <Input placeholder="Nhập số điện thoại" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Địa chỉ" name="address">
                        <Input.TextArea rows={2} placeholder="Nhập địa chỉ chi tiết" />
                    </Form.Item>

                    {mode === "edit" && (
                        <Form.Item label="Trạng thái hoạt động" name="isActive" valuePropName="checked">
                            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                        </Form.Item>
                    )}

                    <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                        <Space>
                            <Button onClick={() => navigate("/supplier")}>
                                Hủy bỏ
                            </Button>
                            <Button type="primary" htmlType="submit" size="large">
                                {mode === "create" ? "Tạo mới" : "Cập nhật"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
