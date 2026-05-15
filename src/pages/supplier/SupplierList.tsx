import { Button, Popconfirm, message, Tag, Switch } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supplierApi } from "../../api/supplier.api";
import type { SupplierDto } from "../../types/supplier";
import PageHeader from "../../components/PageHeader";
import WmsTable from "../../components/Wmstable";

export default function SupplierList() {
    const [data, setData] = useState<SupplierDto[]>([]);
    const navigate = useNavigate();

    const load = async () => {
        try {
            const res = await supplierApi.getAll();
            setData(res.data);
        } catch {
            message.error("Failed to load suppliers");
        }
    };

    const handleToggleActive = async (record: SupplierDto, checked: boolean) => {
        try {
            await supplierApi.update(record.id, {
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
            await supplierApi.delete(id);
            message.success("Supplier deleted");
            load();
        } catch {
            message.error("Delete failed");
        }
    };

    return (
        <>
            <PageHeader
                title="Suppliers Management"
                button={<Button type="primary" onClick={() => navigate("/supplier/create")}>Create Supplier</Button>}
            />

            <WmsTable
                rowKey="id"
                dataSource={data}
                columns={[
                    { title: "ID", dataIndex: "id", width: 70 },
                    { title: "Code", dataIndex: "code" },
                    { title: "Name", dataIndex: "name" },
                    { title: "Email", dataIndex: "email" },
                    { title: "Phone", dataIndex: "phone" },
                    { title: "Address", dataIndex: "address" },
                    { 
                        title: "Created At", 
                        dataIndex: "createdAt",
                        render: (v: string) => v ? new Date(v).toLocaleDateString("vi-VN") : "—"
                    },
                    { 
                        title: "Active", 
                        dataIndex: "isActive",
                        render: (v: boolean, record: SupplierDto) => (
                            <Switch 
                                checked={v} 
                                onChange={(checked) => handleToggleActive(record, checked)} 
                            />
                        )
                    },
                    {
                        title: "Actions",
                        width: 150,
                        render: (_: unknown, row: SupplierDto) => (
                            <>
                                <Button size="small" onClick={() => navigate(`/supplier/edit/${row.id}`)}>Edit</Button>
                                <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(row.id)}>
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
