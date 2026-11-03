
import React, { useState } from "react";
import { tasks } from "../data/tasks";
import { useNavigate } from "react-router-dom";

import "./TaskPage.css";

function TaskPage() {

    // 상태 필터
    const [statusFilter, setStatusFilter] = useState("전체");

    const navigate = useNavigate();

    // 나머지 기존 코드

    // 작업 상태별 개수
    const totalCount = tasks.length;

    const waitingCount = tasks.filter(
        (task) => task.status === "대기"
    ).length;

    const progressCount = tasks.filter(
        (task) => task.status === "진행 중"
    ).length;

    const completeCount = tasks.filter(
        (task) => task.status === "완료"
    ).length;

    const packagingCount = tasks.filter(
      (task) => task.status ==="포장"
    ).length;
    const deliveryCount = tasks.filter(
      (task) => task.status ==="베송"
    ).length;

    // 선택한 상태에 따라 작업 목록 필터링
    const filteredTasks = tasks.filter((task) => {
        if (statusFilter === "전체") {
            return true;
        }

        return task.status === statusFilter;
    });

    return (
        <div className="task-page">

            {/* 페이지 제목 */}
            <div className="task-header">
                <div>
                    <h2>작업 관리</h2>
                    <p>프로젝트별 작업 진행 현황을 관리합니다.</p>
                </div>
                <div class="pm-heading-actions">
                  
                <button className="new-btn"   onClick={() => navigate("/tasks/detail")}>
                 + 세부상세 내용
                </button>
                </div>
            </div>

           

            {/* 작업 현황 카드 */}
            <div className="task-summary">

                <div className="summary-card">
                    <span>전체 작업</span>
                    <strong>{totalCount}</strong>
                </div>

                <div className="summary-card">
                    <span>대기</span>
                    <strong>{waitingCount}</strong>
                </div>

                <div className="summary-card">
                    <span>진행 중</span>
                    <strong>{progressCount}</strong>
                </div>

                <div className="summary-card">
                    <span>완료</span>
                    <strong>{completeCount}</strong>
                </div>
                <div className="summary-card">
                    <span>포장</span>
                    <strong>{packagingCount}</strong>
                </div>

                <div className="summary-card">
                    <span>배송</span>
                    <strong>{deliveryCount}</strong>
                </div>

            </div>

            {/* 작업 목록 */}
            <div className="task-list-container">

                <div className="task-list-header">
                    <h3>작업 목록</h3>

                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                    >
                        <option value="전체">전체 상태</option>
                        <option value="대기">대기</option>
                        <option value="진행 중">진행 중</option>
                        <option value="완료">완료</option>
                        <option value="포장">포장</option>
                        <option value="배송">배송</option>
                    </select>
                </div>

                <table className="task-table">

                    <thead>
                        <tr>
                            <th>번호</th>
                            <th>프로젝트 번호</th>
                            <th>프록젝트 명</th>
                            <th>작업명</th>
                            <th>진행 상태</th>
                            <th>담당자</th>
                            <th>메모</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredTasks.length > 0 ? (

                            filteredTasks.map((task) => (

                                <tr key={task.id}>
                                    <td>{task.id}</td>

                                    <td>{task.projectId}</td>
                                    <td>{task.productName}</td>

                                    <td>{task.taskName}</td>

                                    <td>
                                        <span
                                            className={`task-status ${
                                                task.status === "완료"
                                                    ? "complete"
                                                    : task.status === "진행 중"
                                                    ? "progress"
                                                    : "waiting"
                                            }`}
                                        >
                                            {task.status}
                                        </span>
                                    </td>

                                    <td>담당자 {task.managerId}</td>

                                    <td>
                                        {task.memo || "-"}
                                    </td>
                                </tr>

                            ))

                        ) : (

                            <tr>
                                <td colSpan="6">
                                    작업 내역이 없습니다.
                                </td>
                            </tr>

                        )}
                    </tbody>

                    

                </table>

            </div>

        </div>
    );
}

export default TaskPage;
