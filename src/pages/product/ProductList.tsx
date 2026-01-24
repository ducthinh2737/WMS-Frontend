import { useEffect, useState } from "react";
import { Table, Button, Space, message } from "antd";
import { productApi } from "../../api/product.api.ts";
import type { Product } from "../../types/product";
import { PRODUCT_TYPE_LABEL } from "../../types/product";
import { useNavigate } from "react-router-dom";

export default function ProductList() {
    const [data, setData] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await productApi.getAll();
            setData(res.data);
        } catch (error: any) {
            message.error(error?.response?.data || "Không thể tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

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
            <h2>Quản lý sản phẩm</h2>

            <Space style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={() => navigate("/product/create")}>
                    Thêm mới
                </Button>
            </Space>

            <Table
                loading={loading}
                dataSource={data}
                rowKey="id"
                columns={[
                    { title: "ID", dataIndex: "id" },
                    { title: "Mã", dataIndex: "code" },
                    { title: "Tên", dataIndex: "name" },
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
                        render: x => (x ? "Hoạt động" : "Ngừng"),
                    },
                    {
                        title: "Hành động",
                        render: (_, r) => (
                            <Space>
                                <Button onClick={() => navigate(`/product/edit/${r.id}`)}>
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
