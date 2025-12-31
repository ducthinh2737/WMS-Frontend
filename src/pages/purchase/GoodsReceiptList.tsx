import { Table, Button, Select, message, Spin } from "antd";
import { useEffect, useState } from "react";
import { purchaseApi } from "../../api/purchase.api";
import type { GoodsReceiptDto, PurchaseQueryParams } from "../../types/purchase";

export default function GRList() {
  const [grList, setGrList] = useState<GoodsReceiptDto[]>([]);
  const [poList, setPoList] = useState<{ id: string; code: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [poId, setPoId] = useState<string>();

  useEffect(() => {
    const fetchPOs = async () => {
      try {
        const res = await purchaseApi.getPOs({ status: "Approved" });
        setPoList(res.data);
      } catch {
        message.error("Failed to fetch POs");
      }
    };

    fetchPOs();
    fetchGRs();
  }, []);

  const fetchGRs = async () => { 
    setLoading(true);
    try {
      const params: PurchaseQueryParams = {};
      if (poId) params.poId = poId;
      const res = await purchaseApi.getGRs(params);
      setGrList(res.data);
    } catch {
      message.error("Failed to fetch GRs");
    } finally {
      setLoading(false);
    }
  };

  const cancelGR = async (id: string) => {
    try {
      await purchaseApi.cancelGR(id);
      message.success("GR canceled");
      fetchGRs();
    } catch {
      message.error("Failed to cancel GR");
    }
  };

  // Tạo data table dạng "children" để mỗi item của GR hiển thị 1 dòng
  const tableData = grList.flatMap(gr =>
    gr.items.map(item => ({
      key: `${gr.id}-${item.productId}`,
      grId: gr.id,
      code: gr.code,
      poId: gr.poIds , // sửa nếu API trả về tên khác
      productId: item.productId,
      quantity: item.quantity,
      locationId: (item as any).locationId,
      createdAt: gr.createdAt,
      cancelId: gr.id,  
    }))
  );

  const columns = [
    { title: "GR ID", dataIndex: "grId" },
    { title: "GR CODE", dataIndex: "code" },
    { title: "Product ID", dataIndex: "productId" },
    { title: "Quantity", dataIndex: "quantity" },
    { title: "Location", dataIndex: "locationId" },
    { title: "Created At", dataIndex: "createdAt" },
    
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by PO ID"
          allowClear
          onChange={setPoId}
          style={{ width: 250, marginRight: 8 }}
          value={poId}
        >
          {poList.map(po => (
            <Select.Option key={po.id} value={po.id}>
              {po.code} ({po.id})
            </Select.Option>
          ))}
        </Select>
        <Button onClick={fetchGRs}>Filter</Button>
      </div>

      {loading ? <Spin /> : <Table rowKey="key" columns={columns} dataSource={tableData} />}
    </div>
  );
}
