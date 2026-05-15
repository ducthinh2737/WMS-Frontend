import { Button, message, Popconfirm, Table, Switch } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { customerApi } from "../../api/customer.api";
import type { CustomerDto } from "../../types/customer";

export default function CustomerList() {
    const [data, setData] = useState<CustomerDto[]>([]);
    const navigate = useNavigate();

    const fetchData = async () => {
        try {
            const res = await customerApi.getAll();
            setData(res.data);
        } catch {
            message.error("Failed to fetch customers");
        }
    };

    const handleToggleActive = async (record: CustomerDto, checked: boolean) => {
        try {
            await customerApi.update(record.id, {
                ...record,
                isActive: checked
            });
            message.success(`Status updated for ${record.name}`);
            fetchData();
        } catch {
            message.error("Failed to update status");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await customerApi.delete(id);
            message.success("Customer deleted");
            fetchData();
        } catch {
            message.error("Delete failed");
        }
    };

    const columns = [
        { title: "ID", dataIndex: "id", key: "id" }, // <--- thêm cột này
        { title: "Code", dataIndex: "code", key: "code" },
        { title: "Name", dataIndex: "name", key: "name" },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Phone", dataIndex: "phone", key: "phone" },
        { title: "Address", dataIndex: "address", key: "address" },
        { 
            title: "Active", 
            dataIndex: "isActive", 
            key: "isActive", 
            render: (v: boolean, record: CustomerDto) => (
                <Switch 
                    checked={v} 
                    onChange={(checked) => handleToggleActive(record, checked)} 
                />
            ) 
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: CustomerDto) => (
                <>
                    <Button type="link" onClick={() => navigate(`/customer/edit/${record.id}`)}>
                        Edit
                    </Button>
                    <Popconfirm title="Delete?" onConfirm={() => handleDelete(record.id)}>
                        <Button type="link" danger>Delete</Button>
                    </Popconfirm>
                </>
            )
        }
    ];

    return (
        <>
            <Button type="primary" onClick={() => navigate("/customer/create")} style={{ marginBottom: 16 }}>
                Add Customer
            </Button>
            <Table rowKey="id" columns={columns} dataSource={data} />
        </>
    );
}
