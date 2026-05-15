import { useEffect } from "react";
import { Button, Form, Input, Switch, Select, Card, Row, Col, Space } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { productApi } from "../../api/product.api.ts";
import { useMasterData } from "../../hooks/useMasterData.ts";
import { PRODUCT_TYPE_OPTIONS } from "../../types/product";

interface ProductFormProps {
    type?: 0 | 1;
}

export default function ProductForm({ type }: ProductFormProps) {
    const { id } = useParams();
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const isRawMaterial = type === 0;
    const basePath = isRawMaterial ? "/master/raw-materials" : "/product";
    const titleBase = isRawMaterial ? "nguyên vật liệu" : "thành phẩm";

    const isEdit = Boolean(id);

    const { categories, brands, units, suppliers, loading } = useMasterData();

    useEffect(() => {
        if (isEdit) {
            productApi.getById(Number(id)).then(res => {
                form.setFieldsValue(res.data);
            });
        } else {
            form.resetFields();
            form.setFieldsValue({ type: type ?? 0 });
        }
    }, [id, type, form]);

    const onSubmit = async (values: any) => {
        if (isEdit) {
            await productApi.update(Number(id), values);
        } else {
            await productApi.create(values);
        }
        navigate(basePath);
    };

    if (loading) return <div>Đang tải dữ liệu...</div>;

    return (
        <div style={{ padding: "24px" }}>
            <Card 
                title={
                    <Space>
                        <Button 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => navigate(basePath)} 
                            type="text" 
                        />
                        <span>{isEdit ? `Cập nhật ${titleBase}` : `Thêm mới ${titleBase}`}</span>
                    </Space>
                }
                bordered={false}
                style={{ maxWidth: 800, margin: "0 auto", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)" }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onSubmit}
                    initialValues={{
                        type: type ?? 0, 
                        isActive: true
                    }}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="code" label="Mã định danh" rules={[{ required: true, message: "Vui lòng nhập mã" }]}>
                                <Input placeholder="Ví dụ: P0001" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="name" label="Tên gọi" rules={[{ required: true, message: "Vui lòng nhập tên" }]}>
                                <Input placeholder="Nhập tên gọi sản phẩm" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {type === undefined && (
                        <Form.Item
                            name="type"
                            label="Loại sản phẩm"
                            rules={[{ required: true }]}
                        >
                            <Select options={PRODUCT_TYPE_OPTIONS} placeholder="Chọn loại" />
                        </Form.Item>
                    )}

                    <Form.Item name="description" label="Mô tả chi tiết">
                        <Input.TextArea rows={3} placeholder="Nhập mô tả thêm về sản phẩm (nếu có)" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}>
                                <Select 
                                    options={categories.map(x => ({ label: x.name, value: x.id }))} 
                                    placeholder="Chọn danh mục"
                                    showSearch
                                    filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="unitId" label="Đơn vị tính" rules={[{ required: true, message: "Vui lòng chọn đơn vị" }]}>
                                <Select 
                                    options={units.map(x => ({ label: x.name, value: x.id }))} 
                                    placeholder="Chọn đơn vị"
                                    showSearch
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="brandId" label="Thương hiệu" rules={[{ required: true, message: "Vui lòng chọn thương hiệu" }]}>
                                <Select 
                                    options={brands.map(x => ({ label: x.name, value: x.id }))} 
                                    placeholder="Chọn thương hiệu"
                                    showSearch
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true, message: "Vui lòng chọn nhà cung cấp" }]}>
                                <Select 
                                    options={suppliers.map(x => ({ label: x.name, value: x.id }))} 
                                    placeholder="Chọn nhà cung cấp"
                                    showSearch
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {isEdit && (
                        <Form.Item
                            name="isActive"
                            label="Trạng thái hoạt động"
                            valuePropName="checked"
                        >
                            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                        </Form.Item>
                    )}

                    <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                        <Space>
                            <Button onClick={() => navigate(basePath)}>
                                Hủy bỏ
                            </Button>
                            <Button type="primary" htmlType="submit" size="large">
                                {isEdit ? "Cập nhật" : "Tạo mới"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
