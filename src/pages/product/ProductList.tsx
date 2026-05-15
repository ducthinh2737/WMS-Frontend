import { useEffect, useState } from "react";
import { Table, Button, Space, message, Switch } from "antd";
import { productApi } from "../../api/product.api.ts";
import type { Product } from "../../types/product";
import { PRODUCT_TYPE_LABEL } from "../../types/product";
import { useNavigate } from "react-router-dom";

interface ProductListProps {
    type?: 0 | 1;
}

export default function ProductList({ type }: ProductListProps) {
    const [data, setData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const isRawMaterial = type === 0;
    const basePath = isRawMaterial ? "/master/raw-materials" : "/product";
    const title = isRawMaterial ? "Quản lý nguyên vật liệu" : "Quản lý thành phẩm";

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await productApi.getAll();
            let items = res.data;
            if (type !== undefined) {
                items = items.filter((x: Product) => x.type === type);
            }
            setData(items);
        } catch (error: any) {
            message.error(error?.response?.data || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (record: Product, checked: boolean) => {
        try {
            await productApi.update(record.id, {
                ...record,
                isActive: checked
            });
            message.success(`Đã cập nhật trạng thái cho ${record.name}`);
            loadData();
        } catch {
            message.error("Cập nhật trạng thái thất bại");
        }
    };

    useEffect(() => {
        loadData();
    }, [type]);

    const handleDelete = async (id: number) => {
        try {
            await productApi.delete(id);
            message.success("Xoá thành công");
            loadData();
        } catch (error: any) {
            message.error(error?.response?.data || "Xoá thất bại");
        }
    };

    return (
        <div>
            <h2>{title}</h2>

            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={() => navigate(`${basePath}/create`)}>
                    Thêm mới
                </Button>
            </Space>

            <Table
                loading={loading}
                dataSource={data}
                rowKey="id"
                columns={[
                    { title: "ID", dataIndex: "id" },
                    { 
                        title: "Mã", 
                        dataIndex: "code",
                        render: (v: string, r: Product) => (
                            <Button type="link" onClick={() => navigate(`${basePath}/edit/${r.id}`)} style={{ padding: 0, color: "black" }}>
                                {v}
                            </Button>
                        )
                    },
                    { 
                        title: "Tên", 
                        dataIndex: "name",
                        render: (v: string, r: Product) => (
                            <Button type="link" onClick={() => navigate(`${basePath}/edit/${r.id}`)} style={{ padding: 0, color: "black" }}>
                                {v}
                            </Button>
                        )
                    },
                    {
                        title: "Loại",
                        dataIndex: "type",
                        render: (x: 0 | 1) => PRODUCT_TYPE_LABEL[x],
                    },
                    { title: "Danh mục", dataIndex: "categoryId" },
                    { title: "Thương hiệu", dataIndex: "brandId" },
                    { title: "Nhà cung cấp", dataIndex: "supplierId" },
                    {
                        title: "Trạng thái",
                        dataIndex: "isActive",
                        render: (x: boolean, record: Product) => (
                            <Switch 
                                checked={x} 
                                onChange={(checked) => handleToggleActive(record, checked)} 
                            />
                        ),
                    },
                    {
                        title: "Hành động",
                        render: (_, r) => (
                            <Space>
                                <Button onClick={() => navigate(`${basePath}/edit/${r.id}`)}>
                                    Sửa
                                </Button>
                                <Button danger onClick={() => handleDelete(r.id)}>
                                    Xoá
                                </Button>
                            </Space>
                        ),
                    },
                ]}
            />
        </div>
    );
}
