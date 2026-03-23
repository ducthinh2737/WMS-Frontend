import QRCode from "qrcode";
export async function generatePOQRCode(po: {
  supplierId: number;
  items: Array<{ productId: number; warehouseId: string; quantity: number; price: number }>;
}): Promise<string> {
  const payload = JSON.stringify({
    supplierId: po.supplierId,
    items: po.items.map(i => ({
      productId: i.productId,
      warehouseId: i.warehouseId,
      quantity: i.quantity,
      price: i.price,
    })),
  });
 
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    width: 300,
    margin: 2,
  });
}