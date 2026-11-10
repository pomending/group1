import { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import "./ERPLayout.css";

import CrmPage from "./1_crm/01_CrmPage";
import QuotationPage from "./2_quotation/QuotationPage";
import ProjectPage from "./3_projects/ProjectPage";
import TaskPage from "./4_tasks/TaskPage";
import SchedulePage from "./5_schedule/SchedulePage";
import DashboardPage from "./6_dashboard/DashboardPage";
import LoginPage from "./7_login/LoginPage";
import ChangePasswordPage from "./7_login/ChangePasswordPage";
import HrPage from "./8_hr/HrPage";
import AccountManagement from "./8_hr/AccountManagement";
import ConsultationPage from "./9_consultation/01_ConsultationPage";
import ProductPage from "./10_product/ProductPage";
import NotFoundPage from "./components/NotFoundPage";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import { ERPProvider, useERP } from "./context/ERPContext";

const REQUIRE_LOGIN = false;

function ERPContent() {

    const location = useLocation();

    const [isCollapsed, setIsCollapsed] = useState(false);

    const { currentUser } = useERP();

    const isAuthenticated = Boolean(currentUser);

    // 로그인 화면은 직접 접근 가능
    if (location.pathname === "/login") {
        return REQUIRE_LOGIN && isAuthenticated
            ? <Navigate to="/" replace />
            : <LoginPage />;
    }

    // 로그인 필수 모드에서만 접근 제한
    if (REQUIRE_LOGIN && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (isAuthenticated && currentUser?.mustChangePassword) {
        return <ChangePasswordPage />;
    }

    const isPopup =
        new URLSearchParams(location.search).get("popup") === "1";

    return (
        <div className={
            "erp-layout" +
            (isPopup ? " erp-popup" : "") +
            (isCollapsed && !isPopup ? " erp-collapsed" : "")
        }>

            {!isPopup && <Sidebar />}

            <div className="erp-workspace">

                {!isPopup && (
                    <Topbar
                        isCollapsed={isCollapsed}
                        setIsCollapsed={setIsCollapsed}
                    />
                )}

                <main className="erp-main">

                    <Routes>
                        <Route path="/" element={<DashboardPage />} />

                        <Route path="/crm/*" element={<CrmPage />} />
                        <Route path="/quotation/*" element={<QuotationPage />} />
                        <Route path="/projects/*" element={<ProjectPage />} />
                        <Route path="/tasks/*" element={<TaskPage />} />
                        <Route path="/schedule/*" element={<SchedulePage />} />
                        <Route
                            path="/hr/accounts"
                            element={
                                isAuthenticated && currentUser?.role === "ADMIN"
                                    ? <AccountManagement />
                                    : <Navigate to="/hr" replace />
                            }
                        />
                        <Route path='/hr/*' element={<HrPage />} />
                        <Route path="/consultation/*" element={<ConsultationPage />} />
                        <Route path="/product/*" element={<ProductPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>

                </main>
            </div>
        </div>
    );

}

function App() {
    return (
        <BrowserRouter>
            <ERPProvider>
                <ERPContent />
            </ERPProvider>


        </BrowserRouter>


    );
}

export default App;