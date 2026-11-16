
import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import TaskDetail from "./TaskDetail";
import { useERP } from "../context/ERPContext";

import "./TaskPage.css";
import { TASK_PROGRESS, TASK_TYPES } from "../utils/taskUtils";
import { formatProjectId } from "../utils/formatUtils";
import NotFoundPage from "../components/NotFoundPage";

function TaskList() {

    // 작업 단계 필터
    const [ taskTypeFilter, setTaskTypeFilter ] = useState("전체");

    // 현재 페이지
    const [currentPage, setCurrentPage] = useState(1);

    // 한 페이지에서 표시할 작업 개수
    const itemsPerPage = 10;

    const { tasks, projects, employees } = useERP();

    const navigate = useNavigate();

    // 선택한 작업 단계에 따라 작업 목록 필터링
    const filteredTasks = tasks.filter((task) => {
        if (taskTypeFilter === "전체") {
            return true;
        }

        return task.taskType === taskTypeFilter;
    });

    // 전체 페이지수
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)

    // 현재 페이지에 표시할 데이터의 시작 위치
    const startIndex = (currentPage - 1) * itemsPerPage

    //현재 페이지에 표시할 작업 목록
    const currentTasks = filteredTasks.slice(
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

                <div className="summary-card">
                    <span>전체 작업</span>
                    <strong>{tasks.length}</strong>
                </div>

                {TASK_PROGRESS.map(progress => (
                    <div className="summary-card" key={progress}>
                    <span>{progress}</span>
                    <strong>{tasks.filter(t=>t.progress === progress).length}</strong>
                </div>
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

                <table className="task-table">

                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>프로젝트 번호</th>
                            <th>프로젝트 명</th>
                            <th>작업 단계</th>
                            <th>진행 상태</th>
                            <th>담당자</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredTasks.length > 0 ? (

                            currentTasks.map((task) => {
                                const project = projects.find(
                                    (p) => p.id === task.projectId
                                );

                                const employee = employees.find(
                                    (emp) => emp.id === task.employeeId
                                );

                                return (

                                    <tr key={task.id}>
                                        <td>{task.id}</td>

                                        <td>{formatProjectId(task.projectId)}</td>
                                        <td>{project?.name ?? "삭제된 프로젝트"}</td>

                                        <td>{task.taskType}</td>

                                        <td>
                                            <span
                                                className={`task-status ${task.progress === "완료"
                                                        ? "complete"
                                                        : task.progress === "작업중"
                                                            ? "progress"
                                                            : "waiting"
                                                    }`}
                                            >
                                                {task.progress}
                                            </span>
                                        </td>

                                        <td>{employee?.name ?? "담당자 없음"}</td>

                                    </tr>

                                );
                            })

                        ) : (

                            <tr>
                                <td colSpan="6">
                                    작업 내역이 없습니다.
                                </td>
                            </tr>

                        )}
                    </tbody>

                </table>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="task-pagination">
                        <button onClick={() => setCurrentPage(prev => prev - 1)}
                                disabled = {currentPage === 1}
                        >
                            이전
                        </button>
                        {Array.from({length: totalPages}, (_, index) => (
                            <button key={index + 1}
                                    className={currentPage === index + 1 ? "active" : ""}
                                    onClick={() => setCurrentPage(index + 1)}
                            >
                                {index + 1}
                        </button>
                        
                        ))}
                        <button onClick ={() => setCurrentPage(prev => prev + 1)}
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
