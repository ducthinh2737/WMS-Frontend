// src/pages/sales/GoodsIssueDetailModal.tsx
import { useEffect, useState } from "react";
import {
  Spin,
  Descriptions,
  Table,
  Tag,
  Button,
  InputNumber,
  Space,
  message,
  Modal,
  Divider,
  Tooltip,
  Progress,
} from "antd";
import { ReloadOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { salesApi } from "../../api/sale.api";
import type {
  GoodsIssueDetailDto,
  GoodsIssueItemDtoForFrontend,
  IssueRequestDto,
  GoodsIssueAllocateDto,
  PickingRequestDto,
} from "../../types/sale";

const statusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Pending", color: "default" },
  1: { label: "Approved", color: "green" },
  2: { label: "Partially Issued", color: "orange" },
  3: { label: "Complete", color: "blue" },
  5: { label: "Picking", color: "purple" },
};

interface Props {
  goodsIssueId: string;
  onClose: () => void;
  onActionSuccess?: () => void;
}

export default function GoodsIssueDetailModal({
  goodsIssueId,
  onClose,
  onActionSuccess,
}: Props) {
  const [detail, setDetail] = useState<GoodsIssueDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [tempPicked, setTempPicked] = useState<Record<string, number>>({});

  /* ================= LOAD ================= */
  const loadDetail = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await salesApi.getGoodsIssueDetail(goodsIssueId);
      setDetail(res.data);
      setTempPicked({});
    } catch {
      message.error("Không tải được thông tin phiếu xuất kho");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (goodsIssueId) loadDetail();
  }, [goodsIssueId]);

  /* ================= HELPERS ================= */
  const getTempTotalPicked = (item: GoodsIssueItemDtoForFrontend) =>
    item.allocations.reduce((sum, alloc) => {
      const current = tempPicked[alloc.id] ?? alloc.pickedQty;
      return sum + (current > 0 ? current : 0);
    }, 0);

  const canPick = (item: GoodsIssueItemDtoForFrontend) =>
    item.status < 3 && getTempTotalPicked(item) > item.pickedQty;

  const canIssue = (item: GoodsIssueItemDtoForFrontend) => {
    const remain = item.quantity - item.issuedQty;
    return (
      item.status < 3 &&
      item.pickedQty > item.issuedQty &&
      remain > 0
    );
  };

  /* ================= PICKING ================= */
  const handlePickMaxSingle = (alloc: GoodsIssueAllocateDto) => {
    setTempPicked((prev) => ({ ...prev, [alloc.id]: alloc.allocatedQty }));
  };



  const handlePicking = async (item: GoodsIssueItemDtoForFrontend) => {
    if (!detail) return;

    const items: PickingRequestDto["items"] = item.allocations
      .map((alloc) => {
        const qty = tempPicked[alloc.id] ?? alloc.pickedQty;
        if (qty > 0) {
          return {
            id: alloc.id,
            pickedQty: qty,
            locationId: alloc.locationId,
          };
        }
        return null;
      })
      .filter(Boolean) as PickingRequestDto["items"];

    if (items.some((x) => !x.locationId)) {
      message.error("Thiếu LocationId khi picking");
      return;
    }

    const payload: PickingRequestDto = {
      id: item.id,
      goodsIssueId: detail.id,
      productId: Number(item.productId),
      items,
    };

    try {
      setActionLoading((p) => ({ ...p, [item.id]: true }));
      await salesApi.picking(payload);
      message.success("Picking thành công");
      await loadDetail(true);
      onActionSuccess?.();
    } catch (err: any) {
      message.error(err.response?.data || "Picking thất bại");
    } finally {
      setActionLoading((p) => ({ ...p, [item.id]: false }));
    }
  };

  /* ================= ISSUE ================= */
  const handleIssue = async (item: GoodsIssueItemDtoForFrontend) => {
  if (!detail) return;

  const maxIssueQty = Math.min(
    item.quantity - item.issuedQty,
    item.pickedQty - item.issuedQty
  );

  if (maxIssueQty <= 0) {
    message.warning("Không còn số lượng để xuất kho");
    return;
  }

  let issueQty = maxIssueQty; // default = max

  Modal.confirm({
    title: "Xác nhận xuất kho",
    content: (
      <div>
        <p>
          Sản phẩm: <strong>{item.productCode}</strong>
        </p>

        <p>
          Có thể xuất tối đa: <strong>{maxIssueQty}</strong>
        </p>

        <Space>
          <span>Số lượng xuất:</span>
          <InputNumber
            min={1}
            max={maxIssueQty}
            step={1}
            precision={0}
            defaultValue={maxIssueQty}
            onChange={(v) => {
              issueQty = Number(v) || 0;
            }}
          />
        </Space>
      </div>
    ),
    okText: "Xuất kho",
    onOk: async () => {
      if (issueQty <= 0 || issueQty > maxIssueQty) {
        message.error("Số lượng xuất không hợp lệ");
        return Promise.reject();
      }

      const payload: IssueRequestDto = {
        goodsIssueItemId: item.id,
        issuedQty: issueQty,
      };

      try {
        setActionLoading((p) => ({
          ...p,
          [item.id + "-issue"]: true,
        }));

        await salesApi.issue(payload);
        message.success("Xuất kho thành công");
        await loadDetail(true);
        onActionSuccess?.();
      } catch (err: any) {
        message.error(err.response?.data || "Xuất kho thất bại");
      } finally {
        setActionLoading((p) => ({
          ...p,
          [item.id + "-issue"]: false,
        }));
      }
    },
  });
};


  /* ================= UI ================= */
  const expandedRowRender = (item: GoodsIssueItemDtoForFrontend) => (
    <div style={{ padding: 12, background: "#fafafa" }}>
      <Table
        size="small"
        pagination={false}
        rowKey="id"
        dataSource={item.allocations}
        columns={[
          {
            title: "Vị trí",
            dataIndex: "locationCode",
            render: (_, a) => a.locationCode || "N/A",
          },
          {
            title: "Phân bổ",
            dataIndex: "allocatedQty",
          },
          {
            title: "Pick",
            render: (_, a) => (
              <InputNumber
                min={0}
                max={a.allocatedQty}
                step={1}
                precision={0}
                value={tempPicked[a.id] ?? a.pickedQty}
                onChange={(v) =>
                  setTempPicked((p) => ({ ...p, [a.id]: v ?? 0 }))
                }
              />
            ),
          },
          {
            render: (_, a) =>
              a.pickedQty < a.allocatedQty ? (
                <Tooltip title="Pick hết">
                  <Button
                    icon={<CheckCircleOutlined />}
                    onClick={() => handlePickMaxSingle(a)}
                    type="text"
                  />
                </Tooltip>
              ) : null,
          },
        ]}
      />

      <Divider />

      <Space>
        <Button
          type="primary"
          onClick={() => handlePicking(item)}
          disabled={!canPick(item)}
          loading={actionLoading[item.id]}
        >
          Xác nhận Picking
        </Button>

        <Button
          danger
          onClick={() => handleIssue(item)}
          disabled={!canIssue(item)}
          loading={actionLoading[item.id + "-issue"]}
        >
          Issue
        </Button>
      </Space>
    </div>
  );

  const overallProgress =
    detail && detail.items.length
      ? detail.items.reduce((s, i) => s + i.issuedQty, 0) /
        detail.items.reduce((s, i) => s + i.quantity, 0)
      : 0;

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={() => loadDetail()}>
          Làm mới
        </Button>
        <Button onClick={onClose}>Đóng</Button>
      </Space>

      <Spin spinning={loading}>
        {detail && (
          <>
            <Descriptions bordered size="small">
              <Descriptions.Item label="Mã phiếu">
                {detail.code}
              </Descriptions.Item>
              <Descriptions.Item label="Kho">
                {detail.warehouseName}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusMap[detail.status]?.color}>
                  {statusMap[detail.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tiến độ" span={3}>
                <Progress percent={Math.round(overallProgress * 100)} />
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Table
              rowKey="id"
              pagination={false}
              dataSource={detail.items}
              expandable={{ expandedRowRender }}
              columns={[
                { title: "Mã SP", dataIndex: "productCode" },
                { title: "Tên", dataIndex: "productName" },
                { title: "Yêu cầu", dataIndex: "quantity" },
                { title: "Pick", dataIndex: "pickedQty" },
                { title: "Issue", dataIndex: "issuedQty" },
              ]}
            />
          </>
        )}
      </Spin>
    </>
  );
}
