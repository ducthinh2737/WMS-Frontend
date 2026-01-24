import { Form, Input, Modal, message, Select, Switch, Spin } from "antd";
import { useEffect, useState } from "react";
import { locationApi } from "../../api/location.api";
import type { LocationUpdateDto } from "../../types/location";

// Định nghĩa Interface cho Props để tránh lỗi TS 2322
interface LocationEditModalProps {
  open: boolean;
  warehouseId: string;
  locationId?: string; // ID của vị trí cần sửa
  onCancel: () => void;
  onSuccess: () => void;
}

const LocationTypeOptions = [
  { value: 1, label: "Khu vực tiếp nhận" },
  { value: 2, label: "Khu vực lưu trữ" },
  { value: 3, label: "Khu vực xuất hàng" },
  { value: 4, label: "Khu vực hàng hỏng" },
  { value: 5, label: "Khu vực hàng trả" }
];

export default function LocationEditModal({ 
  open, 
  warehouseId, 
  locationId, 
  onCancel, 
  onSuccess 
}: LocationEditModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Load dữ liệu cũ vào Form khi mở Modal
  useEffect(() => {
    if (open && warehouseId && locationId) {
      const loadDetail = async () => {
        setFetching(true);
        try {
          const res = await locationApi.getById(warehouseId, locationId);
          form.setFieldsValue(res.data);
        } catch (err) {
          message.error("Không thể tải thông tin vị trí");
          onCancel();
        } finally {
          setFetching(false);
        }
      };
      loadDetail();
    }
  }, [open, warehouseId, locationId, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload: LocationUpdateDto = {
        id: locationId!,
        code: values.code?.toUpperCase().trim(),
        LocationType: values.type,
        description: values.description?.trim() || "",
        isActive: values.isActive,
      };

      await locationApi.update(warehouseId, locationId!, payload);
      message.success("Cập nhật vị trí thành công");
      onSuccess();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Chỉnh sửa vị trí lưu trữ"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      centered
      destroyOnClose
    >
      <Spin spinning={fetching}>
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
        >
          <Form.Item
            label="Mã vị trí"
            name="code"
            rules={[
              { required: true, message: "Vui lòng nhập mã vị trí" },
            ]}
          >
            <Input placeholder="Ví dụ: A1-01-03" />
          </Form.Item>

          <Form.Item label="Loại vị trí" name="type" rules={[{ required: true }]}>
            <Select options={LocationTypeOptions} />
          </Form.Item>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Trạng thái hoạt động" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}