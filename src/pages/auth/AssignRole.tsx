import { Form, Select, Button, Modal, message } from "antd";
import { useEffect, useState } from "react";
import { authApi } from "../../api/auth.api";
import { userApi } from "../../api/user.api";

interface User {
    id: number;
    email: string;
    fullName?: string;
}

interface Props {
    open: boolean;
    roleId?: number;
    roleName?: string;
    onCancel: () => void;
    onSuccess: () => void;
}

export default function AssignRoleModal({ open, roleId, roleName, onCancel, onSuccess }: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            const fetchUsers = async () => {
                try {
                    const res = await userApi.getAll();
                    setUsers(res.data);
                } catch (err) {
                    message.error("Không tải được danh sách người dùng");
                }
            };
            fetchUsers();
        }
    }, [open]);

    const onFinish = async (values: { userId: number }) => {
        if (!roleId) return;
        try {
            setLoading(true);
            await authApi.assignRole(values.userId, roleId);
            message.success(`Đã gán quyền ${roleName} thành công!`);
            form.resetFields();
            onSuccess();
        } catch {
            message.error("Gán quyền thất bại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={<span>Gán người dùng vào nhóm: <b style={{ color: '#722ed1' }}>{roleName}</b></span>}
            open={open}
            onCancel={() => {
                form.resetFields();
                onCancel();
            }}
            footer={null}
            destroyOnHidden
            width={450}
        >
            <Form form={form} onFinish={onFinish} layout="vertical" style={{ marginTop: 20 }}>
                <Form.Item
                    name="userId"
                    label="Chọn User"
                    rules={[{ required: true, message: "Vui lòng chọn user" }]}
                >
                    <Select
                        showSearch
                        placeholder="Tìm theo email hoặc tên..."
                        optionFilterProp="label"
                        options={users.map(u => ({
                            value: u.id,
                            label: `${u.email}${u.fullName ? " - " + u.fullName : ""}`,
                        }))}
                    />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
                    <Button onClick={onCancel}>Hủy</Button>
                    <Button type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: '#722ed1', borderColor: '#722ed1' }}>
                        Xác nhận gán
                    </Button>
                </div>
            </Form>
        </Modal>
    );
}
