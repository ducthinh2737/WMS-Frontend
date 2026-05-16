import { Layout, Menu, Button } from "antd";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import "../styles/global.css";
import { DashboardOutlined } from "@ant-design/icons";


import {
  UserOutlined,
  TeamOutlined,
  LockOutlined,
  AppstoreOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SwapOutlined,
  ScanOutlined
} from "@ant-design/icons";

const { Sider, Content, Header } = Layout;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  const siderWidth = 240;
  const siderCollapsedWidth = 80;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        width={siderWidth}
        theme="dark"
        // collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        style={{
          overflowY: "auto",
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          zIndex: 1000,
        }}
      >
        <div
          style={{
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          {collapsed ? "WMS" : "WMS"}
        </div>

        <div style={{ height: `calc(100vh - 60px)`, overflowY: "auto" }}>
          <Menu
            theme="dark"
            mode="inline"
            style={{ borderRight: 0 }}
            items={[
              {
                key: "/",
                icon: <DashboardOutlined />,
                label: <Link to="/dashboard">Dashboard</Link>,
              },
              {
                key: "users",
                icon: <UserOutlined />,
                label: "USERS",
                children: [
                  {
                    key: "users-list",
                    label: <Link to="/users">User List</Link>,
                  },
                ],
              },
              {
                key: "roles",
                icon: <TeamOutlined />,
                label: "ROLES",
                children: [
                  {
                    key: "roles-list",
                    label: <Link to="/roles">Role List</Link>,
                  },
                ],
              },
              {
                key: "warehouse",
                icon: <HomeOutlined />,
                label: "WAREHOUSE",
                children: [
                  {
                    key: "warehouse-list",
                    label: <Link to="/warehouse">Warehouses</Link>,
                  },
                ],
              },
              {
                key: "transfer",
                icon: <SwapOutlined />,
                label: "TRANSFER",
                children: [
                  {
                    key: "transfer-list",
                    label: <Link to="/transfer">Transfer List</Link>,
                  },
                ],
              },
              {
                key: "stocktake",
                icon: <ScanOutlined />,
                label: "STOCKTAKE",
                children: [
                  {
                    key: "stocktake-list",
                    label: <Link to="/stocktake">Stocktake List</Link>,
                  },
                ],
              },
              {
                key: "location",
                icon: <EnvironmentOutlined />,
                label: "LOCATION",
                children: [
                  {
                    key: "location-list",
                    label: <Link to="/warehouse/locations">Locations</Link>,
                  },
                ],
              },
              {
                key: "inventory",
                icon: <DatabaseOutlined />,
                label: "INVENTORY",
                children: [
                  {
                    key: "inventory-list",
                    label: <Link to="/inventory">Inventory List</Link>,
                  },
                ],
              },
              {
                key: "permissions",
                icon: <LockOutlined />,
                label: "PERMISSIONS",
                children: [
                  {
                    key: "permissions-list",
                    label: <Link to="/permissions">Permission List</Link>,
                  },
                ],
              },
              {
                key: "master",
                icon: <AppstoreOutlined />,
                label: "MASTER DATA",
                children: [
                  {
                    key: "master-brands",
                    label: <Link to="/master/brands">Brands</Link>,
                  },
                  {
                    key: "master-categories",
                    label: <Link to="/category">Categories</Link>,
                  },
                  {
                    key: "master-units",
                    label: <Link to="/unit">Units</Link>,
                  },
                  {
                    key: "master-suppliers",
                    label: <Link to="/supplier">Suppliers</Link>,
                  },
                  {
                    key: "master-customers",
                    label: <Link to="/customer">Customers</Link>,
                  },
                  {
                    key: "master-raw-materials",
                    label: <Link to="/master/raw-materials">Raw Materials</Link>,
                  },
                  {
                    key: "master-products",
                    label: <Link to="/product">Products</Link>,
                  },
                ],
              },
              {
                key: "inbound",
                icon: <ShoppingCartOutlined />,
                label: "INBOUND",
                children: [
                  {
                    key: "inbound-list",
                    label: <Link to="/inbound/receipt">INBOUND LIST</Link>,
                  },
                ],
              },
              {
                key: "outbound",
                icon: <FileTextOutlined />,
                label: "OUTBOUND",
                children: [
                  {
                    key: "outbound-list",
                    label: <Link to="/outbound/issue">OUTBOUND LIST</Link>,
                  },
                ],
              },
            ]}
          />
        </div>
      </Sider>

      {/* Main layout */}
      <Layout
        style={{
          marginLeft: collapsed ? siderCollapsedWidth : siderWidth,
          transition: "margin-left 0.2s",
        }}
      >
        <Header
          style={{
            background: "#fff",
            padding: 12,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            style={{ marginRight: 12 }}
          >
            {collapsed ? "▶" : "◀"}
          </Button>
          <h3>Warehouse Management System</h3>
        </Header>

        <Content
          style={{
            padding: 24,
            background: "#F0F2F5",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
