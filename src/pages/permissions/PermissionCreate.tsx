import { Form, Input, Button, Card, message } from "antd";
import { permissionApi } from "../../api/permission.api";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";

export default function PermissionCreate() {
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        await permissionApi.create(values);
        message.success("Permission created");
        navigate("/permissions");
    };

    return (
        <>
            <PageHeader title="Create Permission" />

            <Card>
                <Form layout="vertical" onFinish={onFinish}>
    <Form.Item label="Code" name="code" rules={[{ required: true }]}>
        <Input placeholder="VD: user.create" />
    </Form.Item>

    <Form.Item label="Description" name="description">
        <Input.TextArea rows={3} placeholder="Mô tả chức năng quyền" />
    </Form.Item>

    <Button type="primary" htmlType="submit">Create</Button>
</Form>

            </Card>
        </>
    );
}
