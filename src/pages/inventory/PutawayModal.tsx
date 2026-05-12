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

import type {
  PutawayDto,
  LocationQtyDto,
} from "../../types/inventory";

interface PutawayModalProps {
  open: boolean;

  productId: number | null;

  warehouseId?: string;

  fromLocationId?: string;

  lotId?: string;

  maxQty?: number;

  onClose: () => void;

  onSuccess: () => void;
}

export default function PutawayModal({
  open,
  productId,
  warehouseId,
  fromLocationId,
  lotId,
  maxQty,

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

  const [selectedLotQty, setSelectedLotQty] =
    useState<number>(0);

  const [loading, setLoading] = useState(false);

  const [loadingLocations, setLoadingLocations] =
    useState(false);

  const [form] = Form.useForm();

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    if (!open || !warehouseId || !productId) return;

    form.resetFields();

    setLoadingLocations(true);

    setSelectedLotQty(maxQty || 0);

    Promise.all([
      inventoryApi.getAvailableLocations(
        productId,
        warehouseId
      ),

      locationApi.listByType(warehouseId, 2),
    ])
      .then(([fromRes, toRes]) => {
        // RECEIVING
        const fromLocs = fromRes.data
          .filter(
            (l: LocationQtyDto) =>
              l.type === 1 &&
              l.availableQty > 0
          )
          .map((l: LocationQtyDto) => ({
            label: `${l.code} (Khả dụng: ${l.availableQty})`,
            value: l.id,
          }));

        setFromLocations(fromLocs);

        // STORAGE
        const toLocs = toRes.data.map((l: any) => ({
          label: l.code,
          value: l.id,
        }));

        setToLocations(toLocs);

        // LOAD LOT
        return inventoryApi.query({
          warehouseId,
          productId,
          locationId: fromLocationId,
        });
      })
      .then((lotRes) => {
        const lotOptions = lotRes.data
          .filter((x: any) => x.onHandQuantity > 0)
          .map((x: any) => ({
            label: `${x.lotCode} (Còn: ${x.onHandQuantity})`,
            value: x.lotId,
            maxQty: x.onHandQuantity,
          }));

        setLots(lotOptions);

        // AUTO FILL
        form.setFieldsValue({
          fromLocationId,
          lotId,
          qty: undefined,
        });
      })
      .catch(() => {
        message.error("Không tải dữ liệu Putaway");
      })
      .finally(() => {
        setLoadingLocations(false);
      });
  }, [
    open,
    warehouseId,
    productId,
    fromLocationId,
    lotId,
    maxQty,
    form,
  ]);

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
        lotId: values.lotId,
        qty: values.qty,
      };

      setLoading(true);

      await inventoryApi.putaway(payload);

      message.success("Putaway thành công");

      onSuccess();
    } catch (err: any) {
      if (err.errorFields) return;

      message.error(
        err.message || "Putaway thất bại"
      );
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
        <Form form={form} layout="vertical">
          {/* RECEIVING */}
          <Form.Item
            label="Vị trí nhận hàng"
            name="fromLocationId"
            rules={[
              {
                required: true,
                message: "Chọn vị trí nhận",
              },
            ]}
          >
            <Select
              disabled
              options={fromLocations}
            />
          </Form.Item>

          {/* LOT */}
          <Form.Item
            label="Lot"
            name="lotId"
            rules={[
              {
                required: true,
                message: "Chọn Lot",
              },
            ]}
          >
            <Select disabled options={lots} />
          </Form.Item>

          {/* STORAGE */}
          <Form.Item
            label="Vị trí lưu trữ"
            name="toLocationId"
            rules={[
              {
                required: true,
                message: "Chọn vị trí lưu trữ",
              },
            ]}
          >
            <Select
              placeholder="Chọn vị trí Storage"
              options={toLocations}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          {/* QTY */}
          <Form.Item
            label={`Số lượng (Tối đa: ${selectedLotQty})`}
            name="qty"
            rules={[
              {
                required: true,
                message: "Nhập số lượng",
              },

              {
                validator(_, value) {
                  if (!value) {
                    return Promise.reject(
                      "Nhập số lượng"
                    );
                  }

                  if (value <= 0) {
                    return Promise.reject(
                      "Số lượng phải lớn hơn 0"
                    );
                  }

                  if (value > selectedLotQty) {
                    return Promise.reject(
                      `Không được vượt quá ${selectedLotQty}`
                    );
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={1}
              max={selectedLotQty}
              precision={0}
              style={{ width: "100%" }}
              disabled={!selectedLotQty}
              parser={(value) => {
                if (!value) return 1;

                const parsed = Number(
                  value.replace(/[^\d]/g, "")
                );

                if (isNaN(parsed)) return 1;

                return parsed;
              }}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}