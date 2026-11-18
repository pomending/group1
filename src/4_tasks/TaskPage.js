
import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import TaskDetail from "./TaskDetail";
import { useERP } from "../context/ERPContext";

import "./TaskPage.css";
import { TASK_PROGRESS, TASK_TYPES } from "../utils/taskUtils";
import { formatProjectId } from "../utils/formatUtils";
import NotFoundPage from "../components/NotFoundPage";

function TaskList() {

    const [taskTypeFilter, setTaskTypeFilter] = useState("전체");
    const [progressFilter, setProgressFilter] = useState("전체");
    const [currentPage, setCurrentPage] = useState(1);
    const [openProjectId, setOpenProjectId] = useState(null);

    const itemsPerPage = 10;

    const { tasks, setTasks, projects, employees } = useERP();

    const navigate = useNavigate();

    const changeProgressFilter = (value) => {
        setProgressFilter(value);
        setCurrentPage(1);
        setOpenProjectId(null);
    };

    // 1. 작업 필터링
    const filteredTasks = tasks.filter(task => {

        const matchesType =
            taskTypeFilter === "전체" ||
            task.taskType === taskTypeFilter;

        const matchesProgress =
            progressFilter === "전체" ||
            task.progress === progressFilter;

        return matchesType && matchesProgress;
    });

    // 2. 프로젝트별 그룹화
    const groupedProjects = projects.map(project => ({
        project,
        projectTasks: filteredTasks.filter(
            task => task.projectId === project.id
        )
    })).filter(group => group.projectTasks.length > 0);

    // 3. 페이지네이션
    const totalPages = Math.ceil(groupedProjects.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;

    const currentProjects = groupedProjects.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    return (
        <div className="task-page">

            {/* 페이지 제목 */}
            <div className="task-header">
                <div>
                    <h2>작업 관리</h2>
                    <p>프로젝트별 작업 진행 현황을 관리합니다.</p>
                </div>
                <div className="pm-heading-actions">

                    <button className="new-btn" onClick={() => navigate("/tasks/detail")}>
                        + 세부상세 내용
                    </button>
                </div>
            </div>

            {/* 작업 현황 카드 */}
            <div className="task-summary">

                <button
                    type="button"
                    className={`summary-card ${progressFilter === "전체" ? "active" : ""}`}
                    onClick={() => changeProgressFilter("전체")}
                    aria-pressed={progressFilter === "전체"}
                >
                    <span>전체 작업</span>
                    <strong>
                        {tasks.length}
                        <small className="task-stat-unit">건</small>
                    </strong>
                </button>

                {TASK_PROGRESS.map(progress => (
                    <button
                        type="button"
                        className={`summary-card ${progressFilter === progress ? "active" : ""}`}
                        key={progress}
                        onClick={() => changeProgressFilter(progress)}
                        aria-pressed={progressFilter === progress}
                    >
                        <span>{progress}</span>
                        <strong>
                            {tasks.filter(t => t.progress === progress).length}
                            <small className="task-stat-unit">건</small>
                        </strong>
                    </button>
                ))}

            </div>

            {/* 작업 목록 */}
            <div className="task-list-container">

                <div className="task-list-header">
                    <h3>작업 목록</h3>

                    <select
                        value={taskTypeFilter}
                        onChange={(e) => {
                            setTaskTypeFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="전체">전체 단계</option>
                        {TASK_TYPES.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>

                {/* 프로젝트별 아코디언 목록 */}
                <div className="task-accordion-list">

                    {currentProjects.length > 0 ? (

                        currentProjects.map((group, index) => (

                            <div
                                className="task-accordion"
                                key={group.project.id}
                            >

                                {/* 프로젝트 제목 */}
                                <button
                                    type="button"
                                    className="task-accordion-header"
                                    onClick={() => {
                                        setOpenProjectId(
                                            openProjectId === group.project.id
                                                ? null
                                                : group.project.id
                                        );
                                    }}
                                >

                                    <div className="task-project-info">

                                        <span className="task-project-number">
                                            {formatProjectId(group.project.id)}
                                        </span>

                                        <strong>
                                            {group.project.name}
                                        </strong>

                                        <span className="task-count">
                                            작업 {group.projectTasks.length}개
                                        </span>

                                    </div>

                                    <span className="accordion-arrow">
                                        {openProjectId === group.project.id ? "▲" : "▼"}
                                    </span>

                                </button>


                                {/* 펼쳐지는 작업 목록 */}
                                {openProjectId === group.project.id && (

                                    <div className="task-accordion-content">

                                        <div className="task-accordion-label">
                                            <span>작업 단계</span>
                                            <span>진행 상태</span>
                                            <span>담당자</span>
                                        </div>

                                        {group.projectTasks.map(task => (

                                            <div
                                                className="task-accordion-item"
                                                key={task.id}
                                            >

                                                {/* 작업 단계 */}
                                                <select
                                                    value={task.taskType}
                                                    onChange={e => {
                                                        const value = e.target.value;

                                                        setTasks(prev =>
                                                            prev.map(t =>
                                                                t.id === task.id
                                                                    ? { ...t, taskType: value }
                                                                    : t
                                                            )
                                                        );
                                                    }}
                                                >
                                                    {TASK_TYPES.map(type => (
                                                        <option key={type} value={type}>
                                                            {type}
                                                        </option>
                                                    ))}
                                                </select>


                                                {/* 진행 상태 */}
                                                <select
                                                    value={task.progress}
                                                    onChange={e => {
                                                        const value = e.target.value;

                                                        setTasks(prev =>
                                                            prev.map(t =>
                                                                t.id === task.id
                                                                    ? { ...t, progress: value }
                                                                    : t
                                                            )
                                                        );
                                                    }}
                                                >
                                                    {TASK_PROGRESS.map(progress => (
                                                        <option key={progress} value={progress}>
                                                            {progress}
                                                        </option>
                                                    ))}
                                                </select>


                                                {/* 담당자 */}
                                                <select
                                                    value={String(task.employeeId ?? "")}
                                                    onChange={e => {
                                                        const selectedEmployee = employees.find(
                                                            emp => String(emp.id) === e.target.value
                                                        );

                                                        setTasks(prev =>
                                                            prev.map(t =>
                                                                t.id === task.id
                                                                    ? {
                                                                        ...t,
                                                                        employeeId: selectedEmployee
                                                                            ? selectedEmployee.id
                                                                            : ""
                                                                    }
                                                                    : t
                                                            )
                                                        );
                                                    }}
                                                >
                                                    <option value="">담당자 선택</option>

                                                    {employees.map(emp => (
                                                        <option
                                                            key={emp.id}
                                                            value={emp.id}
                                                        >
                                                            {emp.name}
                                                        </option>
                                                    ))}
                                                </select>

                                            </div>

                                        ))}

                                    </div>

                                )}

                            </div>

                        ))

                    ) : (

                        <div className="task-empty">
                            작업 내역이 없습니다.
                        </div>

                    )}

                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="task-pagination">
                        <button onClick={() => setCurrentPage(prev => prev - 1)}
                            disabled={currentPage === 1}
                        >
                            이전
                        </button>
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button key={index + 1}
                                className={currentPage === index + 1 ? "active" : ""}
                                onClick={() => setCurrentPage(index + 1)}
                            >
                                {index + 1}
                            </button>

                        ))}
                        <button onClick={() => setCurrentPage(prev => prev + 1)}
                            disabled={currentPage === totalPages}
                        >
                            다음
                        </button>
                    </div>
                )}

            </div>

        </div>

    );
}

function TaskPage() {
    return (
        <Routes>
            <Route index element={<TaskList />} />
            <Route path="detail" element={<TaskDetail />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

export default TaskPage;
