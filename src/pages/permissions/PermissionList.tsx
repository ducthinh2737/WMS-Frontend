import { Button, Popconfirm, message, Tag, Space } from "antd";
import { useEffect, useState } from "react";
import { permissionApi } from "../../api/permission.api";
import PageHeader from "../../components/PageHeader";
import WmsTable from "../../components/Wmstable";
import PermissionFormModal from "./PermissionEdit"; // Import modal mới

export default function PermissionList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // States cho Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await permissionApi.getAll();
      setData(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    await permissionApi.delete(id);
    message.success("Deleted");
    load();
  };

  const handleOpenModal = (record: any = null) => {
    setEditingData(record);
    setModalOpen(true);
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title="Permissions Management"
        button={
          <Button type="primary" onClick={() => handleOpenModal()}>
            Create Permission
          </Button>
        }
      />

      <WmsTable
        dataSource={data}
        loading={loading}
        rowKey="id"
        columns={[
          { title: "ID", dataIndex: "id", width: 80 },
          {
            title: "Code",
            dataIndex: "code",
            render: (code: string) => <Tag color="blue">{code}</Tag>
          },
          { title: "Description", dataIndex: "description" },
          {
            title: "Is Deleted",
            dataIndex: "isDeleted",
            render: (v: boolean) => v ? <Tag color="red">Deleted</Tag> : <Tag color="green">Active</Tag>
          },
          {
            title: "Actions",
            width: 150,
            render: (_: any, row: any) => (
              <Space>
                <Button size="small" onClick={() => handleOpenModal(row)}>
                  Edit
                </Button>
                <Popconfirm title="Sure delete?" onConfirm={() => handleDelete(row.id)}>
                  <Button danger size="small">Delete</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <PermissionFormModal
        open={modalOpen}
        data={editingData}
        onCancel={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          load();
        }}
      />
    </div>
  );
}