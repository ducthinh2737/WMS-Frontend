import {
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  DatePicker,
  Divider,
  Row,
  Col,
} from "antd";
import { useState, useEffect } from "react";
import type { GoodsReceiptDto } from "../../types/purchase";
import { purchaseApi } from "../../api/purchase.api";
import dayjs from "dayjs";

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

  // Lấy danh sách item từ phiếu nhập hiện tại
  const items = gr.productionReceiptItems ?? [];

  // Reset form mỗi khi mở modal với dữ liệu mới
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          lotCode: i.lotCode, // Nếu đã có lot từ bước tạo thì hiện lên, chưa có thì để trống
          expiryDate: i.expiryDate ? dayjs(i.expiryDate) : null,
          receipt_Qty: i.quantity - (i.receipt_Qty || 0), // Gợi ý nhập hết số còn lại
        })),
      });
    }
  }, [open, items, form]);

  // ================= SUBMIT =================
  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Map lại dữ liệu để gửi về Backend
      const payload: any = {
        ...gr, // Giữ nguyên các thông tin header của phiếu GR
        productionReceiptItems: values.items.map((formItem: any) => {
          const originalItem = items.find((i) => i.id === formItem.id);
          return {
            ...originalItem, // Giữ các trường id, productId gốc
            lotCode: formItem.lotCode, // Cập nhật Lot Code mới nhập
            expiryDate: formItem.expiryDate ? formItem.expiryDate.toISOString() : null,
            receipt_Qty: formItem.receipt_Qty, // Số lượng thực tế đếm được đợt này
          };
        }),
      };

      await purchaseApi.countingProductionGR(payload);

      message.success("Cập nhật số lô và kiểm đếm thành công");
      onSuccess();
    } catch (err: any) {
      console.error("Counting Error:", err.response?.data);
      const errorMsg = err.response?.data?.errors 
        ? "Dữ liệu không hợp lệ (Kiểm tra mã lô)" 
        : (err.response?.data?.message || "Kiểm đếm thất bại");
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Kiểm đếm & Nhập số lô - Phiếu: ${gr.code}`}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={loading}
      okText="Xác nhận nhập kho"
      cancelText="Hủy bỏ"
      destroyOnClose
      width={700}
    >
      <div style={{ marginBottom: 16, color: '#666' }}>
        <i>Ghi chú: Vui lòng kiểm tra mã lô (Lot) trên bao bì thực tế trước khi xác nhận.</i>
      </div>

      <Form form={form} layout="vertical">
        <Form.List name="items">
          {(fields) =>
            fields.map(({ key, name }) => {
              const item = items[name];
              const remainingQty = item.quantity - (item.receipt_Qty || 0);

              return (
                <div
                  key={key}
                  style={{
                    marginBottom: 20,
                    padding: "16px 16px 0 16px",
                    border: "1px solid #d9d9d9",
                    borderRadius: 8,
                    backgroundColor: "#f5f5f5",
                  }}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <div style={{ marginBottom: 8 }}>
                        <strong>Sản phẩm ID:</strong> {item.productId}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        Tổng dự kiến: {item.quantity} | Đã nhận: {item.receipt_Qty || 0}
                      </div>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>
                        Còn lại: {remainingQty}
                      </span>
                    </Col>
                  </Row>

                  <Divider style={{ margin: '12px 0' }} />

                  <Row gutter={12}>
                    {/* NHẬP MÃ LÔ - BẮT BUỘC */}
                    <Col span={10}>
                      <Form.Item
                        name={[name, "lotCode"]}
                        label="Mã Lô (Lot Code)"
                        rules={[{ required: true, message: "Phải nhập mã lô" }]}
                      >
                        <Input placeholder="Ví dụ: LOT20260205" />
                      </Form.Item>
                    </Col>

                    {/* HẠN DÙNG */}
                    <Col span={7}>
                      <Form.Item name={[name, "expiryDate"]} label="Hạn dùng">
                        <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>

                    {/* SỐ LƯỢNG THỰC NHẬN */}
                    <Col span={7}>
                      <Form.Item
                        name={[name, "receipt_Qty"]}
                        label="SL Nhận"
                        rules={[
                          { required: true, message: "Nhập SL" },
                          {
                            validator: (_, value) => {
                              if (value > remainingQty) {
                                return Promise.reject(`Tối đa ${remainingQty}`);
                              }
                              if (value <= 0) {
                                return Promise.reject(`Phải > 0`);
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={remainingQty}
                          style={{ width: "100%", border: '1px solid #fa8c16' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Hidden fields */}
                  <Form.Item name={[name, "id"]} hidden><Input /></Form.Item>
                  <Form.Item name={[name, "productId"]} hidden><Input /></Form.Item>
                </div>
              );
            })
          }
        </Form.List>
      </Form>
    </Modal>
  );
}