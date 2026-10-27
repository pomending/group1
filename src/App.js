import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import "./ERPLayout.css";

import CrmPage from "./1_crm/CrmPage";
import QuotationPage from "./2_quotation/QuotationPage";
import ProjectPage from "./3_projects/ProjectPage";
import TaskPage from "./4_tasks/TaskPage";
import SchedulePage from "./5_schedule/SchedulePage";
import DashboardPage from "./6_dashboard/DashboardPage";


function ERPContent() {
  const location = useLocation();

  const hideSidebar =
      new URLSearchParams(location.search).get("popup") === "1";

  return (
      <div
          className="erp-layout"
          style={
              hideSidebar
                  ? { gridTemplateColumns: "1fr" }
                  : undefined
          }
      >
          {!hideSidebar && <Sidebar />}

          <main className="erp-main">
              <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/crm/*" element={<CrmPage />} />
                  <Route path="/quotation/*" element={<QuotationPage />} />
                  <Route path="/projects/*" element={<ProjectPage />} />
                  <Route path="/tasks/*" element={<TaskPage />} />
                  <Route path="/schedule/*" element={<SchedulePage />} />
              </Routes>
          </main>
      </div>
  );
}

function App() {
    return (
        <BrowserRouter>
            <ERPContent />
        </BrowserRouter>
    );
}

export default App;