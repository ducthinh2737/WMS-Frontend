import {
  Modal,
  Form,
  InputNumber,
  message,
} from "antd";
import { useState } from "react";
import type { GoodsReceiptDto } from "../../types/purchase";
import { purchaseApi } from "../../api/purchase.api";

interface Props {
  open: boolean;
  gr: GoodsReceiptDto;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ProductionGRCountingModal({
  open,
  gr,
  onCancel,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // ✅ SAFE ARRAY
  const items = gr.productionReceiptItems ?? [];

  // ================= SUBMIT =================
  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // ✅ Payload đúng format backend mong đợi
      const payload: GoodsReceiptDto = {
        id: gr.id,
        code: gr.code,
        purchaseOrderId: gr.purchaseOrderId,
        warehouseId: gr.warehouseId,
        receiptType: gr.receiptType,
        status: gr.status,
        createdAt: gr.createdAt,
        updatedAt: gr.updatedAt,
        items: gr.items || [],
        productionReceiptItems: values.items.map((item: any) => ({
          id: item.id,
          productId: item.productId,
          quantity: items.find(i => i.id === item.id)?.quantity || 0,
          receipt_Qty: item.receipt_Qty, // ✅ Số lượng user nhập vào
          status: items.find(i => i.id === item.id)?.status || 0,
        })),
      };

      await purchaseApi.countingProductionGR(payload);

      message.success("Kiểm đếm GR sản xuất thành công");
      form.resetFields();
      onSuccess();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Kiểm đếm thất bại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Kiểm đếm GR sản xuất - ${gr.code}`}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={loading}
      okText="Xác nhận"
      destroyOnClose
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          items: items.map((i) => ({
            id: i.id,
            productId: i.productId,
            receipt_Qty: 0,
          })),
        }}
      >
        <Form.List name="items">
          {(fields) =>
            fields.map(({ key, name }) => {
              const item = items[name];

              return (
                <div
                  key={key}
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    border: "1px solid #f0f0f0",
                    borderRadius: 6,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <div style={{ marginBottom: 8 }}>
                    <strong>Product ID:</strong> {item.productId}
                  </div>
                  
                  <div style={{ marginBottom: 8, color: "#666" }}>
                    <strong>Số lượng dự kiến:</strong> {item.quantity}
                  </div>
                  
                  <div style={{ marginBottom: 8, color: "#666" }}>
                    <strong>Đã nhận:</strong> {item.receipt_Qty || 0}
                  </div>

                  {/* Hidden fields */}
                  <Form.Item name={[name, "id"]} hidden>
                    <input />
                  </Form.Item>
                  
                  <Form.Item name={[name, "productId"]} hidden>
                    <input />
                  </Form.Item>

                  <Form.Item
                    name={[name, "receipt_Qty"]}
                    label="Số lượng nhận thêm"
                    rules={[
                      { required: true, message: "Vui lòng nhập số lượng" },
                      { type: "number", min: 0, message: "Số lượng phải >= 0" },
                      {
                        validator: (_, value) => {
                          const remaining = item.quantity - (item.receipt_Qty || 0);
                          if (value > remaining) {
                            return Promise.reject(
                              `Không thể nhận quá ${remaining} sản phẩm`
                            );
                          }
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={item.quantity - (item.receipt_Qty || 0)}
                      style={{ width: "100%" }}
                      placeholder="Nhập số lượng nhận thêm"
                    />
                  </Form.Item>
                </div>
              );
            })
          }
        </Form.List>
      </Form>
    </Modal>
  );
}