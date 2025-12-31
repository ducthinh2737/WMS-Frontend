import { Table, Button, Select, message, Spin } from "antd";
import { useEffect, useState } from "react";
import { purchaseApi } from "../../api/purchase.api";
import { supplierApi } from "../../api/supplier.api";
import type { PurchaseOrderDto } from "../../types/purchase";
import type { SupplierDto } from "../../types/supplier";

export default function PurchaseList() {
  const [poList, setPoList] = useState<PurchaseOrderDto[]>([]);
  const [status, setStatus] = useState<string>();
  
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // --- Fetch suppliers
  const fetchSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const res = await supplierApi.getAll();
      setSuppliers(res.data);
    } catch {
      message.error("Failed to fetch suppliers");
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // --- Fetch POs
  const fetchPOs = async () => {
    try {
      const res = await purchaseApi.getPOs({ status });
      setPoList(res.data);
    } catch {
      message.error("Failed to fetch purchase orders");
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchPOs();
  }, []);

  useEffect(() => {
    fetchPOs();
  }, [status]);

  // --- Columns
  const columns = [
  { title: "PO ID", dataIndex: "id" },
  { title: "Code", dataIndex: "code" },
  {
    title: "Supplier",
    dataIndex: "supplierId",
    render: (supplierId: number) => {
      if (loadingSuppliers) return <Spin size="small" />;
      const supplier = suppliers.find(s => s.id === supplierId);
      return supplier ? supplier.name : "Unknown";
    }
  },
  { title: "Status", dataIndex: "status" },
  { title: "Created At", dataIndex: "createdAt" },
  {
    title: "Action",
    render: (_: any, record: PurchaseOrderDto) => {
      // Ẩn nút nếu status là Approved hoặc Rejected
      if (record.status === "Approved" || record.status === "Rejected") {
        return <span style={{ color: "#999" }}>—</span>;
      }
      
      return (
        <>
          <Button type="link" onClick={() => approve(record.id)}>Approve</Button>
          <Button type="link" danger onClick={() => reject(record.id)}>Reject</Button>
        </>
      );
    }
  }
];

  const approve = async (id: string) => {
    try {
      await purchaseApi.approvePO(id);
      message.success("PO approved");
      fetchPOs();
    } catch {
      message.error("Failed to approve PO");
    }
  };

  const reject = async (id: string) => {
    try {
      await purchaseApi.rejectPO(id);
      message.success("PO rejected");
      fetchPOs();
    } catch {
      message.error("Failed to reject PO");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by status"
          allowClear
          onChange={setStatus}
          style={{ width: 200 }}
          options={[
            { label: "Pending", value: "Pending" },
            { label: "Approved", value: "Approved" },
            { label: "Rejected", value: "Rejected" },
          ]}
        />
        <Button onClick={fetchPOs} style={{ marginLeft: 8 }}>Filter</Button>
      </div>

      <Table rowKey="id" columns={columns} dataSource={poList} />
    </div>
  );
}
