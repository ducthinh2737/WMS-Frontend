import { Modal, Checkbox, Button, message, Divider, Spin, Space, Tag } from "antd";
import { useEffect, useState } from "react";
import { roleApi } from "../../api/role.api";
import { permissionApi } from "../../api/permission.api";

interface Permission {
  id: number;
  code: string;
}

interface Props {
  open: boolean;
  roleId?: number;
  roleName?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function RolePermissionModal({ open, roleId, roleName, onCancel, onSuccess }: Props) {
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [original, setOriginal] = useState<number[]>([]);
  const [checked, setChecked] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (open) {
      permissionApi.getAll().then(res => setAllPermissions(res.data));
    }
  }, [open]);

  useEffect(() => {
    if (open && roleId) {
      loadRolePermissions();
    }
  }, [open, roleId]);

  const loadRolePermissions = async () => {
    setFetching(true);
    try {
      const res = await roleApi.get(Number(roleId));
      const permIds = res.data.permissions.map((p: Permission) => p.id);
      setOriginal(permIds);
      setChecked(permIds);
    } catch {
      message.error("Không thể tải quyền của vai trò này");
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async () => {
    if (!roleId) return;
    setLoading(true);
    const toAdd = checked.filter(id => !original.includes(id));
    const toRemove = original.filter(id => !checked.includes(id));

    try {
      await Promise.all([
        ...toAdd.map(pid => roleApi.assignPermission({ roleId, permissionId: pid })),
        ...toRemove.map(pid => roleApi.removePermission(roleId, pid)),
      ]);
      message.success("Cập nhật quyền thành công");
      onSuccess();
    } catch {
      message.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center', width: '100%', paddingRight: '36px' }}>
          <Space>
            <span>Thiết lập quyền:</span>
            <Tag color="blue" style={{ fontSize: '14px' }}>{roleName}</Tag>
          </Space>
        </div>
      }
      open={open}
      onCancel={onCancel}
      width={700} // Thu nhỏ lại một chút cho gọn
      onOk={onSubmit}
      confirmLoading={loading}
      okText="Lưu thay đổi"
      cancelText="Đóng"
      centered // Đưa toàn bộ Modal ra giữa màn hình (theo chiều dọc)
      destroyOnClose
    >
      <Spin spinning={fetching}>
        <Divider style={{ fontSize: '12px', color: '#888' }}>
          Danh sách quyền hạn
        </Divider>
        
        {/* Container bọc ngoài để căn giữa Checkbox Group */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%',
          padding: '10px 0 20px 0'
        }}>
          <Checkbox.Group
            value={checked}
            onChange={(v) => setChecked(v as number[])}
            style={{ width: "100%", maxWidth: '550px' }} // Giới hạn chiều rộng để căn giữa đẹp hơn
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)", // Chia 2 cột để nhìn tập trung hơn
                gap: "12px",
                maxHeight: '350px',
                overflowY: 'auto',
                padding: '10px'
              }}
            >
              {allPermissions.map(p => (
                <label
                  key={p.id}
                  style={{
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                    padding: "10px 15px",
                    cursor: "pointer",
                    display: 'flex',
                    alignItems: 'center',
                    background: checked.includes(p.id) ? '#e6f7ff' : '#fafafa',
                    borderColor: checked.includes(p.id) ? '#91d5ff' : '#f0f0f0',
                    transition: 'all 0.2s',
                    boxShadow: checked.includes(p.id) ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <Checkbox value={p.id}>
                    <span style={{ marginLeft: 8, fontWeight: checked.includes(p.id) ? 600 : 400 }}>
                        {p.code}
                    </span>
                  </Checkbox>
                </label>
              ))}
            </div>
          </Checkbox.Group>
        </div>
      </Spin>
    </Modal>
  );
}