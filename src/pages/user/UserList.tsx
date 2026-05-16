import { Button, Popconfirm, message, Tag, Space } from "antd";
import { useEffect, useState } from "react";
import { userApi } from "../../api/user.api";
import PageHeader from "../../components/PageHeader";
import WmsTable from "../../components/Wmstable";
import { useNavigate } from "react-router-dom";
import type { UserDto } from "../../types/user";
import UserCreateModal from "./CreateUser"; // Import component vừa sửa ở trên
import UserEditDrawer from "./UpdateUser"; // Import component vừa sửa ở trên

export default function UserList() {
    const [data, setData] = useState<UserDto[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false); // State quản lý Modal
    const navigate = useNavigate();
    const [editId, setEditId] = useState<number | undefined>();
    const [isEditOpen, setIsEditOpen] = useState(false);

    const load = async () => {
        try {
            const res = await userApi.getAll();
            setData(res.data);
        } catch (err) {
            message.error("Failed to load users");
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await userApi.delete(id);
            message.success("User deleted");
            load();
        } catch {
            message.error("Delete failed");
        }
    };

    return (
        <>
            <PageHeader
                title="Users Management"
                button={
                    <Button type="primary" onClick={() => setIsModalOpen(true)}>
                        Create User
                    </Button>
                }
            />

            <WmsTable
                dataSource={data}
                rowKey="id"
                columns={[
                    { title: "ID", dataIndex: "id", width: 70 },
                    {
                        title: "Full Name",
                        dataIndex: "fullName",
                        render: (v: string) => <Tag color="blue">{v}</Tag>
                    },
                    { title: "Email", dataIndex: "email" },
{
                        title: "Created At",
                        dataIndex: "createdAt",
                        render: (v: string | null) =>
                            v ? new Date(v).toLocaleString("vi-VN") : "—",
                    },

                    {
                        title: "Created By",
                        dataIndex: "createdBy",
                        render: (v: number | null) =>
                            v ? <Tag color="purple">User #{v}</Tag> : <Tag>-</Tag>
                    },

                    {
                        title: "Updated At",
                        dataIndex: "updatedAt",
                        render: (v: string | null) =>
                            v ? new Date(v).toLocaleString("vi-VN") : "—",
                    },

                    {
                        title: "Updated By",
                        dataIndex: "updatedBy",
                        render: (v: number | null) =>
                            v ? <Tag color="orange">User #{v}</Tag> : <Tag>-</Tag>
                    },
                    {
  title: "Actions",
  width: 150,
  render: (_: unknown, row: UserDto) => (
    <Space>
      <Button
        size="small"
        type="primary"
        onClick={() => {
          setEditId(row.id);
          setIsEditOpen(true);
        }}
      >
        Edit
      </Button>

      <Popconfirm
        title="Xóa người dùng này?"
        onConfirm={() => handleDelete(row.id)}
        okText="Xóa"
        cancelText="Hủy"
      >
        <Button danger size="small">
          Delete
        </Button>
      </Popconfirm>
    </Space>
  ),
}
                ]}
            />

            {/* Gọi Modal Create User tại đây */}
            <UserEditDrawer 
  open={isEditOpen}
  userId={editId}
  onClose={() => {
    setIsEditOpen(false);
    setEditId(undefined);
  }}
  onSuccess={() => {
    setIsEditOpen(false);
    setEditId(undefined);
    load(); // Refresh lại bảng data
  }}
/>
            <UserCreateModal 
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false); // Đóng modal
                    load(); // Load lại danh sách người dùng
                }}
            />
        </>
    );
}





