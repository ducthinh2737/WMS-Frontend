import { Form, Input, Modal, message, Spin, Tag, Select, Popconfirm, Button, Space } from "antd";
import { useEffect, useState } from "react";
import { warehouseApi } from "../../api/warehouse.api";
import type { WarehouseStatus } from "../../types/warehouse";

interface Props {
  open: boolean;
  warehouseId?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

// Mapping từ String (UI) sang Number (Backend)
const statusMap: Record<WarehouseStatus, number> = {
  Active: 1,
  Inactive: 2,
  Locked: 3,
  Maintenance: 4,
};

export default function WarehouseEditModal({ open, warehouseId, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Mỗi khi mở Modal và có ID, tiến hành load dữ liệu
  useEffect(() => {
    if (open && warehouseId) {
      loadWarehouse();
    }
  }, [open, warehouseId]);

  const loadWarehouse = async () => {
    setFetching(true);
    try {
      // Lưu ý: Đảm bảo api warehouseApi có method getById hoặc get
      const res = await warehouseApi.getById(warehouseId!);
      const w = res.data;

      form.setFieldsValue({
        code: w.code,
        name: w.name,
        address: w.address || "",
        status: w.status, // Giả sử Backend trả về chuỗi "Active"
      });
    } catch {
      message.error("Không tải được thông tin kho");
      onCancel();
    } finally {
      setFetching(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        name: values.name?.trim(),
        code: values.code?.trim().toUpperCase(),
        address: values.address?.trim(),
        status: statusMap[values.status as WarehouseStatus], // Convert sang số
      };

      await warehouseApi.update(warehouseId!, payload);
      message.success("Cập nhật thành công");
      onSuccess();
    } catch (err: any) {
      const errors = err.response?.data?.errors;
      if (errors) {
        message.error(Object.values(errors).flat().join(", "));
      } else {
        message.error("Cập nhật thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLock = async () => {
    try {
      await warehouseApi.lock(warehouseId!);
      message.success("Đã khóa kho");
      onSuccess();
    } catch {
      message.error("Khóa kho thất bại");
    }
  };

  return (
    <Modal
      title={
        <Space>
          <span>Chỉnh sửa kho</span>
          <Tag color="blue">ID: {warehouseId?.slice(0, 8)}...</Tag>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={600}
      centered
      destroyOnClose
      // Custom footer để thêm nút Khóa kho
      footer={[
        <Popconfirm key="lock" title="Khóa kho này?" onConfirm={handleLock}>
          <Button danger style={{ float: 'left' }}>Khóa kho</Button>
        </Popconfirm>,
        <Button key="cancel" onClick={onCancel}>Hủy</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
          Lưu thay đổi
        </Button>
      ]}
    >
      <Spin spinning={fetching}>
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="code"
            label="Mã kho"
            rules={[
              { required: true, message: "Vui lòng nhập mã kho" },
              { pattern: /^[A-Z0-9_-]+$/, message: "Chỉ được dùng chữ hoa, số, gạch ngang và gạch dưới" },
            ]}
            normalize={(value) => value?.toUpperCase()}
          >
            <Input placeholder="VD: HCM01" maxLength={20} />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên kho"
            rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên kho" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, whitespace: true, message: "Vui lòng nhập địa chỉ" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Active"><Tag color="green">Hoạt động</Tag></Select.Option>
              <Select.Option value="Inactive"><Tag color="default">Ngừng hoạt động</Tag></Select.Option>
              <Select.Option value="Locked"><Tag color="red">Bị khóa</Tag></Select.Option>
              <Select.Option value="Maintenance"><Tag color="orange">Bảo trì</Tag></Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}