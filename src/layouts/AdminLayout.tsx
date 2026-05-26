import { Layout, Menu, Button, Badge } from "antd";
import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import "../styles/global.css";
import { DashboardOutlined, BellOutlined, SyncOutlined } from "@ant-design/icons";
import { useNotification } from "../hooks/useNotification";
import NotificationSidebar from "../components/NotificationSidebar";


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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount, isPolling } = useNotification();

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
                key: "inbound",
                icon: <ShoppingCartOutlined />,
                label: <Link to="/inbound/receipt">Import </Link>,

              },
              {
                key: "outbound",
                icon: <FileTextOutlined />,
                label: <Link to="/outbound/issue">Export </Link>,

              },

              {
                key: "inventory",
                icon: <DatabaseOutlined />,
                label: <Link to="/inventory">Inventory List</Link>,
              },
              {
                key: "master",
                icon: <AppstoreOutlined />,
                label: "Master Data ",
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
                key: "warehouse",
                icon: <HomeOutlined />,
                label: <Link to="/warehouse">Warehouses</Link>,
              },
              {
                key: "location",
                icon: <EnvironmentOutlined />,
                label: <Link to="/warehouse/locations">Locations</Link>,

              },
              {
                key: "transfer",
                icon: <SwapOutlined />,
                label: <Link to="/transfer">Transfer List</Link>,

              },
              {
                key: "stocktake",
                icon: <ScanOutlined />,
                label: <Link to="/stocktake">Stocktake List</Link>,

              },
              {
                key: "users",
                icon: <UserOutlined />,
                label: <Link to="/users">User List</Link>,

              },





              {
                key: "roles",
                icon: <TeamOutlined />,
                label: <Link to="/roles">Role List</Link>,

              },

              {
                key: "permissions",
                icon: <LockOutlined />,
                label: <Link to="/permissions">Permission List</Link>,

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
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
            zIndex: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              type="text"
              onClick={() => setCollapsed(!collapsed)}
              style={{ marginRight: 12 }}
            >
              {collapsed ? "▶" : "◀"}
            </Button>
            <h3 style={{ margin: 0, fontWeight: 600 }}>Warehouse Management System</h3>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <Badge count={unreadCount} overflowCount={99} offset={[-2, 2]} style={{ boxShadow: '0 0 0 1px #fff' }}>
              <Button
                type="text"
                shape="circle"
                icon={
                  isPolling ? (
                    <SyncOutlined spin style={{ fontSize: 20, color: "#1677ff" }} />
                  ) : (
                    <BellOutlined
                      style={{
                        fontSize: 20,
                        color: unreadCount > 0 ? "#faad14" : "#475569",
                      }}
                    />
                  )
                }
                onClick={() => setSidebarOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  transition: 'all 0.2s',
                }}
              />
            </Badge>
          </div>
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

      <NotificationSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </Layout>
  );
}
