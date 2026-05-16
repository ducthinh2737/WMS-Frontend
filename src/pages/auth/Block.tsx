// src/pages/auth/Blocked.tsx
import { Result, Button } from "antd";
import { useAuthStore } from "../../store/authStore";

export default function Blocked() {
    const logout = useAuthStore(s => s.logout);

    return (
        <Result
            status="403"
            title="Không có quyền truy cập"
            subTitle="Phiên đăng nhập không hợp lệ hoặc bạn không được phép truy cập."
            extra={
                <Button type="primary" onClick={logout}>
                    Đăng nhập lại
                </Button>
            }
        />
    );
}
