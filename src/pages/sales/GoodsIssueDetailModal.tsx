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
  Alert,
} from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { salesApi } from "../../api/sale.api";
import type {
  GoodsIssueDetailDto,
  GoodsIssueItemDtoForFrontend,
  GoodsIssueAllocateDto,
  IssueRequestDto,
  PickingRequestDto,
} from "../../types/sale";

/* ================= ENUM MAP ================= */
const giaStatusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Planned", color: "default" },
  1: { label: "Picking", color: "processing" },
  2: { label: "Picked", color: "success" },
  3: { label: "Cancelled", color: "error" },
};

const statusMap: Record<number, { label: string; color: string }> = {
  0: { label: "Pending", color: "default" },
  1: { label: "Approved", color: "green" },
  2: { label: "Partially Issued", color: "orange" },
  3: { label: "Complete", color: "blue" },
  5: { label: "Picking", color: "purple" },
};

interface Props {
  open: boolean;
  goodsIssueId: string;
  onClose: () => void;
  onActionSuccess?: () => void;
}

export default function GoodsIssueDetailModal({
  open,
  goodsIssueId,
  onClose,
  onActionSuccess,
}: Props) {
  const [detail, setDetail] = useState<GoodsIssueDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [tempPicked, setTempPicked] = useState<Record<string, number>>({});
  const [hasShippingError, setHasShippingError] = useState(false);

  /* ================= LOAD ================= */
  const loadDetail = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await salesApi.getGoodsIssueDetail(goodsIssueId);
      setDetail(res.data);
      setTempPicked({});
      setHasShippingError(false);
    } catch {
      message.error("Không tải được thông tin phiếu xuất kho");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (goodsIssueId && open) {
      loadDetail();
    }
  }, [goodsIssueId, open]);

  /* ================= HELPERS ================= */
  const isInvalidLocation = (a: GoodsIssueAllocateDto) =>
    !a.locationId || a.locationCode === "Chưa xác định";

  const hasInvalidAllocation = (item: GoodsIssueItemDtoForFrontend) =>
    item.allocations.some((a) => isInvalidLocation(a));

  const getTempTotalPicked = (item: GoodsIssueItemDtoForFrontend) =>
    item.allocations.reduce((sum, a) => {
      if (isInvalidLocation(a)) return sum;
      const v = tempPicked[a.id] ?? a.pickedQty;
      return sum + (v > 0 ? v : 0);
    }, 0);

  const canPick = (item: GoodsIssueItemDtoForFrontend) =>
    item.status < 3 &&
    getTempTotalPicked(item) > item.pickedQty &&
    !hasInvalidAllocation(item);

  const canIssue = (item: GoodsIssueItemDtoForFrontend) => {
    const remain = item.quantity - item.issuedQty;
    return item.status < 3 && item.pickedQty > item.issuedQty && remain > 0;
  };

  /* ================= PICK ================= */
  const handlePickMaxSingle = (alloc: GoodsIssueAllocateDto) => {
    if (isInvalidLocation(alloc)) return;
    setTempPicked((p) => ({ ...p, [alloc.id]: alloc.allocatedQty }));
  };

  const handlePicking = async (item: GoodsIssueItemDtoForFrontend) => {
    if (!detail) return;

    if (hasInvalidAllocation(item)) {
      message.warning("Còn phân bổ chưa xác định vị trí, không thể Picking");
      return;
    }

    const items = item.allocations
      .map((a) => {
        if (isInvalidLocation(a) || a.status === 2) return null;
        const qty = tempPicked[a.id];
        if (qty !== undefined && qty !== a.pickedQty) {
          return {
            id: a.id,
            pickedQty: qty,
            locationId: a.locationId!,
          };
        }
        return null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x);

    if (!items.length) {
      message.warning("Không có thay đổi nào để Picking");
      return;
    }

    try {
      setActionLoading((p) => ({ ...p, [item.id]: true }));
      await salesApi.picking({
        id: item.id,
        goodsIssueId: detail.id,
        productId: Number(item.productId),
        allocations: items,
      });
      message.success("Picking thành công");
      await loadDetail(true);
      onActionSuccess?.();
    } catch (err: any) {
      const data = err.response?.data;
      const code = data?.code;
      const msg = data?.message || "";

      if (
        code === "WAREHOUSE_SHIPPING_LOCATION_NOT_CONFIGURED" ||
        msg.includes("chưa cấu hình vị trí xuất hàng")
      ) {
        Modal.warning({
          title: "❗ Không thể Picking",
          content: (
            <>
              <b>Kho chưa được cấu hình vị trí xuất hàng.</b>
              <br />
              Vui lòng thiết lập <b>Location loại Shipping / Output</b> trước khi Picking.
            </>
          ),
        });
      } else {
        message.error(msg || "Picking không thành công");
      }
    } finally {
      setActionLoading((p) => ({ ...p, [item.id]: false }));
    }
  };

  /* ================= ISSUE ================= */
  const handleIssue = (item: GoodsIssueItemDtoForFrontend) => {
    const maxQty = Math.min(
      item.quantity - item.issuedQty,
      item.pickedQty - item.issuedQty
    );

    let issueQty = maxQty;

    Modal.confirm({
      title: "Xác nhận xuất kho",
      content: (
        <Space direction="vertical" style={{ width: "100%" }}>
          <strong>
            {item.productCode} - {item.productName}
          </strong>
          <InputNumber
            min={0}
            max={maxQty}
            defaultValue={maxQty}
            style={{ width: "100%" }}
            onChange={(v) => {
              issueQty = v ?? 0;
            }}
          />
        </Space>
      ),
      okText: "Xuất kho",
      onOk: async () => {
        if (issueQty <= 0) {
          message.warning("Số lượng phải lớn hơn 0");
          return;
        }
        try {
          await salesApi.issue({
            goodsIssueItemId: item.id,
            issuedQty: issueQty,
          });
          message.success("Xuất kho thành công");
          await loadDetail(true);
          onActionSuccess?.();
        } catch (err: any) {
          message.error(err?.response?.data?.message || "Xuất kho thất bại");
        }
      },
    });
  };

  /* ================= UI ================= */
  const overallProgress =
    detail && detail.items.length
      ? (detail.items.reduce((s, i) => s + i.issuedQty, 0) /
          detail.items.reduce((s, i) => s + i.quantity, 0)) *
        100
      : 0;

  return (
    <Modal
      title={`Chi tiết phiếu xuất kho: ${detail?.code || goodsIssueId}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={1200}
      destroyOnClose
    >
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={() => loadDetail()}>
          Làm mới
        </Button>
      </Space>

      <Spin spinning={loading}>
        {detail && (
          <>
            <Descriptions bordered size="small" column={3}>
              <Descriptions.Item label="Mã phiếu">{detail.code}</Descriptions.Item>
              <Descriptions.Item label="Kho">{detail.warehouseName}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusMap[detail.status]?.color || "default"}>
                  {statusMap[detail.status]?.label || "Không xác định"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tiến độ" span={3}>
                <Progress percent={Math.round(overallProgress)} status="active" />
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Table
              rowKey="id"
              pagination={false}
              dataSource={detail.items}
              expandable={{ expandedRowRender }}
              columns={[
                { title: "Mã SP", dataIndex: "productCode", width: 140 },
                { title: "Tên sản phẩm", dataIndex: "productName" },
                { title: "Yêu cầu", dataIndex: "quantity", width: 100, align: "right" },
                { title: "Đã Pick", dataIndex: "pickedQty", width: 100, align: "right" },
                { title: "Đã Issue", dataIndex: "issuedQty", width: 100, align: "right" },
              ]}
            />
          </>
        )}
      </Spin>
    </Modal>
  );

  function expandedRowRender(item: GoodsIssueItemDtoForFrontend) {
    return (
      <div style={{ padding: 12, background: "#fafafa" }}>
        {hasInvalidAllocation(item) && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="Có phân bổ chưa xác định vị trí"
            description="Các dòng này đã bị khóa. Vui lòng cấu hình Location trước khi Picking."
          />
        )}

        <Table
          size="small"
          pagination={false}
          rowKey="id"
          dataSource={item.allocations}
          columns={[
            {
              title: "Vị trí",
              render: (_, a: GoodsIssueAllocateDto) =>
                isInvalidLocation(a) ? (
                  <Tag color="warning">Chưa xác định</Tag>
                ) : (
                  a.locationCode
                ),
              width: 160,
            },
            { title: "Phân bổ", dataIndex: "allocatedQty", width: 100, align: "right" },
            { title: "Đã Pick", dataIndex: "pickedQty", width: 100, align: "right" },
            {
              title: "Pick",
              width: 140,
              render: (_, a: GoodsIssueAllocateDto) => (
                <InputNumber
                  min={0}
                  max={a.allocatedQty}
                  value={tempPicked[a.id] ?? a.pickedQty}
                  disabled={a.status === 2 || isInvalidLocation(a)}
                  onChange={(v) =>
                    setTempPicked((p) => ({ ...p, [a.id]: Number(v) || 0 }))
                  }
                  style={{ width: "100%" }}
                />
              ),
            },
            {
              title: "Thao tác",
              width: 120,
              render: (_, a: GoodsIssueAllocateDto) =>
                isInvalidLocation(a) ? (
                  <Tag color="warning">Chưa có vị trí</Tag>
                ) : a.status === 2 ? (
                  <Tag color="success">Đã Pick</Tag>
                ) : (
                  <Button
                    icon={<CheckCircleOutlined />}
                    type="text"
                    onClick={() => handlePickMaxSingle(a)}
                  >
                    Max
                  </Button>
                ),
            },
          ]}
        />

        <Divider />

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button
            type="primary"
            disabled={!canPick(item)}
            loading={actionLoading[item.id]}
            onClick={() => handlePicking(item)}
          >
            Xác nhận Picking
          </Button>

          <Button
            danger
            disabled={!canIssue(item)}
            onClick={() => handleIssue(item)}
          >
            Issue / Xuất kho
          </Button>
        </Space>
      </div>
    );
  }
}