import { useEffect, useState } from "react";
import { Button, Form, Input, Switch, Select, Card, Row, Col, Space, Table, InputNumber, message } from "antd";
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

    const [productUoms, setProductUoms] = useState<any[]>([]);
    const [addingUom, setAddingUom] = useState({ unitId: undefined as number | undefined, factor: undefined as number | undefined });

    const loadProductUoms = async () => {
        if (isEdit) {
            try {
                const res = await productApi.getUoms(Number(id));
                setProductUoms(res.data || []);
            } catch (err) {
                console.error("Lỗi tải danh sách đơn vị quy đổi", err);
            }
        }
    };

    useEffect(() => {
        if (isEdit) {
            productApi.getById(Number(id)).then(res => {
                form.setFieldsValue(res.data);
            });
            loadProductUoms();
        } else {
            form.resetFields();
            form.setFieldsValue({ type: type ?? 0 });
        }
    }, [id, type, form]);

    const onSubmit = async (values: any) => {
        const payload = {
            ...values,
            type: type !== undefined ? type : (values.type !== undefined ? values.type : 0)
        };
        if (isEdit) {
            await productApi.update(Number(id), payload);
        } else {
            await productApi.create(payload);
        }
        navigate(basePath);
    };

    const handleAddUom = async () => {
        if (!addingUom.unitId || !addingUom.factor) {
            message.warning("Vui lòng chọn đơn vị và nhập hệ số quy đổi");
            return;
        }
        try {
            await productApi.addUom(Number(id), {
                unitId: addingUom.unitId,
                factor: addingUom.factor
            });
            message.success("Thêm đơn vị quy đổi thành công");
            setAddingUom({ unitId: undefined, factor: undefined });
            loadProductUoms();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Thêm thất bại");
        }
    };

    const handleDeleteUom = async (uomId: number) => {
        try {
            await productApi.deleteUom(Number(id), uomId);
            message.success("Xóa đơn vị quy đổi thành công");
            loadProductUoms();
        } catch (error: any) {
            message.error(error.response?.data?.message || "Xóa thất bại");
        }
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

            {isEdit && (
                <Card
                    title="Quản lý đơn vị tính quy đổi"
                    bordered={false}
                    style={{ maxWidth: 800, margin: "24px auto 0 auto", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)" }}
                >
                    <div style={{ marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 250 }}>
                            <span style={{ display: "block", marginBottom: 4 }}>Chọn đơn vị quy đổi:</span>
                            <Select
                                style={{ width: "100%" }}
                                placeholder="Chọn đơn vị"
                                value={addingUom.unitId}
                                onChange={(val) => setAddingUom(prev => ({ ...prev, unitId: val }))}
                                options={units.map(u => ({ label: u.name, value: u.id }))}
                            />
                        </div>
                        <div style={{ width: 200 }}>
                            <span style={{ display: "block", marginBottom: 4 }}>Hệ số quy đổi:</span>
                            <InputNumber
                                style={{ width: "100%" }}
                                placeholder="Ví dụ: 24"
                                min={0.000001}
                                value={addingUom.factor}
                                onChange={(val) => setAddingUom(prev => ({ ...prev, factor: val || undefined }))}
                            />
                        </div>
                        <Button type="primary" onClick={handleAddUom} style={{ marginTop: 22 }}>
                            Thêm đơn vị
                        </Button>
                    </div>

                    <Table
                        dataSource={productUoms}
                        rowKey="id"
                        pagination={false}
                        columns={[
                            {
                                title: "Đơn vị tính",
                                dataIndex: "unitName",
                                key: "unitName"
                            },
                            {
                                title: "Hệ số quy đổi",
                                dataIndex: "factor",
                                key: "factor",
                                render: (factor, r) => r.isBaseUnit ? `${factor} (Đơn vị cơ sở)` : factor
                            },
                            {
                                title: "Hành động",
                                key: "action",
                                render: (_, r) => !r.isBaseUnit && (
                                    <Button danger size="small" onClick={() => handleDeleteUom(r.id)}>
                                        Xóa
                                    </Button>
                                )
                            }
                        ]}
                    />
                </Card>
            )}
        </div>
    );
}
