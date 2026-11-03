import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    initialProjects,
    customers,
    initialEmployees,
    quotations,
    products
} from "../data/mockData";

import "./TaskPage.css";

function TaskDetail() {
    const navigate = useNavigate();

    // 선택한 프로젝트 번호
    const [selectedProjectId, setSelectedProjectId] = useState("");

    // 선택한 프로젝트 찾기
    const selectedProject = initialProjects.find(
        (project) => project.id === Number(selectedProjectId)
    );

    // 프로젝트와 연결된 정보 찾기
    const selectedCustomer = customers.find(
        (customer) => customer.id === selectedProject?.customerId
    );

    const selectedManager = initialEmployees.find(
        (employee) => employee.id === selectedProject?.managerId
    );

    const selectedQuotation = quotations.find(
        (quotation) => quotation.id === selectedProject?.quotationId
    );

    const selectedProduct = products.find(
        (product) => product.id === selectedQuotation?.productId
    );

    return (
        <div className="task-detail-page">

            {/* 상단 제목 */}
            <div className="td-header">
                <div>
                    <p className="td-eyebrow">
                        PROJECT MANAGEMENT / DETAIL
                    </p>
                    <h2>프로젝트 상세 관리</h2>
                    <p>등록된 프로젝트를 선택하여 상세정보를 확인합니다.</p>
                </div>

                <button
                    className="td-back-btn"
                    onClick={() => navigate("/tasks")}
                >
                    ← 작업 목록으로
                </button>
            </div>

            {/* 프로젝트 선택 */}
            <div className="td-select-box">
                <label htmlFor="projectSelect">프로젝트 선택</label>

                <select
                    id="projectSelect"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                    <option value="">프로젝트를 선택하세요</option>

                    {initialProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                            {project.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* 프로젝트 선택 전 */}
            {!selectedProject && (
                <div className="td-empty">
                    <h3>프로젝트를 선택해 주세요.</h3>
                    <p>선택한 프로젝트의 상세정보가 여기에 표시됩니다.</p>
                </div>
            )}

            {/* 프로젝트 선택 후 게시판 */}
            {selectedProject && (
                <div className="td-board">

                    <div className="td-board-header">
                        <div>
                            <span>PROJECT #{selectedProject.id}</span>
                            <h3>{selectedProject.name}</h3>
                        </div>

                        <span className={`td-status ${
                            selectedProject.status === "진행 중"
                                ? "status-progress"
                                : "status-waiting"
                        }`}>
                            {selectedProject.status}
                        </span>
                    </div>

                    <div className="td-board-content">
                        <h4>프로젝트 기본 정보</h4>

                        <table className="td-table">
                            <tbody>
                                <tr>
                                    <th>프로젝트명</th>
                                    <td>{selectedProject.name}</td>
                                    <th>프로젝트 번호</th>
                                    <td>{selectedProject.id}</td>
                                </tr>

                                <tr>
                                    <th>고객사</th>
                                    <td>{selectedCustomer?.companyName || "-"}</td>
                                    <th>담당자</th>
                                    <td>{selectedManager?.name || "-"}</td>
                                </tr>

                                <tr>
                                    <th>제품명</th>
                                    <td>{selectedProduct?.productName || "-"}</td>
                                    <th>프로젝트 상태</th>
                                    <td>{selectedProject.status}</td>
                                </tr>

                                <tr>
                                    <th>시작일</th>
                                    <td>{selectedProject.startDate || "-"}</td>
                                    <th>완료 예정일</th>
                                    <td>{selectedProject.dueDate || "-"}</td>
                                </tr>

                                <tr>
                                    <th>완료일</th>
                                    <td>{selectedProject.completedDate || "-"}</td>
                                    <th>견적 번호</th>
                                    <td>{selectedProject.quotationId}</td>
                                </tr>

                                <tr>
                                    <th>프로젝트 설명</th>
                                    <td colSpan="3">
                                        {selectedProject.description || "-"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>


                    <div className="td-board-content">
                        <h4>프로젝트 상세 정보</h4>
                    </div>

                </div>
            )}

        </div>
    );
}

export default TaskDetail;