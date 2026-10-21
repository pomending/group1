import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import CrmPage from './1_crm/CrmPage';
import QuotationPage from './2_quotation/QuotationPage';
import ProjectPage from './3_projects/ProjectPage';
import TaskPage from './4_tasks/TaskPage';
import SchedulePage from './5_schedule/SchedulePage';
import DashboardPage from './6_dashboard/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <div>
        <nav>
          <Link to="/">대시보드</Link> |{' '}
          <Link to="/crm">고객관리</Link> |{' '}
          <Link to="/quotation">견적 및 상품관리</Link> |{' '}
          <Link to="/projects">프로젝트관리</Link> |{' '}
          <Link to="/tasks">세부 작업관리</Link> |{' '}
          <Link to="/schedule">일정관리</Link>
        </nav>

        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/quotation" element={<QuotationPage />} />
          <Route path="/projects" element={<ProjectPage />} />
          <Route path="/tasks" element={<TaskPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;