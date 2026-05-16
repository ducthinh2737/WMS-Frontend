import { Modal, Form, Select, Input, message } from "antd";
import { useEffect, useState } from "react";
import { stockTakeApi } from "../../api/stocktake.api";
import { warehouseApi } from "../../api/warehouse.api";

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CreateStockTakeModal({ visible, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
        // Lấy 100 kho để chọn, map đúng cấu trúc paging {items: []}
        warehouseApi.query(1, 100).then((res: any) => {
            const list = res.data?.items || res.data || [];
            setWarehouses(list);
        });
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await stockTakeApi.create(values);
      message.success("Tạo phiếu kiểm kê thành công!");
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi tạo phiếu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Tạo đợt kiểm kê mới"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="warehouseId" label="Kho kiểm kê" rules={[{ required: true }]}>
          <Select placeholder="Chọn kho">
            {warehouses.map((w) => (
              <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="description" label="Ghi chú">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
