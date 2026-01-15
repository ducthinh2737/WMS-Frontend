import { Button, Popconfirm, message, Tag, Space } from "antd";
import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import WmsTable from "../../components/Wmstable";
import { roleApi } from "../../api/role.api";
import type { RoleDetailDto } from "../../types/role";
import RoleCreateModal from "./RoleCreate"; 
import RolePermissionModal from "./RolePermissionAssign";
import RoleEditModal from "./RoleEdit";
import AssignRoleModal from "../auth/AssignRole"; // Đường dẫn tới file vừa sửa ở trên
import { EditOutlined, DeleteOutlined, KeyOutlined, PlusOutlined, UserAddOutlined } from "@ant-design/icons";

export default function RoleList() {
    const [data, setData] = useState<RoleDetailDto[]>([]);
    const [loading, setLoading] = useState(false);

    // States cho các Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPermissionOpen, setIsPermissionOpen] = useState(false);
    const [isAssignUserOpen, setIsAssignUserOpen] = useState(false);

    // State lưu dữ liệu role đang được chọn để gán/sửa
    const [selectedRole, setSelectedRole] = useState<{id?: number, name?: string}>({});

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

    useEffect(() => { load(); }, []);

    const handleDelete = async (id: number) => {
        try {
            await roleApi.delete(id);
            message.success("Đã xóa quyền");
            load();
        } catch { message.error("Xóa thất bại"); }
    };

    const columns = [
        { title: "ID", dataIndex: "id", width: 70 },
        {
            title: "Tên quyền",
            dataIndex: "roleName",
            render: (v: string) => <Tag color="blue" style={{ fontWeight: '600' }}>{v}</Tag>,
        },
        {
            title: "Danh sách Permissions",
            dataIndex: "permissions",
            render: (permissions: any[]) =>
                permissions?.length > 0 ? (
                    <Space wrap size={[0, 4]}>
                        {permissions.map(p => (
                            <Tag color="green" key={p.id} bordered={false}>{p.code}</Tag>
                        ))}
                    </Space>
                ) : <Tag color="default">Chưa gán quyền</Tag>,
        },
        {
            title: "Thao tác",
            key: "action",
            width: 380,
            render: (_: any, row: RoleDetailDto) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setSelectedRole({ id: row.id, name: row.roleName });
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
                            setSelectedRole({ id: row.id, name: row.roleName });
                            setIsPermissionOpen(true);
                        }}
                    >
                        Quyền
                    </Button>

                    <Button
                        size="small"
                        style={{ color: '#722ed1', borderColor: '#722ed1' }}
                        icon={<UserAddOutlined />}
                        onClick={() => {
                            setSelectedRole({ id: row.id, name: row.roleName });
                            setIsAssignUserOpen(true);
                        }}
                    >
                        Gán User
                    </Button>

                    <Popconfirm
                        title="Xóa quyền này sẽ ảnh hưởng đến người dùng đang giữ quyền. Tiếp tục?"
                        onConfirm={() => handleDelete(row.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button danger size="small" icon={<DeleteOutlined />}>Xóa</Button>
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
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
                        Thêm vai trò mới
                    </Button>
                }
            />

            <WmsTable dataSource={data} rowKey="id" columns={columns} loading={loading} />

            {/* --- Danh sách các Modals --- */}
            
            <RoleCreateModal 
                open={isCreateOpen} 
                onCancel={() => setIsCreateOpen(false)} 
                onSuccess={() => { setIsCreateOpen(false); load(); }} 
            />

            <RoleEditModal 
                open={isEditOpen}
                roleId={selectedRole.id}
                onCancel={() => setIsEditOpen(false)}
                onSuccess={() => { setIsEditOpen(false); load(); }}
            />

            <RolePermissionModal 
                open={isPermissionOpen}
                roleId={selectedRole.id}
                roleName={selectedRole.name}
                onCancel={() => setIsPermissionOpen(false)}
                onSuccess={() => { setIsPermissionOpen(false); load(); }}
            />

            <AssignRoleModal 
                open={isAssignUserOpen}
                roleId={selectedRole.id}
                roleName={selectedRole.name}
                onCancel={() => setIsAssignUserOpen(false)}
                onSuccess={() => { setIsAssignUserOpen(false); }} // Gán xong không cần load lại bảng role
            />
        </div>
    );
}