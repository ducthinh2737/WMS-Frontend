import { Button, Popconfirm, message, Tag, Switch } from "antd";
import { useEffect, useState } from "react";
import { categoryApi } from "../../api/category.api";
import PageHeader from "../../components/PageHeader";
import WmsTable from "../../components/Wmstable";
import { useNavigate } from "react-router-dom";
import type { CategoryDto } from "../../types/category";

export default function CategoryList() {
    const [data, setData] = useState<CategoryDto[]>([]);
    const navigate = useNavigate();

    const load = async () => {
        try {
            const res = await categoryApi.getAll();
            setData(res.data);
        } catch {
            message.error("Failed to load categories");
        }
    };

    const handleToggleActive = async (record: CategoryDto, checked: boolean) => {
        try {
            await categoryApi.update(record.id, {
                ...record,
                isActive: checked
            });
            message.success(`Status updated for ${record.name}`);
            load();
        } catch {
            message.error("Failed to update status");
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id: number) => {
        try {
            await categoryApi.delete(id);
            message.success("Category deleted");
            load();
        } catch {
            message.error("Delete failed");
        }
    };

    return (
        <>
            <PageHeader
                title="Category Management"
                button={
                    <Button type="primary" onClick={() => navigate("/category/create")}>
                        Create Category
                    </Button>
                }
            />

            <WmsTable
                dataSource={data}
                rowKey="id"
                columns={[
    { title: "ID", dataIndex: "id", width: 70 },

    { 
        title: "Code", 
        dataIndex: "code", 
        render: (v: string) => <Tag color="geekblue">{v}</Tag> 
    },

    { 
        title: "Name", 
        dataIndex: "name", 
        render: (v: string) => <Tag color="blue">{v}</Tag> 
    },

    { 
        title: "Active", 
        dataIndex: "isActive", 
        render: (v: boolean, record: CategoryDto) => (
            <Switch 
                checked={v} 
                onChange={(checked) => handleToggleActive(record, checked)} 
            />
        )
    },

    { 
        title: "Created At", 
        dataIndex: "createAt",         
            render: (v: string) => new Date(v).toLocaleDateString()

    },

    {
        title: "Actions",
        width: 150,
        render: (_: unknown, row: CategoryDto) => (
            <>
                <Button size="small" onClick={() => navigate(`/category/edit/${row.id}`)}>Edit</Button>
                <Popconfirm
                    title="Are you sure to delete?"
                    onConfirm={() => handleDelete(row.id)}
                >
                    <Button danger size="small" style={{ marginLeft: 8 }}>Delete</Button>
                </Popconfirm>
            </>
        )
    }
]}
            />
        </>
    );
}
