import { Modal, Select, InputNumber, message, Button, Form, Spin } from "antd";
import { useEffect, useState } from "react";
import { inventoryApi } from "../../api/inventory.api";
import type { PutawayDto, LocationQtyDto } from "../../types/inventory";

interface PutawayModalProps {
  open: boolean;
  productId: number | null;
  warehouseId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PutawayModal({
  open,
  productId,
  warehouseId,
  onClose,
  onSuccess
}: PutawayModalProps) {

  const [fromLocations, setFromLocations] = useState<{ label: string; value: string }[]>([]);
  const [toLocations, setToLocations] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open || !warehouseId || !productId) return;

    form.resetFields();
    setFromLocations([]);
    setToLocations([]);
    setLoadingLocations(true);

    inventoryApi.getAvailableLocations(productId, warehouseId)
      .then(res => {
        const locations: LocationQtyDto[] = res.data;

        // Receiving locations có tồn khả dụng
        const fromLocs = locations
          .filter(l => l.type === 1 && l.availableQty > 0)
          .map(l => ({
            label: `${l.code} (Khả dụng: ${l.availableQty})`,
            value: l.id
          }));

        // Storage locations
        const toLocs = locations
          .filter(l => l.type === 2)
          .map(l => ({
            label: l.code,
            value: l.id
          }));

        setFromLocations(fromLocs);
        setToLocations(toLocs);
      })
      .catch(() => {
        message.error("Không tải được danh sách vị trí");
        setFromLocations([]);
        setToLocations([]);
      })
      .finally(() => setLoadingLocations(false));
  }, [open, warehouseId, productId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: PutawayDto = {
        warehouseId: warehouseId!,
        productId: productId!,
        fromLocationId: values.fromLocationId,
        toLocationId: values.toLocationId,
        qty: values.qty
      };

      setLoading(true);
      await inventoryApi.putaway(payload);
      message.success("Putaway thành công");
      onSuccess();
    } catch (err: any) {
      if (err.errorFields) return;
      message.error(err.message || "Putaway thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Putaway"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>Hủy</Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Xác nhận
        </Button>
      ]}
    >
      <Spin spinning={loadingLocations}>
        <Form layout="vertical" form={form}>
          <Form.Item
            label="Vị trí nhận hàng (Receiving)"
            name="fromLocationId"
            rules={[{ required: true, message: "Chọn vị trí nhận hàng" }]}
          >
            <Select
              placeholder="Chọn vị trí nhận"
              options={fromLocations}
              showSearch
              optionFilterProp="label"
              allowClear
              notFoundContent="Không có vị trí Receiving khả dụng"
            />
          </Form.Item>

          <Form.Item
            label="Vị trí lưu trữ (Storage)"
            name="toLocationId"
            rules={[{ required: true, message: "Chọn vị trí lưu trữ" }]}
          >
            <Select
              placeholder="Chọn vị trí lưu trữ"
              options={toLocations}
              showSearch
              optionFilterProp="label"
              allowClear
              notFoundContent="Không có vị trí Storage"
            />
          </Form.Item>

          <Form.Item
            label="Số lượng"
            name="qty"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
