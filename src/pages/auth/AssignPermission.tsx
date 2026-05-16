import { Form, InputNumber, Button, Card, message } from "antd";
import { authApi } from "../../api/auth.api";

export default function AssignPermission() {
    const onFinish = async (values: any) => {
        await authApi.assignPermission(values.userId, values.permissionId);
        message.success("Gán Permission thành công!");
    };

    return (
        <div style={{ display:"flex", justifyContent:"center", marginTop:80 }}>
            <Card title="Gán Permission cho User" style={{ width: 400 }}>
                <Form onFinish={onFinish} layout="vertical">
                    <Form.Item name="userId" label="User ID" rules={[{ required: true }]}>
                        <InputNumber min={1} style={{ width:"100%" }} />
                    </Form.Item>
                    <Form.Item name="permissionId" label="Permission ID" rules={[{ required: true }]}>
                        <InputNumber min={1} style={{ width:"100%" }} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Gán Permission
                    </Button>
                </Form>
            </Card>
        </div>
    );
}
