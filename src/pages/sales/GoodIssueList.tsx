// src/pages/sales/GoodsIssueList.tsx
import { Card, Table, Button, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { goodsIssueApi } from "../../api/goodissue.api";

interface GIItem {
  id: string;
  code: string;
  warehouseName: string;
  status: string;
  issuedAt: string;
}

export default function GoodsIssueList() {
  const [list, setList] = useState<GIItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadList = async () => {
    try {
      setLoading(true);
      const res = await goodsIssueApi.query();
      setList(res.data);
    } catch {
      message.error("Failed to load Goods Issues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  return (
    <Card
      title="Goods Issue List"
      // extra={
      //   <Button type="primary" onClick={() => navigate("/sales/goods-issue/create")}>
      //     Create Goods Issue
      //   </Button>
      // }
    >
      <Table
        dataSource={list}
        rowKey="id"
        loading={loading}
        columns={[
          { title: "Code", dataIndex: "code" },
          { title: "Warehouse", dataIndex: "warehouseName" },
          { title: "Status", dataIndex: "status" },
          {
            title: "Issued At",
            dataIndex: "issuedAt",
            render: (val) => new Date(val).toLocaleString(),
          },
          {
            title: "Action",
            render: (_, record) => (
              <Button type="link" onClick={() => navigate(`/sales/goods-issue/${record.id}`)}>
                View
              </Button>
            ),
          },
        ]}
      />
    </Card>
  );
}
