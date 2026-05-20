export interface NotificationInput {
  activityType: string;
  productCode: string;
  productName: string;
  quantityChange: number;
  uom: string;
  warehouseName: string;
  location: string;
  beforeQty: number;
  afterQty: number;
  userName: string;
  timestamp: string | Date;
  note?: string;
}

export interface WmsNotification {
  id: string;
  title: string;
  message: string;
  warning?: string;
  activityType: string;
  productCode: string;
  productName: string;
  quantityChange: number;
  uom: string;
  warehouseName: string;
  location: string;
  beforeQty: number;
  afterQty: number;
  userName: string;
  timestamp: string;
  note?: string;
  isRead: boolean;
  severity: 'info' | 'warning' | 'success' | 'danger';
}

export function generateWmsNotification(input: NotificationInput): {
  title: string;
  message: string;
  warning?: string;
  severity: 'info' | 'warning' | 'success' | 'danger';
} {
  const {
    activityType,
    productCode,
    productName,
    quantityChange,
    uom,
    warehouseName,
    location,
    beforeQty,
    afterQty,
    userName,
    note
  } = input;

  let title = '';
  let message = '';
  let severity: 'info' | 'warning' | 'success' | 'danger' = 'info';

  const absQtyChange = Math.abs(quantityChange);
  const act = activityType.toLowerCase();

  // 1-3 sentences concise warehouse notification
  if (act.includes('nhập') || act.includes('receive')) {
    title = '📥 Nhập kho thành công';
    message = `Đã nhập ${absQtyChange} ${uom} sản phẩm ${productName} (${productCode}) vào vị trí ${location} tại kho ${warehouseName} do ${userName} thực hiện. Số lượng tồn kho tăng từ ${beforeQty} lên ${afterQty} ${uom}.`;
    severity = 'success';
  } else if (act.includes('xuất') || act.includes('issue')) {
    title = '📤 Xuất kho hoàn tất';
    message = `Đã xuất ${absQtyChange} ${uom} sản phẩm ${productName} (${productCode}) khỏi vị trí ${location} tại kho ${warehouseName} bởi ${userName}. Số lượng tồn giảm từ ${beforeQty} xuống ${afterQty} ${uom}.`;
    severity = 'info';
  } else if (act.includes('điều chỉnh') || act.includes('adjust')) {
    title = '🔧 Điều chỉnh kho';
    const direction = quantityChange >= 0 ? 'tăng thêm' : 'giảm đi';
    message = `Thực hiện điều chỉnh ${direction} ${absQtyChange} ${uom} đối với sản phẩm ${productName} (${productCode}) tại vị trí ${location}, kho ${warehouseName} bởi ${userName}. Số lượng tồn thay đổi từ ${beforeQty} thành ${afterQty} ${uom}.`;
    severity = 'info';
  } else if (act.includes('chuyển') || act.includes('transfer')) {
    title = '🔄 Chuyển kho hoàn tất';
    message = `Luân chuyển thành công sản phẩm ${productName} (${productCode}) tại vị trí ${location}, kho ${warehouseName} với số lượng ${absQtyChange} ${uom} do ${userName} vận hành.`;
    severity = 'info';
  } else if (act.includes('kiểm') || act.includes('stocktake') || act.includes('audit')) {
    title = '📊 Kiểm kê hoàn thành';
    const diff = afterQty - beforeQty;
    const diffText = diff >= 0 ? `tăng chênh lệch +${diff}` : `hao hụt chênh lệch ${diff}`;
    message = `Hoàn tất hoạt động kiểm kê sản phẩm ${productName} (${productCode}) tại vị trí ${location}, kho ${warehouseName} bởi ${userName}. Số lượng tồn điều chỉnh từ ${beforeQty} thành ${afterQty} ${uom} (${diffText} ${uom}).`;
    severity = diff === 0 ? 'success' : 'warning';
  } else {
    title = '🔔 Giao dịch kho mới';
    message = `Phát sinh giao dịch ${activityType} đối với sản phẩm ${productName} (${productCode}) tại vị trí ${location}, kho ${warehouseName} bởi ${userName}. Số lượng biến động: ${quantityChange} ${uom} (Tồn: ${beforeQty} ➜ ${afterQty} ${uom}).`;
    severity = 'info';
  }

  if (note) {
    message += ` Ghi chú: "${note}".`;
  }

  // Warning rules checking
  let warning = '';
  if (afterQty < 0) {
    warning = `⚠️ Cảnh báo tồn âm: Số lượng tồn kho sau thay đổi bị âm (${afterQty} ${uom}), vui lòng kiểm tra lại số liệu thực tế.`;
    severity = 'danger';
  } else if (afterQty === 0) {
    warning = `⚠️ Cảnh báo hết hàng: Số lượng tồn kho đã cạn kiệt (0 ${uom}) tại vị trí ${location}.`;
    severity = 'warning';
  } else if (afterQty <= 5) {
    warning = `⚠️ Cảnh báo thiếu hàng: Lượng tồn thực tế còn rất thấp (${afterQty} ${uom}), dưới mức an toàn lưu trữ khuyến nghị.`;
    severity = 'warning';
  } else if (afterQty > 1000) {
    warning = `⚠️ Cảnh báo vượt mức: Số lượng tồn đạt ${afterQty} ${uom}, vượt giới hạn dung tích lưu trữ khuyến nghị của vị trí.`;
    severity = 'warning';
  }

  return { title, message, warning, severity };
}
