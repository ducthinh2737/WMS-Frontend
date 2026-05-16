// ================================================================
// src/components/purchase/ScanReceiveModal.tsx
// ================================================================
// Upload ảnh QR: dùng jsQR (load từ CDN 1 lần khi cần)
// ================================================================

import {
  Modal, Button, message, Tag, InputNumber, DatePicker,
  Alert, Typography, Space, Row, Col, Spin, Steps, notification,
} from "antd";
import {
  ScanOutlined, CheckCircleOutlined, CameraOutlined, KeyOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useRef, useCallback } from "react";
import dayjs from "dayjs";
import { inboundApi } from "../../api/inbound.api";
import type {
  GoodsReceiptDto,
  GoodsReceiptItemDto,
  ReceiveItemRequest,
} from "../../types/inbound";
import LocationCreateModal from "../location/LocationCreate";
// @ts-ignore
import { Html5Qrcode } from "html5-qrcode";

const { Text } = Typography;

// ── QR Payload ────────────────────────────────────────────────────
// Khớp với createOrder request: supplierId + items[]{productId, warehouseId, quantity, price}
interface QRPayload {
  supplierId: number;
  items: Array<{
    productId: string;   // string như createOrder gửi lên
    warehouseId: string;
    quantity: number;
    price: number;
  }>;
}

interface ScanResult {
  po: {
    id: string;
    code: string;
    supplierId: number;
    status: string;
    createdAt: string;
    items: Array<{
      productId: string;
      quantity: number;
      receivedQuantity: number;
      price?: number;
    }>;
  };
  goodsReceipts: GoodsReceiptDto[];
  needsApproval: boolean;
}

const STEPS = [{ title: "Scan QR" }, { title: "Kiểm hàng" }, { title: "Hoàn tất" }];
const QR_CAM_ID = "wms-qr-camera";

type ScanMode = "camera" | "upload" | "manual";

interface Props {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// ── Load jsQR từ CDN (chỉ 1 lần) ─────────────────────────────────
let jsQRPromise: Promise<any> | null = null;
function loadJsQR(): Promise<any> {
  if ((window as any).jsQR) return Promise.resolve((window as any).jsQR);
  if (jsQRPromise) return jsQRPromise;
  jsQRPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
    s.onload = () => resolve((window as any).jsQR);
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return jsQRPromise;
}

// ── Decode QR từ File ảnh bằng jsQR ──────────────────────────────
async function decodeQRFromFile(file: File): Promise<string> {
  const jsQR = await loadJsQR();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Thử nhiều kích thước canvas để tăng tỉ lệ decode thành công
        const sizes = [
          { w: img.naturalWidth,       h: img.naturalHeight },
          { w: img.naturalWidth * 2,   h: img.naturalHeight * 2 },
          { w: 600, h: 600 },
        ];

        for (const { w, h } of sizes) {
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);
          const result = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          if (result?.data) {
            resolve(result.data);
            return;
          }
        }
        reject(new Error("QR not found"));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ScanReceiveModal({ open, onCancel, onSuccess }: Props) {
  const [step, setStep]       = useState<0 | 1 | 2>(0);
  const [scanMode, setScanMode] = useState<ScanMode>("camera");
  const [manualCode, setManualCode] = useState("");

  const [autoProcessing, setAutoProcessing] = useState(false);
  const [autoProcessMsg, setAutoProcessMsg] = useState("");
  const [uploadDecoding, setUploadDecoding] = useState(false);

  const [cameraStarted, setCameraStarted] = useState(false);
  const camQrRef      = useRef<any>(null);
  const isStoppingRef = useRef(false);

  const [confirmedResult, setConfirmedResult] = useState<ScanResult | null>(null);
  const [currentGRIndex, setCurrentGRIndex] = useState(0);
  const [counts,  setCounts]  = useState<Record<string, number>>({});
  const [lotData, setLotData] = useState<Record<string, { expiryDate?: string; manufacturingDate?: string }>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [completedGRs,  setCompletedGRs]  = useState<string[]>([]);
  const [openLocationModal, setOpenLocationModal] = useState(false);

  // ── Camera ────────────────────────────────────────────────────────
  const stopCamera = useCallback(async () => {
    if (!camQrRef.current || isStoppingRef.current) return;
    isStoppingRef.current = true;
    try {
      const qr = camQrRef.current;
      camQrRef.current = null;
      if (qr.isScanning) await qr.stop();
      qr.clear();
    } catch { /* ignore */ }
    finally { isStoppingRef.current = false; setCameraStarted(false); }
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  useEffect(() => {
    if (!open) { stopCamera(); resetAll(); }
  }, [open]);

  useEffect(() => {
    if (!open || step !== 0 || scanMode !== "camera") return;
    const t = setTimeout(startCamera, 400);
    return () => { clearTimeout(t); stopCamera(); };
  }, [open, step, scanMode]);

  const startCamera = async () => {
    if (camQrRef.current || isStoppingRef.current) return;
    if (!document.getElementById(QR_CAM_ID)) return;
    try {
      const qr = new Html5Qrcode(QR_CAM_ID);
      camQrRef.current = qr;
      await qr.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text: string) => stopCamera().then(() => processQRText(text.trim())),
        () => {}
      );
      setCameraStarted(true);
    } catch {
      camQrRef.current = null;
      setScanMode("manual");
    }
  };

  // ── Upload ────────────────────────────────────────────────────────
  const handleUploadFile = async (file: File) => {
    setUploadDecoding(true);
    try {
      const text = await decodeQRFromFile(file);
      processQRText(text.trim());
    } catch {
      message.error(
        "Không đọc được mã QR từ ảnh. Vui lòng thử ảnh khác hoặc dùng tab Nhập tay."
      );
    } finally {
      setUploadDecoding(false);
    }
  };

  // ── Parse & process ───────────────────────────────────────────────
  const processQRText = async (text: string) => {
    try {
      const payload: QRPayload = JSON.parse(text);
      if (payload.supplierId && Array.isArray(payload.items) && payload.items.length > 0) {
        await processNewOrder(payload);
        return;
      }
    } catch { /* not JSON */ }
    await processExistingPO(text.toUpperCase());
  };

  const processNewOrder = async (payload: QRPayload) => {
    setAutoProcessing(true);
    setAutoProcessMsg("Đang tạo đơn mua hàng...");
    try {
      setAutoProcessMsg("Đang duyệt đơn & tạo phiếu nhập kho...");
      // Gọi endpoint tạo PO + Approve + GR trong 1 call
      const res = await inboundApi.scanAndProcess({
        supplierId: payload.supplierId,
        items: payload.items.map(i => ({
          ...i,
          productId: Number(i.productId), // QR encode string, API expect number
        })),
      });
      setConfirmedResult(res.data);
      resetCounting();
      message.success(`✓ Tạo ${res.data.po.code} & ${res.data.goodsReceipts.length} phiếu nhập kho`);
      setStep(1);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không thể xử lý đơn hàng");
      if (scanMode === "camera") setTimeout(startCamera, 600);
    } finally { setAutoProcessing(false); setAutoProcessMsg(""); }
  };

  const processExistingPO = async (orderCode: string) => {
    setAutoProcessing(true);
    setAutoProcessMsg("Đang tìm & duyệt đơn hàng...");
    try {
      const res = await inboundApi.confirmScanReceive(orderCode);
      setConfirmedResult(res.data);
      resetCounting();
      message.success(`✓ Đơn ${orderCode} đã duyệt — ${res.data.goodsReceipts.length} phiếu sẵn sàng`);
      setStep(1);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không tìm thấy đơn hàng");
      if (scanMode === "camera") setTimeout(startCamera, 600);
    } finally { setAutoProcessing(false); setAutoProcessMsg(""); }
  };

  const handleManualSubmit = () => {
    const val = manualCode.trim();
    if (!val) return message.warning("Vui lòng nhập mã PO hoặc JSON");
    processQRText(val);
  };

  const resetCounting = () => {
    setCounts({}); setLotData({}); setCurrentGRIndex(0); setCompletedGRs([]);
  };

  // ── Counting ──────────────────────────────────────────────────────
  const handleCountChange = (id: string, val: number | null) =>
    setCounts(p => ({ ...p, [id]: val ?? 0 }));

  const handleLotChange = (id: string, field: "expiryDate" | "manufacturingDate", val?: string) =>
    setLotData(p => ({ ...p, [id]: { ...p[id], [field]: val } }));

  const currentGR = confirmedResult?.goodsReceipts[currentGRIndex];

  const doSubmitGR = async () => {
    if (!confirmedResult || !currentGR) return;
    const toUpdate = currentGR.items.filter(i => (counts[i.id] ?? 0) > 0);
    if (!toUpdate.length) return message.warning("Vui lòng nhập số lượng cho ít nhất 1 sản phẩm");

    setSubmitLoading(true);
    try {
      for (const item of toUpdate) {
        const payload: ReceiveItemRequest = {
          id: item.id,
          productId: item.productId,
          received_Qty: counts[item.id],
          lotCode: "",
          expiryDate:        lotData[item.id]?.expiryDate,
          manufacturingDate: lotData[item.id]?.manufacturingDate,
        };
        await inboundApi.ReceiveItem(payload);
      }
      const done = [...completedGRs, currentGR.id];
      setCompletedGRs(done);

      if (currentGRIndex < confirmedResult.goodsReceipts.length - 1) {
        setCounts({}); setLotData({});
        setCurrentGRIndex(i => i + 1);
        message.success(`✓ Phiếu ${currentGR.code} xong`);
      } else {
        setStep(2);
        onSuccess();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message;
      if (msg?.includes("Receiving location not configured")) {
        notification.error({
          message: "Chưa cấu hình vị trí tiếp nhận",
          description: <Button type="primary" size="small" onClick={() => setOpenLocationModal(true)}>Tạo vị trí ngay</Button>,
          duration: 0, key: "loc-err",
        });
      } else message.error(msg);
    } finally { setSubmitLoading(false); }
  };

  const resetAll = () => {
    setStep(0); setScanMode("camera"); setManualCode("");
    setConfirmedResult(null); resetCounting();
    setAutoProcessing(false); setAutoProcessMsg("");
    setSubmitLoading(false); setUploadDecoding(false);
  };

  const handleScanAgain = () => { stopCamera(); resetAll(); };
  const handleCancel    = () => stopCamera().then(() => { resetAll(); onCancel(); });

  // ── Footer ────────────────────────────────────────────────────────
  const footer = step === 0 ? null : step === 1 ? [
    <Button key="back" onClick={handleScanAgain}>← Scan lại</Button>,
    <Button key="ok" type="primary" loading={submitLoading} icon={<CheckCircleOutlined />} onClick={doSubmitGR}>
      {currentGRIndex < (confirmedResult?.goodsReceipts.length ?? 1) - 1
        ? "Xác nhận phiếu này →" : "Hoàn tất nhập kho"}
    </Button>,
  ] : [
    <Button key="close" onClick={handleCancel}>Đóng</Button>,
    <Button key="again" type="primary" icon={<ScanOutlined />} onClick={handleScanAgain}>Scan đơn mới</Button>,
  ];

  // ── Shared overlay ────────────────────────────────────────────────
  const ProcessingOverlay = ({ msg, sub }: { msg: string; sub?: string }) => (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <Spin size="large" />
      <div style={{ marginTop: 16, fontSize: 15, fontWeight: 500 }}>{msg}</div>
      {sub && <div style={{ marginTop: 8, color: "#888", fontSize: 13 }}>{sub}</div>}
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <>
      <Modal
        open={open}
        onCancel={handleCancel}
        title={<Space><ScanOutlined style={{ color: "#1677ff" }} /><span>Nhập kho nhanh — Scan PO</span></Space>}
        width={820}
        footer={footer}
        destroyOnHidden
        maskClosable={false}
        styles={{ body: { padding: "20px 24px", minHeight: 420 } }}
      >
        <Steps current={step} items={STEPS} size="small" style={{ marginBottom: 24 }} />

        {/* ═══ STEP 0: SCAN ════════════════════════════════════════ */}
        {step === 0 && (
          <div>
            <Space style={{ marginBottom: 20 }}>
              <Button type={scanMode === "camera" ? "primary" : "default"} icon={<CameraOutlined />}
                onClick={() => setScanMode("camera")}>Camera</Button>
              <Button type={scanMode === "upload" ? "primary" : "default"} icon={<UploadOutlined />}
                onClick={() => { stopCamera(); setScanMode("upload"); }}>Upload ảnh QR</Button>
              <Button type={scanMode === "manual" ? "primary" : "default"} icon={<KeyOutlined />}
                onClick={() => { stopCamera(); setScanMode("manual"); }}>Nhập tay</Button>
            </Space>

            {/* Camera */}
            {scanMode === "camera" && (
              <div style={{ position: "relative" }}>
                <div id={QR_CAM_ID} style={{ width: "100%", borderRadius: 12, overflow: "hidden", background: "#000", minHeight: 300 }} />
                {!cameraStarted && !autoProcessing && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", borderRadius: 12 }}>
                    <Spin tip="Đang khởi động camera..." />
                  </div>
                )}
                {autoProcessing && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.93)", borderRadius: 12, gap: 12 }}>
                    <Spin size="large" />
                    <Text style={{ fontSize: 15, fontWeight: 500 }}>{autoProcessMsg}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>Hệ thống đang tự động xử lý...</Text>
                  </div>
                )}
                <div style={{ marginTop: 10, textAlign: "center", color: "#888", fontSize: 13 }}>
                  Đưa mã QR vào khung hình
                </div>
              </div>
            )}

            {/* Upload */}
            {scanMode === "upload" && (
              (uploadDecoding || autoProcessing) ? (
                <ProcessingOverlay
                  msg={uploadDecoding ? "Đang giải mã QR từ ảnh..." : autoProcessMsg}
                  sub={uploadDecoding ? "Vui lòng chờ..." : "Hệ thống đang tự động xử lý..."}
                />
              ) : (
                <div>
                  <Alert type="info" showIcon style={{ marginBottom: 16 }}
                    message="Chụp ảnh QR rõ nét, đủ sáng, không bị mờ hoặc nghiêng"
                    description="Nếu không đọc được hãy dùng tab Nhập tay."
                  />
                  <label style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", padding: "40px 24px",
                    border: "2px dashed #1677ff", borderRadius: 12,
                    background: "#f0f5ff", cursor: "pointer", gap: 12,
                  }}>
                    <UploadOutlined style={{ fontSize: 48, color: "#1677ff" }} />
                    <div style={{ fontSize: 16, fontWeight: 500, color: "#1677ff" }}>Bấm để chọn ảnh QR</div>
                    <div style={{ color: "#888", fontSize: 13 }}>PNG, JPG, WEBP — kéo thả cũng được</div>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadFile(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              )
            )}

            {/* Manual */}
            {scanMode === "manual" && (
              autoProcessing ? (
                <ProcessingOverlay msg={autoProcessMsg} sub="Hệ thống đang tự động xử lý..." />
              ) : (
                <div style={{ maxWidth: 460, margin: "32px auto" }}>
                  <Alert type="info" showIcon style={{ marginBottom: 16 }}
                    message="Nhập mã PO hoặc paste JSON từ QR"
                    description={
                      <span>
                        Mã PO: <code>PO-20260320-0001</code><br />
                        JSON: <code>{'{"supplierId":1,"items":[...]}'}</code>
                      </span>
                    }
                  />
                  <Space.Compact style={{ width: "100%" }}>
                    <input
                      autoFocus
                      value={manualCode}
                      onChange={e => setManualCode(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleManualSubmit()}
                      placeholder="PO-YYYYMMDD-0001"
                      style={{ flex: 1, padding: "8px 12px", fontSize: 14, fontFamily: "monospace", border: "1px solid #d9d9d9", borderRight: "none", borderRadius: "6px 0 0 6px", outline: "none" }}
                    />
                    <Button type="primary" size="large" onClick={handleManualSubmit} style={{ borderRadius: "0 6px 6px 0" }}>
                      Xử lý
                    </Button>
                  </Space.Compact>
                </div>
              )
            )}
          </div>
        )}

        {/* ═══ STEP 1: KIỂM ĐẾM ═══════════════════════════════════ */}
        {step === 1 && currentGR && confirmedResult && (
          <div>
            {/* PO info */}
            <div style={{ background: "#f0f5ff", border: "1px solid #adc6ff", borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>Đơn hàng</Text>
                <div style={{ fontFamily: "monospace", fontWeight: 700, color: "#1677ff", fontSize: 15 }}>{confirmedResult.po.code}</div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>Trạng thái</Text>
                <div><Tag color="green" style={{ marginTop: 2 }}>ĐÃ DUYỆT</Tag></div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>Phiếu nhập</Text>
                <div style={{ fontWeight: 500 }}>{currentGRIndex + 1} / {confirmedResult.goodsReceipts.length}</div>
              </div>
              <Tag color="blue" style={{ fontFamily: "monospace", marginLeft: "auto" }}>{currentGR.code}</Tag>
            </div>

            {confirmedResult.goodsReceipts.length > 1 && (
              <div style={{ marginBottom: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {confirmedResult.goodsReceipts.map((gr, idx) => (
                  <Tag key={gr.id} color={completedGRs.includes(gr.id) ? "green" : idx === currentGRIndex ? "blue" : "default"} style={{ fontFamily: "monospace", fontSize: 12 }}>
                    {completedGRs.includes(gr.id) ? "✓ " : idx === currentGRIndex ? "▶ " : ""}{gr.code}
                  </Tag>
                ))}
              </div>
            )}

            <Alert type="info" showIcon message="Lot Code tự động sinh. Nhập ngày sản xuất & hạn dùng từ bao bì thực tế." style={{ marginBottom: 20 }} />

            {currentGR.items.map((item: GoodsReceiptItemDto) => {
              const maxQty   = item.quantity - (item.received_Qty ?? 0);
              const inputVal = counts[item.id] ?? 0;
              const isDone   = maxQty <= 0;
              return (
                <div key={item.id} style={{ padding: "16px", marginBottom: 12, borderRadius: 8, border: `1px solid ${isDone ? "#b7eb8f" : inputVal > 0 ? "#91caff" : "#d9d9d9"}`, background: isDone ? "#f6ffed" : inputVal > 0 ? "#f0f5ff" : "#fafafa", transition: "all 0.2s" }}>
                  <Row gutter={12} align="middle">
                    <Col xs={24} sm={6}>
                      <Text strong>{item.productName ?? `Sản phẩm #${item.productId}`}</Text><br />
                      <Text type="secondary" style={{ fontSize: 12 }}>Yêu cầu: {item.quantity} | Đã nhận: {item.received_Qty ?? 0}</Text><br />
                      <Tag color={isDone ? "green" : "orange"} style={{ marginTop: 4, fontSize: 11 }}>
                        {isDone ? "Đủ hàng ✓" : `Còn thiếu: ${maxQty}`}
                      </Tag>
                    </Col>
                    <Col xs={12} sm={6}>
                      <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Ngày sản xuất</Text>
                      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Chọn ngày SX" disabled={isDone}
                        onChange={val => handleLotChange(item.id, "manufacturingDate", val ? dayjs(val).toISOString() : undefined)} />
                    </Col>
                    <Col xs={12} sm={6}>
                      <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Hạn sử dụng</Text>
                      <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="Chọn hạn dùng" disabled={isDone}
                        onChange={val => handleLotChange(item.id, "expiryDate", val ? dayjs(val).toISOString() : undefined)} />
                    </Col>
                    <Col xs={24} sm={6}>
                      <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Số lượng nhập</Text>
                      <InputNumber
                        style={{ width: "100%", fontWeight: 600, fontSize: 16, border: inputVal > 0 ? "2px solid #1677ff" : undefined, borderRadius: 6 }}
                        min={0} max={maxQty} disabled={isDone} value={inputVal} size="large" placeholder="0"
                        onChange={val => handleCountChange(item.id, val)}
                      />
                    </Col>
                  </Row>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ STEP 2: DONE ════════════════════════════════════════ */}
        {step === 2 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <CheckCircleOutlined style={{ fontSize: 64, color: "#52c41a", marginBottom: 16 }} />
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Nhập kho hoàn tất!</div>
            <Text type="secondary">
              Đơn hàng <strong style={{ fontFamily: "monospace" }}>{confirmedResult?.po.code}</strong> đã xử lý thành công.{" "}
              {completedGRs.length} phiếu nhập kho đã xác nhận.
            </Text>
          </div>
        )}
      </Modal>

      {currentGR && (
        <LocationCreateModal
          open={openLocationModal}
          warehouseId={currentGR.warehouseId}
          onCancel={() => setOpenLocationModal(false)}
          onSuccess={async () => {
            setOpenLocationModal(false);
            message.success("Đã tạo vị trí. Đang thử nhập lại...");
            await doSubmitGR();
          }}
        />
      )}
    </>
  );
}
