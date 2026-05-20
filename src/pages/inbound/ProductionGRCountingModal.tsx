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
import type { GoodsReceiptDto } from "../../types/inbound";
import { inboundApi } from "../../api/inbound.api";
import { productApi } from "../../api/product.api";
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
  const [products, setProducts] = useState<any[]>([]);

  const items = gr.productionReceiptItems ?? [];

  useEffect(() => {
    productApi.getAll().then(res => setProducts(res.data || []));
  }, []);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          expiryDate: i.expiryDate ? dayjs(i.expiryDate) : null,
          manufacturingDate: i.manufacturingDate ? dayjs(i.manufacturingDate) : null,
          receipt_Qty: i.quantity - (i.receipt_Qty || 0),
        })),
      });
    }
  }, [open, items, form]);

  // ================= SUBMIT =================
  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload: any = {
        ...gr,
        productionReceiptItems: values.items.map((formItem: any) => {
          const originalItem = items.find((i) => i.id === formItem.id);
          return {
            ...originalItem,
            lotCode: "",  // sinh tự động ở backend
            expiryDate: formItem.expiryDate
              ? formItem.expiryDate.format('YYYY-MM-DD')
              : null,
            manufacturingDate: formItem.manufacturingDate
              ? formItem.manufacturingDate.format('YYYY-MM-DD')
              : null,
            receipt_Qty: formItem.receipt_Qty,
          };
        }),
      };

      await inboundApi.countingProductionGR(payload);

      message.success("Kiểm hàng thành công");
      onSuccess();
    } catch (err: any) {
      console.error("Counting Error:", err.response?.data);
      const errorMsg = err.response?.data?.errors
        ? "Dữ liệu không hợp lệ"
        : err.response?.data?.message || "Kiểm đếm thất bại";
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Kiểm hàng - Phiếu: ${gr.code}`}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={loading}
      okText="Xác nhận nhập kho"
      cancelText="Hủy bỏ"
      destroyOnHidden
      width={750}
    >
      <div style={{ marginBottom: 16, color: "#666" }}>
        <i>
          Ghi chú: Lot Code sẽ được hệ thống tự động tạo. Vui lòng nhập ngày
          sản xuất và hạn sử dụng từ bao bì thực tế.
        </i>
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
                      <div style={{ marginBottom: 4 }}>
                        <strong>{products.find(p => p.id === item.productId)?.name || `Sản phẩm ID: ${item.productId}`}</strong>
                      </div>
                      {item.unitName && (
                        <div style={{ fontSize: "12px", color: "#888", marginBottom: 4 }}>
                          Đơn vị tính: {item.unitName}
                        </div>
                      )}
                      <div style={{ fontSize: "12px", color: "#888" }}>
                        Tổng dự kiến: {item.quantity} | Đã nhận:{" "}
                        {item.receipt_Qty || 0}
                      </div>
                    </Col>
                    <Col span={12} style={{ textAlign: "right" }}>
                      <span style={{ color: "#fa8c16", fontWeight: "bold" }}>
                        Còn lại: {remainingQty}
                      </span>
                    </Col>
                  </Row>

                  <Divider style={{ margin: "12px 0" }} />

                  <Row gutter={12}>
                    {/* NGÀY SẢN XUẤT */}
                    <Col span={8}>
                      <Form.Item
                        name={[name, "manufacturingDate"]}
                        label="Ngày sản xuất"
                      >
                        <DatePicker
                          style={{ width: "100%" }}
                          format="DD/MM/YYYY"
                          placeholder="Chọn ngày SX"
                        />
                      </Form.Item>
                    </Col>

                    {/* HẠN DÙNG */}
                    <Col span={8}>
                      <Form.Item
                        name={[name, "expiryDate"]}
                        label="Hạn sử dụng"
                      >
                        <DatePicker
                          style={{ width: "100%" }}
                          format="DD/MM/YYYY"
                          placeholder="Chọn hạn dùng"
                        />
                      </Form.Item>
                    </Col>

                    {/* SỐ LƯỢNG THỰC NHẬN */}
                    <Col span={8}>
                      <Form.Item
                        name={[name, "receipt_Qty"]}
                        label="SL Nhận"
                        rules={[
                          { required: true, message: "Nhập SL" },
                          {
                            validator: (_, value) => {
                              if (value > remainingQty)
                                return Promise.reject(`Tối đa ${remainingQty}`);
                              if (value <= 0)
                                return Promise.reject(`Phải > 0`);
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={remainingQty}
                          style={{
                            width: "100%",
                            border: "1px solid #fa8c16",
                          }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Hidden fields */}
                  <Form.Item name={[name, "id"]} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item name={[name, "productId"]} hidden>
                    <Input />
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
