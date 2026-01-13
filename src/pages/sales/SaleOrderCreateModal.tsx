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
      onCancel={onClose}
      footer={null}
      width={1000}
      destroyOnClose
    >
      <SaleOrderCreateForm
        onCancel={onClose} // ✅ hợp lệ với interface Props
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
      />
    </Modal>
  );
}
