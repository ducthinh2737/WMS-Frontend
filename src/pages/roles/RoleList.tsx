import { Button, Popconfirm, message, Tag, Space } from "antd";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import WmsTable from "../../components/Wmstable";
import { roleApi } from "../../api/role.api";
import type { RoleDetailDto } from "../../types/role";
import RoleCreateModal from "./RoleCreate"; 
import RolePermissionModal from "./RolePermissionAssign";
import RoleEditModal from "./RoleEdit";
import { EditOutlined, DeleteOutlined, KeyOutlined, PlusOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

export default function RoleList() {
    const [data, setData] = useState<RoleDetailDto[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [isAssignOpen, setIsAssignOpen] = useState(false);
const [assignRoleData, setAssignRoleData] = useState<{id?: number, name?: string}>({});

    // States cho Create Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // States cho Edit Modal
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>();

    const load = async () => {
        setLoading(true);
        try {
            const res = await roleApi.getAll();
            setData(res.data);
        } catch (err) {
            message.error("Không thể tải danh sách quyền");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await roleApi.delete(id);
            message.success("Đã xóa quyền");
            load();
        } catch {
            message.error("Xóa thất bại");
        }
    };

    const columns = [
        { 
            title: "ID", 
            dataIndex: "id", 
            width: 70 
        },
        {
            title: "Tên quyền",
            dataIndex: "roleName",
            render: (v: string) => <Tag color="blue" style={{ fontWeight: '600' }}>{v}</Tag>,
        },
        {
            title: "Danh sách Permissions",
            dataIndex: "permissions",
            render: (permissions: RoleDetailDto["Permissions"]) =>
                permissions && permissions.length > 0 ? (
                    <Space wrap size={[0, 4]}>
                        {permissions.map(p => (
                            <Tag color="green" key={p.id} bordered={false}>
                                {p.code}
                            </Tag>
                        ))}
                    </Space>
                ) : (
                    <Tag color="default">Chưa gán quyền</Tag>
                ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            render: (v: string) => v ? new Date(v).toLocaleDateString("vi-VN") : "—",
        },
        {
            title: "Thao tác",
            key: "action",
            width: 320,
            render: (_: any, row: RoleDetailDto) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setSelectedRoleId(row.id);
                            setIsEditOpen(true);
                        }}
                    >
                        Sửa
                    </Button>

                    <Button
                            size="small"
                            type="dashed"
                            icon={<KeyOutlined />}
                            onClick={() => {
                                setAssignRoleData({ id: row.id, name: row.roleName });
                                setIsAssignOpen(true);
                            }}
                        >
                            Gán quyền
                        </Button>

                    <Popconfirm
                        title="Xóa quyền này sẽ ảnh hưởng đến người dùng đang giữ quyền. Tiếp tục?"
                        onConfirm={() => handleDelete(row.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                            Xóa
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <PageHeader
                title="Quản lý Vai trò (Roles)"
                button={
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={() => setIsCreateOpen(true)}
                    >
                        Thêm vai trò mới
                    </Button>
                }
            />

            <WmsTable
                dataSource={data}
                rowKey="id"
                columns={columns}
                loading={loading}
            />

            {/* Popup Create */}
            <RoleCreateModal 
                open={isCreateOpen}
                onCancel={() => setIsCreateOpen(false)}
                onSuccess={() => {
                    setIsCreateOpen(false);
                    load();
                }}
            />
            <RolePermissionModal 
    open={isAssignOpen}
    roleId={assignRoleData.id}
    roleName={assignRoleData.name}
    onCancel={() => setIsAssignOpen(false)}
    onSuccess={() => {
        setIsAssignOpen(false);
        load(); // Để cập nhật lại các Tag permissions ở bảng chính
    }}
/>
            {/* Popup Edit */}
            <RoleEditModal 
                open={isEditOpen}
                roleId={selectedRoleId}
                onCancel={() => {
                    setIsEditOpen(false);
                    setSelectedRoleId(undefined);
                }}
                onSuccess={() => {
                    setIsEditOpen(false);
                    setSelectedRoleId(undefined);
                    load();
                }}
            />
        </div>
    );
}