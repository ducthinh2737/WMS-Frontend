import { Modal } from "antd";
import SaleOrderCreateForm from "./SaleOrderCreate";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SaleOrderCreateModal({
  open,
  onClose,
  onSuccess,
}: Props) {
  return (
    <Modal
      open={open}
      title="Tạo đơn bán hàng"
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnHidden
      centered
      maskClosable={false}
    >
      <SaleOrderCreateForm
        onCancel={onClose}
        onSuccess={() => {
          onSuccess(); // refresh list
          onClose();   // đóng modal
        }}
      />
    </Modal>
  );
}

