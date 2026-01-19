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
          <Menu theme="dark" mode="inline" style={{ borderRight: 0 }}>


            {/* DASHBOARD */}
            <Menu.Item key="/" icon={<DashboardOutlined />}>
              <Link to="/dashboard">Dashboard</Link>
            </Menu.Item>
            
            {/* AUTH */}
            
            {/* USERS */}
            <Menu.SubMenu key="users" icon={<UserOutlined />} title="USERS">
              <Menu.Item key="users-list">
                <Link to="users">User List</Link>
              </Menu.Item>
            </Menu.SubMenu>

            {/* ROLES */}
            <Menu.SubMenu key="roles" icon={<TeamOutlined />} title="ROLES">
              <Menu.Item key="roles-list">
                <Link to="/roles">Role List</Link>
              </Menu.Item>
            </Menu.SubMenu>

            {/* WAREHOUSE */}
            <Menu.SubMenu key="warehouse" icon={<HomeOutlined />} title="WAREHOUSE">
              <Menu.Item key="warehouse-list">
                <Link to="/warehouse">Warehouses</Link>
              </Menu.Item>
            </Menu.SubMenu>
            {/* TRANSFER */}
            <Menu.SubMenu key="transfer" icon={< SwapOutlined />} title="TRANSFER">
              <Menu.Item key="transfer-list">
                <Link to="/transfer">Transfer List</Link>
              </Menu.Item>
            </Menu.SubMenu>
            
            {/* STOCKTAKE
            <Menu.SubMenu key="stocktake" icon={<ScanOutlined />} title="STOCKTAKE">
              <Menu.Item key="stocktake-list" >
                <Link to="/stocktake">Stock Take</Link>
              </Menu.Item>
            </Menu.SubMenu> */}

            {/* LOCATION */}
            <Menu.SubMenu key="location" icon={<EnvironmentOutlined />} title="LOCATION">
              <Menu.Item key="location-list">
                <Link to="/warehouse/locations">Locations</Link>
              </Menu.Item>
            </Menu.SubMenu>

            {/* INVENTORY */}
            <Menu.SubMenu key="inventory" icon={<DatabaseOutlined />} title="INVENTORY">
              <Menu.Item key="inventory-list">
                <Link to="/inventory">Inventory List</Link>
              </Menu.Item>
            </Menu.SubMenu>

            {/* PERMISSIONS */}
            <Menu.SubMenu key="permissions" icon={<LockOutlined />} title="PERMISSIONS">
              <Menu.Item key="permissions-list">
                <Link to="/permissions">Permission List</Link>
              </Menu.Item>
            </Menu.SubMenu>

            {/* MASTER DATA */}
            <Menu.SubMenu key="master" icon={<AppstoreOutlined />} title="MASTER DATA">
              <Menu.Item key="master-brands">
                <Link to="/master/brands">Brands</Link>
              </Menu.Item>
              <Menu.Item key="master-categories">
                <Link to="category">Categories</Link>
              </Menu.Item>
              <Menu.Item key="master-units">
                <Link to="unit">Units</Link>
              </Menu.Item>
              <Menu.Item key="master-suppliers">
                <Link to="supplier">Suppliers</Link>
              </Menu.Item>
              <Menu.Item key="master-customers">
                <Link to="customer">Customers</Link>
              </Menu.Item>
              <Menu.Item key="master-products">
                <Link to="product">Products</Link>
              </Menu.Item>
            </Menu.SubMenu>

            {/* PURCHASE */}
<Menu.SubMenu key="purchase" icon={<ShoppingCartOutlined />} title="PURCHASE">
  <Menu.Item key="purchase-list">
    <Link to="/purchase">Purchase List</Link>
  </Menu.Item>

  <Menu.Divider />
  <Menu.Item key="gr-list">
    <Link to="/goodsreceipt">Goods Receipt List</Link>
  </Menu.Item>

</Menu.SubMenu>

{/* SALES */}
<Menu.SubMenu key="sales" icon={<FileTextOutlined />} title="SALES">
  {/* Sale Orders */}
  <Menu.Item key="sales-orders-list">
    <Link to="/sales/orders">Sale Orders List</Link>
  </Menu.Item>

  <Menu.Divider />

  {/* Goods Issue */}
  <Menu.Item key="sales-goods-issue-list">
    <Link to="/sales/goods-issue">Goods Issue List</Link>
  </Menu.Item>
  {/* <Menu.Item key="sales-goods-issue-create">
    <Link to="/sales/goods-issue/create">Create Goods Issue</Link>
  </Menu.Item> */}

</Menu.SubMenu>



          </Menu>
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
