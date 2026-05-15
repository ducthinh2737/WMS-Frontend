import { useEffect } from "react";
import { Form, Input, Button, Card, message, Switch, Row, Col, Space } from "antd";
import { brandApi } from "../../api/brand.api";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";

export default function BrandEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const load = async () => {
        const res = await brandApi.getById(Number(id));
        const data = res.data;

        form.setFieldsValue({
            code: data.code ?? "",
            name: data.name,
            description: data.description ?? "",
            isActive: data.isActive
        });
    };

    useEffect(() => { load(); }, [id]);

    const onFinish = async (values: any) => {
        const dto = {
            ...values,
            code: values.code?.trim() === "" ? null : values.code
        };

        await brandApi.update(Number(id), dto);

        message.success("Cập nhật thành công");
        navigate("/master/brands");
    };

    return (
        <div style={{ padding: "24px" }}>
            <Card 
                title={
                    <Space>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => navigate("/master/brands")} 
                            type="text" 
                        />
                        <span>Cập nhật thương hiệu</span>
                    </Space>
                }
                bordered={false}
                style={{ maxWidth: 600, margin: "0 auto", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
            >
                <Form layout="vertical" form={form} onFinish={onFinish}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Mã thương hiệu" name="code">
                                <Input placeholder="Để trống nếu tự sinh" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Tên thương hiệu" name="name" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Mô tả" name="description">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Form.Item label="Trạng thái hoạt động" name="isActive" valuePropName="checked">
                        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                        <Space>
                            <Button onClick={() => navigate("/master/brands")}>
                                Hủy bỏ
                            </Button>
                            <Button type="primary" htmlType="submit" size="large">
                                Lưu thay đổi
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
