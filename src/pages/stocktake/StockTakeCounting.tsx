import {
  Table,
  InputNumber,
  Button,
  Card,
  Typography,
  message,
  Space,
  Tag,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  SaveOutlined,
  CheckSquareOutlined,
  ArrowLeftOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { stockTakeApi } from "../../api/stocktake.api";
import type { StockTakeDto } from "../../types/stocktake";

const { Title, Text } = Typography;

export default function StockTakeCounting() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<StockTakeDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) fetchDetail(id);
  }, [id]);

  const fetchDetail = async (stockId: string) => {
    setLoading(true);

    try {
      const res = await stockTakeApi.get(stockId);

      // fallback countedQty = systemQty nếu null
      const normalized = {
        ...res.data,
        items: res.data.items.map((x: any) => ({
          ...x,
          countedQty:
            x.countedQty !== null &&
              x.countedQty !== undefined
              ? x.countedQty
              : x.systemQty,
        })),
      };

      setData(normalized);
    } catch (err) {
      message.error("Không thể tải chi tiết phiếu");
    } finally {
      setLoading(false);
    }
  };

  const onQtyChange = (val: number | null, index: number) => {
    if (!data) return;

    // CHO PHÉP = 0
    if (val !== null && val < 0) {
      message.error("Số lượng không được âm");
      return;
    }

    const items = [...data.items];

    items[index] = {
      ...items[index],
      countedQty: val ?? 0,
    };

    setData({
      ...data,
      items,
    });
  };

  const handleSave = async () => {
    if (!data || !id) return;

    setSaving(true);

    try {
      await stockTakeApi.submitCounts({
        stockTakeId: id,
        counts: data.items.map((i) => ({
          locationId: i.locationId,
          productId: i.productId,
          lotId: i.lotId,
          countedQty: i.countedQty ?? 0,
        })),
      });

      message.success("Đã lưu tạm kết quả!");
    } catch (err) {
      message.error("Lỗi khi lưu dữ liệu");
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    if (!id || !data) return;

    const invalid = data.items.some(
      (x) =>
        x.countedQty === null ||
        x.countedQty === undefined ||
        x.countedQty < 0
    );

    if (invalid) {
      message.error("Dữ liệu kiểm kê không hợp lệ");
      return;
    }

    setSaving(true);

    try {
      // lưu trước
      await stockTakeApi.submitCounts({
        stockTakeId: id,
        counts: data.items.map((i) => ({
          locationId: i.locationId,
          productId: i.productId,
          lotId: i.lotId,
          countedQty: i.countedQty ?? 0,
        })),
      });

      // complete
      await stockTakeApi.complete(id);

      message.success(
        "Kiểm kê hoàn tất. Tồn kho đã được điều chỉnh!"
      );

      navigate("/stocktake");
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ||
        "Lỗi khi hoàn tất kiểm kê"
      );
    } finally {
      setSaving(false);
    }
  };

  const getDiffColor = (diff: number) => {
    if (diff === 0) return "secondary";
    if (diff > 0) return "success";
    return "danger";
  };

  const columns = [
    {
      title: "Vị trí",
      dataIndex: "locationCode",
      key: "locationCode",
      width: 140,
    },
    {
      title: "Sản phẩm",
      key: "product",
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.productName}
          </div>

          {record.productCode && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.productCode}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Lô hàng",
      dataIndex: "lotCode",
      key: "lotCode",
      width: 120,
      render: (v: string) => v || "—",
    },
    {
      title: "Hệ thống",
      dataIndex: "systemQty",
      key: "systemQty",
      align: "center" as const,
      width: 120,
      render: (v: number) => (
        <Text strong>{v.toLocaleString()}</Text>
      ),
    },
    {
      title: "Thực tế",
      key: "countedQty",
      width: 160,
      align: "center" as const,
      render: (_: any, record: any, index: number) => (
        <InputNumber
          disabled={data?.status === "Completed"}
          min={0}
          precision={0}
          style={{ width: 120 }}
          value={record.countedQty}
          onChange={(v) => onQtyChange(v, index)}
        />
      ),
    },
    {
      title: "Lệch",
      key: "diff",
      width: 120,
      align: "center" as const,
      render: (_: any, record: any) => {
        const diff =
          (record.countedQty ?? 0) - record.systemQty;

        return (
          <Text strong type={getDiffColor(diff)}>
            {diff > 0 ? `+${diff}` : diff}
          </Text>
        );
      },
    },
    {
      title: "Trạng thái",
      key: "status",
      width: 140,
      render: (_: any, record: any) => {
        const diff =
          (record.countedQty ?? 0) - record.systemQty;

        if (diff === 0)
          return <Tag color="success">Khớp</Tag>;

        if (diff > 0)
          return <Tag color="processing">Dư</Tag>;

        return (
          <Tag color="error" icon={<WarningOutlined />}>
            Thiếu
          </Tag>
        );
      },
    },
  ];

  const totalDiff =
    data?.items.reduce(
      (sum, x) =>
        sum + ((x.countedQty ?? 0) - x.systemQty),
      0
    ) ?? 0;

  return (
    <Card
      loading={loading}
      title={
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/stocktake")}
          />

          <Title level={5} style={{ margin: 0 }}>
            Phiếu: {data?.code}
          </Title>
        </Space>
      }
      extra={
        data?.status !== "Completed" && (
          <Space>
            <Button
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
            >
              Lưu tạm
            </Button>

            <Popconfirm
              title="Hoàn tất kiểm kê?"
              description="Tồn kho hệ thống sẽ được điều chỉnh theo số lượng thực tế."
              onConfirm={handleComplete}
              okText="Hoàn tất"
              cancelText="Hủy"
            >
              <Button
                type="primary"
                icon={<CheckSquareOutlined />}
                loading={saving}
              >
                Hoàn tất
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    >
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Tag color="blue">
          Kho: {data?.warehouseName}
        </Tag>

        <Tag
          color={
            data?.status === "Completed"
              ? "success"
              : "orange"
          }
        >
          Trạng thái: {data?.status}
        </Tag>

        <Tag color={totalDiff === 0 ? "success" : "red"}>
          Tổng lệch: {totalDiff > 0 ? "+" : ""}
          {totalDiff}
        </Tag>
      </div>

      <Table
        bordered
        size="middle"
        scroll={{ x: 1000 }}
        dataSource={data?.items || []}
        columns={columns}
        rowKey={(r) => r.id}
        pagination={false}
        loading={loading}
      />
    </Card>
  );
}
