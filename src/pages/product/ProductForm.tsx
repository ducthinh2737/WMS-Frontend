import { useEffect } from "react";
import { Button, Form, Input, Switch, Select } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { productApi } from "../../api/product.api.ts";
import { useMasterData } from "../../hooks/useMasterData.ts";

export default function ProductForm() {
    const { id } = useParams();
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const { categories, brands, units, suppliers, loading } = useMasterData();

    useEffect(() => {
        if (isEdit) {
            productApi.getById(Number(id)).then(res => {
                form.setFieldsValue(res.data);
            });
        }
    }, []);

    const onSubmit = async (values: any) => {
        if (isEdit) {
            await productApi.update(Number(id), values);
        } else {
            await productApi.create(values);
        }
        navigate("/product");
    };

    if (loading) return <div>Đang tải dữ liệu...</div>;

    return (
        <div style={{ maxWidth: 600 }}>
            <h2>{isEdit ? "Cập nhật sản phẩm" : "Thêm sản phẩm"} </h2>

            <Form form={form} layout="vertical" onFinish={onSubmit}>
                <Form.Item name="code" label="Mã" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true }]}>
                    <Select
                        options={categories.map(x => ({ label: x.name, value: x.id }))}
                    />
                </Form.Item>

                <Form.Item name="unitId" label="Đơn vị" rules={[{ required: true }]}>
                    <Select
                        options={units.map(x => ({ label: x.name, value: x.id }))}
                    />
                </Form.Item>

                <Form.Item name="brandId" label="Thương hiệu" rules={[{ required: true }]}>
                    <Select
                        options={brands.map(x => ({ label: x.name, value: x.id }))}
                    />
                </Form.Item>

                <Form.Item name="supplierId" label="Nhà cung cấp" rules={[{ required: true }]}>
                    <Select
                        options={suppliers.map(x => ({ label: x.name, value: x.id }))}
                    />
                </Form.Item>

                {isEdit && (
                    <Form.Item name="isActive" label="Hoạt động" valuePropName="checked">
                        <Switch />
                    </Form.Item>
                )}

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Lưu
                    </Button>
                    <Button style={{ marginLeft: 8 }} onClick={() => navigate("/product")}>
                        Hủy
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
}
