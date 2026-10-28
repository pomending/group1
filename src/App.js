import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import "./ERPLayout.css";

import CrmPage from "./1_crm/01_CrmPage";
import QuotationPage from "./2_quotation/QuotationPage";
import ProjectPage from "./3_projects/ProjectPage";
import TaskPage from "./4_tasks/TaskPage";
import SchedulePage from "./5_schedule/SchedulePage";
import DashboardPage from "./6_dashboard/DashboardPage";

import QuotationList from "./2_quotation/QuotationList";
import ProductPage from "./2_quotation/ProductPage";
import NotFoundPage from "./components/NotFoundPage";
import Topbar from "./components/Topbar";
import { ERPProvider } from "./context/ERPContext";

function ERPContent() {

    const location = useLocation();

    const [isCollapsed, setIsCollapsed] = useState(false);

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
                        <Route path="/quotation/list" element={<QuotationList />} />
                        <Route path="/product/*" element={<ProductPage />} />
                        <Route path="/projects/*" element={<ProjectPage />} />
                        <Route path="/tasks/*" element={<TaskPage />} />
                        <Route path="/schedule/*" element={<SchedulePage />} />

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