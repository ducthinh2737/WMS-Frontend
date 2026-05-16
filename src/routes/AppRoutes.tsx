import { Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute";

// OTHER
import Login from "../pages/auth/Login";
import Blocked from "../pages/auth/Block";
import AdminLayout from "../layouts/AdminLayout";
import Dashboard from "../pages/dashboard/dashboard";

// STOCKTAKE
import StockTakeList from "../pages/stocktake/StockTakeList";
import StockTakeCounting from "../pages/stocktake/StockTakeCounting"; // ĐÃ SỬA: Import đúng trang Counting

// TRANSFER
import TransferList from "../pages/transfer/TransferList";
import TransferCreate from "../pages/transfer/TransferCreate";

// OUTBOUND
import SaleOrderList from "../pages/outbound/SaleOrderList";
import SaleOrderDetail from "../pages/outbound/SaleOrderDetail";
import SaleOrderCreate from "../pages/outbound/SaleOrderCreate";
import GoodsIssueList from "../pages/outbound/GoodIssueList";
import GoodsIssueCreate from "../pages/outbound/GoodIssueCreate";

// INVENTORY
import InventoryList from "../pages/inventory/InventoryList";
import InventoryHistory from "../pages/inventory/InventoryHistory";
import InventoryAdjustForm from "../pages/inventory/InventoryAdjustForm";

// WAREHOUSE
import WarehouseList from "../pages/warehouse/WarehouseList";
import WarehouseCreate from "../pages/warehouse/WarehouseCreate"; 
import WarehouseEdit from "../pages/warehouse/WarehouseEdit";     

// LOCATION
import LocationList from "../pages/location/LocationList";
import LocationCreate from "../pages/location/LocationCreate"; 
import LocationEdit from "../pages/location/LocationEdit";     

// PRODUCT
import ProductList from "../pages/product/ProductList";
import ProductForm from "../pages/product/ProductForm";

// CUSTOMER
import CustomerForm from "../pages/customer/CustomerForm";
import CustomerList from "../pages/customer/CustomerList";

// SUPPLIER
import SupplierForm from "../pages/supplier/SupplierForm";
import SupplierList from "../pages/supplier/SupplierList";

// UNIT
import UnitList from "../pages/unit/UnitList";
import UnitForm from "../pages/unit/UnitForm";

// CATEGORY
import CategoryCreate from "../pages/category/CategoryCreate";
import CategoryEdit from "../pages/category/CategoryEdit";
import CategoryList from "../pages/category/CategoryList";

// USER
import UserList from "../pages/user/UserList";
import UpdateUser from "../pages/user/UpdateUser";
import CreateUser from "../pages/user/CreateUser";

// ROLES
import RoleList from "../pages/roles/RoleList";
import RoleCreate from "../pages/roles/RoleCreate";
import RoleEdit from "../pages/roles/RoleEdit";
import RolePermissionAssign from "../pages/roles/RolePermissionAssign";

// PERMISSIONS
import PermissionList from "../pages/permissions/PermissionList";
import PermissionCreate from "../pages/permissions/PermissionCreate";
import PermissionEdit from "../pages/permissions/PermissionEdit";

// AUTH MGMT
import AssignRole from "../pages/auth/AssignRole";
import AssignPermission from "../pages/auth/AssignPermission";

// MASTER DATA
import BrandList from "../pages/brands/BrandList";
import BrandCreate from "../pages/brands/BrandCreate";
import BrandEdit from "../pages/brands/BrandEdit";

// INBOUND
import PurchaseList from "../pages/inbound/PurchaseList";
import PurchaseCreateModal from "../pages/inbound/PurchaseForm";
import GRList from "../pages/inbound/GoodsReceiptList";
import GRCreate from "../pages/inbound/GRCountingModal";

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/blocked" element={<Blocked />} />

            {/* Private layout */}
            <Route element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
                <Route path="dashboard" element={<Dashboard />} />

                {/* ROLES */}
                <Route path="roles" element={<RoleList />} />
                {/* <Route path="roles/create" element={<RoleCreate />} />
                <Route path="roles/edit/:id" element={<RoleEdit />} />
                <Route path="roles/assign-permission/:id" element={<RolePermissionAssign />} /> */}

                {/* PERMISSIONS */}
                <Route path="permissions" element={<PermissionList />} />
                <Route path="permissions/create" element={<PermissionCreate />} />
                {/* <Route path="permissions/edit/:id" element={<PermissionEdit />} /> */}

                {/* AUTH */}
                <Route path="auth/assign-permission" element={<AssignPermission />} />

                {/* MASTER DATA → BRANDS */}
                <Route path="master/brands" element={<BrandList />} />
                <Route path="master/brands/create" element={<BrandCreate />} />
                <Route path="master/brands/edit/:id" element={<BrandEdit />} />

                {/* USER */}
                <Route path="users" element={<UserList />} />
                {/* <Route path="users/edit/:id" element={<UpdateUser />} />
                <Route path="users/create" element={<CreateUser />} /> */}

                {/* CATEGORY */}
                <Route path="category" element={<CategoryList />} />
                <Route path="category/edit/:id" element={<CategoryEdit />} />
                <Route path="category/create" element={<CategoryCreate />} />

                {/* UNIT */}
                <Route path="unit" element={<UnitList />} />
                <Route path="unit/edit/:id" element={<UnitForm />} />
                <Route path="unit/create" element={<UnitForm />} />

                {/* SUPPLIER */}
                <Route path="supplier" element={<SupplierList />} />
                <Route path="supplier/edit/:id" element={<SupplierForm mode="edit" />} />
                <Route path="supplier/create" element={<SupplierForm mode="create" />} />

                {/* CUSTOMER */}
                <Route path="customer" element={<CustomerList />} />
                <Route path="customer/edit/:id" element={<CustomerForm mode="edit" />} />
                <Route path="customer/create" element={<CustomerForm mode="create" />} />

                {/* PRODUCT / FINISHED GOODS */}
                <Route path="product" element={<ProductList type={1} />} />
                <Route path="product/create" element={<ProductForm type={1} />} />
                <Route path="product/edit/:id" element={<ProductForm type={1} />} />  

                {/* RAW MATERIAL */}
                <Route path="master/raw-materials" element={<ProductList type={0} />} />
                <Route path="master/raw-materials/create" element={<ProductForm type={0} />} />
                <Route path="master/raw-materials/edit/:id" element={<ProductForm type={0} />} />

                {/* INVENTORY */}
                <Route path="inventory" element={<InventoryList />} />
                {/* <Route path="inventory/adjust" element={<InventoryAdjustForm />} />
                <Route path="inventory/:productId/history" element={<InventoryHistory />} />
                <Route path="inventory/history" element={<InventoryHistory />} /> */}

                {/* === WAREHOUSE MODULE === */}
                <Route path="warehouse" element={<WarehouseList />} />
                {/* <Route path="warehouse/create" element={<WarehouseCreate />} />
                <Route path="warehouse/edit/:id" element={<WarehouseEdit />} /> */}

                {/* Nested Locations */}
                <Route path="warehouse/:warehouseId?/locations" element={<LocationList />} />
                {/* <Route path="warehouse/:warehouseId?/locations/create" element={<LocationCreate />} />
                <Route path="warehouse/:warehouseId?/locations/edit/:id" element={<LocationEdit />} /> */}

                {/* INBOUND */}
                <Route path="inbound" element={<PurchaseList />} />
                <Route path="inbound/receipt" element={<GRList />} />
                
                {/* OUTBOUND */}
                <Route path="outbound/orders" element={<SaleOrderList />} />
                <Route path="outbound/orders/create" element={<SaleOrderCreate />} />

                <Route path="outbound/issue" element={<GoodsIssueList />} />
                <Route path="outbound/issue/create" element={<GoodsIssueCreate />} />

                {/* TRANSFER */}
                <Route path="transfer" element={<TransferList />} />

                {/* STOCKTAKE */}
                <Route path="stocktake" element={<StockTakeList />} />
                <Route path="stocktake/counting/:id" element={<StockTakeCounting />} />
            </Route>

            {/* fallback */}
            <Route path="*" element={<Login />} />
        </Routes>
    );
}
