import { Form, Input, InputNumber, Button, message, Select, Card, Statistic, Row, Col, Divider } from "antd";
import { useState, useEffect } from "react";
import { purchaseApi } from "../../api/purchase.api";
import { warehouseApi } from "../../api/warehouse.api";
import { locationApi } from "../../api/location.api";
import type { GoodsReceiptCreateRequest, PurchaseOrderDto } from "../../types/purchase";
import type { LocationDto } from "../../types";

export default function GRCreate() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // Dữ liệu danh sách
  const [poList, setPoList] = useState<{ id: string; code: string }[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  
  // Dữ liệu sản phẩm của PO được chọn
  const [products, setProducts] = useState<{ 
    id: string; 
    name: string; 
    remaining: number; 
    ordered: number;
    received: number; 
  }[]>([]);
  
  // Sản phẩm hiện đang được chọn trong dropdown
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Load PO (chỉ lấy những PO đã Approved) và Kho khi mở trang
  useEffect(() => {
    purchaseApi.getPOs({ status: "Approved" }).then(res => setPoList(res.data));
    warehouseApi.query(1, 100).then(res => setWarehouses(res.data.items));
  }, []);

  // Khi chọn PO -> Gọi API lấy chi tiết PO để có số 'receivedQuantity' mới nhất
  const onPOChange = async (poId: string) => {
    try {
      setLoading(true);
      const res = await purchaseApi.getPOM0(poId);
      const po = res.data;
      
      const mappedProducts = po.items?.map((i: any) => ({
        id: i.productId,
        name: i.productName || `Sản phẩm ${i.productId}`,
        ordered: i.quantity,
        received: i.receivedQuantity || 0,
        remaining: i.quantity - (i.receivedQuantity || 0),
      })) || [];

      setProducts(mappedProducts);
      
      // Reset các field liên quan khi đổi PO
      form.setFieldsValue({ productId: undefined, quantity: undefined });
      setSelectedProduct(null);
    } catch (error) {
      message.error("Không thể lấy thông tin chi tiết PO này");
    } finally {
      setLoading(false);
    }
  };

  // Khi chọn sản phẩm cụ thể trong PO
  const onProductChange = (productId: string) => {
    const prod = products.find(p => p.id === productId);
    setSelectedProduct(prod);
    
    // Gợi ý luôn số lượng nhập kho là số còn lại
    form.setFieldsValue({ quantity: prod ? prod.remaining : undefined });
  };

  const onWarehouseChange = async (warehouseId: string) => {
    try {
      const res = await locationApi.list(warehouseId);
      setLocations(res.data);
      form.setFieldsValue({ locationId: undefined });
    } catch (error) {
      message.error("Không thể tải danh sách vị trí của kho này");
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    const payload: GoodsReceiptCreateRequest = {
      code: values.Code,
      PurchaseOrderId: values.poId,
      warehouseId: values.warehouseId,
      items: [
        {
          productId: values.productId,
          locationId: values.locationId,
          quantity: values.quantity,
        },
      ],
    };

    try {
      await purchaseApi.createGR(payload);
      message.success("Tạo phiếu nhập kho thành công!");
      form.resetFields();
      setSelectedProduct(null);
      setProducts([]);
    } catch (error: any) {
      // Hiển thị lỗi từ Backend (ví dụ: Received quantity exceeds PO)
      message.error(error.response?.data?.message || "Lỗi tạo phiếu nhập kho");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Tạo Phiếu Nhập Kho (Goods Receipt)" style={{ maxWidth: 800, margin: "0 auto" }}>
      
      {/* Khu vực hiển thị con số thống kê nhanh */}
      {selectedProduct && (
        <>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic title="Số lượng đặt" value={selectedProduct.ordered} />
            </Col>
            <Col span={8}>
              <Statistic title="Đã nhận" value={selectedProduct.received} valueStyle={{ color: '#3f8600' }} />
            </Col>
            <Col span={8}>
              <Statistic title="Còn lại tối đa" value={selectedProduct.remaining} valueStyle={{ color: '#cf1322' }} />
            </Col>
          </Row>
          <Divider />
        </>
      )}

      <Form
        form={form}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
        onFinish={onFinish}
        layout="horizontal"
      >
        <Form.Item
          label="Mã phiếu GR"
          name="Code"
          rules={[{ required: true, message: "Vui lòng nhập mã phiếu!" }]}
        >
          <Input placeholder="Ví dụ: GR-2023-001" />
        </Form.Item>

        <Form.Item
          label="Chọn Đơn mua (PO)"
          name="poId"
          rules={[{ required: true, message: "Vui lòng chọn PO!" }]}
        >
          <Select placeholder="Chọn đơn hàng PO đã phê duyệt" onChange={onPOChange}>
            {poList.map(po => (
              <Select.Option key={po.id} value={po.id}>{po.code}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Kho nhận"
          name="warehouseId"
          rules={[{ required: true, message: "Vui lòng chọn kho!" }]}
        >
          <Select placeholder="Chọn kho nhập hàng" onChange={onWarehouseChange}>
            {warehouses.map(w => (
              <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Vị trí (Location)"
          name="locationId"
          rules={[{ required: true, message: "Vui lòng chọn vị trí trong kho!" }]}
        >
          <Select placeholder="Chọn kệ/vị trí" disabled={locations.length === 0}>
            {locations.map(l => (
              <Select.Option key={l.id} value={l.id}>{l.code}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Sản phẩm"
          name="productId"
          rules={[{ required: true, message: "Vui lòng chọn sản phẩm!" }]}
        >
          <Select 
            placeholder="Chọn sản phẩm trong PO" 
            onChange={onProductChange} 
            disabled={products.length === 0}
          >
            {products.map(p => (
              <Select.Option key={p.id} value={p.id} disabled={p.remaining <= 0}>
                ID: {p.id} - {p.name} (Còn lại: {p.remaining})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Số lượng nhập"
          name="quantity"
          rules={[
            { required: true, message: "Nhập số lượng!" },
            {
              validator: (_, value) => {
                if (selectedProduct && value > selectedProduct.remaining) {
                  return Promise.reject(`Vượt quá số lượng còn lại (${selectedProduct.remaining})`);
                }
                if (value <= 0) {
                  return Promise.reject("Số lượng phải lớn hơn 0");
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber 
            min={1} 
            max={selectedProduct?.remaining} 
            style={{ width: "100%" }} 
            placeholder={selectedProduct ? `Tối đa ${selectedProduct.remaining}` : "Nhập số lượng"}
          />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            block
            disabled={!selectedProduct || selectedProduct.remaining <= 0}
          >
            Xác nhận nhập kho
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}