import {
  Modal, Form, InputNumber, Button, Space, message, Select, Row, Col, Divider
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { purchaseApi } from "../../api/purchase.api";
import { warehouseApi } from "../../api/warehouse.api";
import { productApi } from "../../api/product.api";

interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CreateProductionGRModal({ open, onCancel, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [whRes, prodRes] = await Promise.all([
            warehouseApi.getByWarehouseType({ warehousetype: 1 }),
            productApi.getAllByType(1)
          ]);
          setWarehouses(whRes.data.result || []);
          setProducts(prodRes.data || []);
        } catch {
          message.error("Không thể tải dữ liệu danh mục");
        }
      };
      fetchData();
    } else {
      form.resetFields();
    }
  }, [open, form]);

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        warehouseId: values.warehouseId,
        code: "",  // sinh tự động ở backend
        receiptType: 1,
        productionReceiptItems: values.items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          lotCode: "",   // sinh tự động ở backend
          status: 1
        })),
      };

      await purchaseApi.createGR(payload);
      message.success("Tạo GR sản xuất thành công. Bây giờ bạn có thể Duyệt phiếu này.");
      onSuccess();
    } catch (error: any) {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors) {
        message.error("Lỗi dữ liệu: " + Object.values(apiErrors).flat().join(", "));
      } else {
        message.error(error.response?.data?.message || "Thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Tạo Phiếu Nhập Sản Xuất"
      onCancel={onCancel}
      width={700}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item name="warehouseId" label="Kho nhận" rules={[{ required: true }]}>
          <Select placeholder="Chọn kho">
            {warehouses.map(w => (
              <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Chi tiết sản phẩm</Divider>

        <Form.List name="items" initialValue={[{}]}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Row key={key} gutter={8} align="bottom" style={{ marginBottom: 12 }}>
                  <Col span={14}>
                    <Form.Item
                      {...restField}
                      name={[name, "productId"]}
                      label="Sản phẩm"
                      rules={[{ required: true }]}
                    >
                      <Select showSearch optionFilterProp="label">
                        {products.map(p => (
                          <Select.Option key={p.id} value={p.id} label={p.name}>
                            {p.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      {...restField}
                      name={[name, "quantity"]}
                      label="Số lượng"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={2}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      style={{ marginBottom: 24 }}
                    />
                  </Col>
                </Row>
              ))}
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Thêm dòng
              </Button>
            </>
          )}
        </Form.List>

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Space>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" loading={loading} onClick={onSubmit}>Tạo phiếu</Button>
          </Space>
        </div>
      </Form>
    </Modal>
  );
}