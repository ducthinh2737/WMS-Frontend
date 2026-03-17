import {
  Modal,
  Select,
  InputNumber,
  message,
  Button,
  Form,
  Spin,
} from "antd";
import { useEffect, useState } from "react";
import { inventoryApi } from "../../api/inventory.api";
import { locationApi } from "../../api/location.api";
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
  onSuccess,
}: PutawayModalProps) {
  const [fromLocations, setFromLocations] = useState<
    { label: string; value: string }[]
  >([]);
  const [toLocations, setToLocations] = useState<
    { label: string; value: string }[]
  >([]);
  const [lots, setLots] = useState<
    { label: string; value: string; maxQty: number }[]
  >([]);
  const [selectedLotQty, setSelectedLotQty] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [form] = Form.useForm();

  // =========================
  // LOAD RECEIVING + STORAGE
  // =========================
  useEffect(() => {
    if (!open || !warehouseId || !productId) return;

    form.resetFields();
    setFromLocations([]);
    setToLocations([]);
    setLots([]);
    setSelectedLotQty(0);

    setLoadingLocations(true);

    // 1️⃣ Load Receiving có tồn
    inventoryApi
      .getAvailableLocations(productId, warehouseId)
      .then((res) => {
        const locations: LocationQtyDto[] = res.data;

        const fromLocs = locations
          .filter((l) => l.type === 1 && l.availableQty > 0)
          .map((l) => ({
            label: `${l.code} (Khả dụng: ${l.availableQty})`,
            value: l.id,
          }));

        setFromLocations(fromLocs);
      })
      .catch(() => {
        message.error("Không tải được vị trí Receiving");
      });

    // 2️⃣ Load toàn bộ Storage của warehouse
    locationApi
      .listByType(warehouseId, 2) // 2 = Storage
      .then((res) => {
        const toLocs = res.data.map((l: any) => ({
          label: l.code,
          value: l.id,
        }));

        setToLocations(toLocs);
      })
      .catch(() => {
        message.error("Không tải được vị trí Storage");
      })
      .finally(() => setLoadingLocations(false));
  }, [open, warehouseId, productId, form]);

  // =========================
  // LOAD LOT THEO LOCATION
  // =========================
  const handleFromLocationChange = async (locationId: string) => {
    form.setFieldsValue({ lotId: undefined, qty: undefined });
    setLots([]);
    setSelectedLotQty(0);

    if (!warehouseId || !productId) return;

    try {
      const res = await inventoryApi.query({
        warehouseId,
        productId,
        locationId,
      });

      const lotOptions = res.data
        .filter((x: any) => x.onHandQuantity > 0)
        .map((x: any) => ({
          label: `${x.lotCode} (Còn: ${x.onHandQuantity})`,
          value: x.lotId,
          maxQty: x.onHandQuantity,
        }));

      setLots(lotOptions);
    } catch {
      message.error("Không tải được danh sách Lot");
    }
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload: PutawayDto = {
        warehouseId: warehouseId!,
        productId: productId!,
        fromLocationId: values.fromLocationId,
        toLocationId: values.toLocationId,
        lotId: values.lotId, // 🔥 QUAN TRỌNG
        qty: values.qty,
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

  // =========================
  // RENDER
  // =========================
  return (
    <Modal
      title="Putaway"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Xác nhận
        </Button>,
      ]}
    >
      <Spin spinning={loadingLocations}>
        <Form layout="vertical" form={form}>
          {/* RECEIVING */}
          <Form.Item
            label="Vị trí nhận hàng (Receiving)"
            name="fromLocationId"
            rules={[{ required: true, message: "Chọn vị trí nhận hàng" }]}
          >
            <Select
              placeholder="Chọn vị trí nhận"
              options={fromLocations}
              onChange={handleFromLocationChange}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          {/* LOT */}
          <Form.Item
            label="Lot"
            name="lotId"
            rules={[{ required: true, message: "Chọn Lot" }]}
          >
            <Select
              placeholder="Chọn Lot"
              options={lots}
              onChange={(value) => {
                const lot = lots.find((l) => l.value === value);
                setSelectedLotQty(lot?.maxQty || 0);
              }}
              disabled={!lots.length}
            />
          </Form.Item>

          {/* STORAGE */}
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
            />
          </Form.Item>

          {/* QTY */}
          <Form.Item
            label="Số lượng"
            name="qty"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber
              min={1}
              max={selectedLotQty}
              style={{ width: "100%" }}
              disabled={!selectedLotQty}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
