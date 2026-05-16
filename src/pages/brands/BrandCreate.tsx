import { Form, Input, Button, Card, message, Switch, Row, Col, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { brandApi } from "../../api/brand.api";
import { useNavigate } from "react-router-dom";

export default function BrandCreate() {
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        try {
            if (!values.code || values.code.trim() === "")
                values.code = null;

            await brandApi.create(values);
            message.success("Thương hiệu đã được tạo");
            navigate("/master/brands");
        } catch (err: any) {
            console.error(err);
            message.error(err.response?.data || "Thao tác thất bại");
        }
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
                        <span>Thêm mới thương hiệu</span>
                    </Space>
                }
                bordered={false}
                style={{ maxWidth: 600, margin: "0 auto", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03)" }}
            >
                <Form layout="vertical" onFinish={onFinish} initialValues={{ isActive: true }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Mã thương hiệu" name="code">
                                <Input placeholder="Để trống nếu tự sinh" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Tên thương hiệu"
                                name="name"
                                rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                            >
                                <Input placeholder="Ví dụ: Samsung, Apple" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item label="Mô tả" name="description">
                        <Input.TextArea rows={3} placeholder="Mô tả thêm về thương hiệu" />
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
                                Tạo mới
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
