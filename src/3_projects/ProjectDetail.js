import React, { useState } from "react";
import "./ProjectDetail.css";
import { useERP } from "../context/ERPContext";

function ProjectDetail(props) {

    const { updateProject, deleteProject } = useERP()

    const projects = props.projects;
    const selectedProject = projects.find(project => project.id === props.selectedProjectId);

    const [status, setStatus] = useState(selectedProject?.status ?? '대기');

    const formatQuotationId = (id) => {
        return `QT-${String(id).padStart(3, '0')}`;
    };

    if (!selectedProject) {
        return (
            <div className="pd-page">
                <div className="pd-container">
                    <p>프로젝트를 찾을 수 없습니다.</p>
                    <button className="pd-back" onClick={() => props.setPage('list')}>
                        ← 프로젝트 목록으로
                    </button>
                </div>
            </div>
        );
    }

    // 프로젝트에 연결된 견적/고객/직원을 각각 ID로 조회
    const selectedQuotation = props.quotations.find(
        q => q.id === selectedProject.quotationId
    );
    const customer = props.customers.find(
        c => c.id === selectedProject.customerId
    );
    const manager = props.employees.find(
        emp => emp.id === selectedProject.managerId
    );

    const quotationTotal = selectedQuotation
        ? selectedQuotation.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice, 0
        )
        : 0;

    const delProject = () => {
        if (window.confirm('정말로 프로젝트를 삭제하시겠습니까?')) {
            deleteProject(selectedProject.id)
            props.setPage('list')
        }
    }

    const saveStatus = () => {
        updateProject({
            id: selectedProject.id,
            status: status,
            // 변경된 상태가 완료이면 오늘 날짜를 (YYYY-MM-DD) 형식으로 저장
            completedDate: status === '완료'
                ? (selectedProject.completedDate ?? new Date().toLocaleDateString('sv-SE'))
                : null
        })

        alert('상태 변경이 완료되었습니다')

    }

    return (
        <div className="pd-page">
            <div className="pd-container">
                <button className="pd-back" onClick={() => props.setPage('list')}>
                    ← 프로젝트 목록으로
                </button>

                <div className="pd-heading">
                    <div>
                        <p className="pd-eyebrow">PROJECT MANAGEMENT / DETAIL</p>
                        <h1>{selectedProject.name}</h1>
                        <p>프로젝트의 기본 정보와 제작 진행 상황을 확인합니다.</p>
                    </div>

                    <div className="pd-heading-actions">
                        <span className={
                            "pd-status pd-status-" +
                            selectedProject.status.replaceAll(' ', '')
                        }>
                            {selectedProject.status}
                        </span>

                        <button
                            className="pd-edit-btn"
                            onClick={() => props.setPage('edit')}
                        >
                            수정
                        </button>

                        <button className="pd-delete-btn" onClick={delProject}>삭제</button>
                    </div>
                </div>

                {/* 프로젝트 기본 정보 */}
                <section className="pd-card">
                    <div className="pd-card-header">
                        <div>
                            <span className="pd-section-num">PROJECT INFO</span>
                            <h2>프로젝트 기본 정보</h2>
                        </div>
                        <span className="pd-number">PRJ-{String(selectedProject.id).padStart(3, '0')}</span>
                    </div>

                    <div className="pd-info-grid">
                        <div className="pd-info-item">
                            <span>고객사</span>
                            <strong>{customer?.name ?? `고객 ID ${selectedProject.customerId}`}</strong>
                        </div>
                        <div className="pd-info-item">
                            <span>담당자</span>
                            <strong>{manager?.name ?? "미배정"}</strong>
                        </div>
                        <div className="pd-info-item">
                            <span>견적 번호</span>
                            <strong>{selectedProject.quotationId != null
                                ? formatQuotationId(selectedProject.quotationId)
                                : "미연결"}</strong>
                        </div>
                        <div className="pd-info-item">
                            <span>진행 상태</span>
                            <strong>{selectedProject.status}</strong>
                        </div>
                        <div className="pd-info-item">
                            <span>시작 예정일</span>
                            <strong>{selectedProject.startDate || "미정"}</strong>
                        </div>
                        <div className="pd-info-item">
                            <span>납품 예정일</span>
                            <strong>{selectedProject.dueDate || "미정"}</strong>
                        </div>
                        <div className="pd-info-item">
                            <span>실제 완료일</span>
                            <strong>{selectedProject.completedDate || "미완료"}</strong>
                        </div>
                    </div>

                    <div className="pd-description">
                        <span>프로젝트 설명</span>
                        <p>{selectedProject.description || "등록된 설명이 없습니다."}</p>
                    </div>
                </section>

                {/* 프로젝트 진행 현황 - 현재는 기존 목록과 동일하게 임시 80% */}
                <section className="pd-card">
                    <div className="pd-card-header">
                        <div>
                            <span className="pd-section-num">PROGRESS</span>
                            <h2>프로젝트 진행 현황</h2>
                        </div>
                        <strong className="pd-progress-percent">80%</strong>
                    </div>
                    <div className="pd-progress-track">
                        <div className="pd-progress-fill" style={{ width: '80%' }} />
                    </div>

                    <div className="pd-status-section">
                        <h3>프로젝트 상태 변경</h3>

                        <div className="pd-status-grid">
                            <div className="pd-status-field">
                                <label>현재 상태</label>
                                <div className="pd-current-status">
                                    {selectedProject.status}
                                </div>
                            </div>

                            <div className="pd-status-field">
                                <label htmlFor="pd-status-select">변경할 상태</label>
                                <select
                                    id="pd-status-select"
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="대기">대기</option>
                                    <option value="진행 중">진행 중</option>
                                    <option value="완료">완료</option>
                                    <option value="지연">지연</option>
                                </select>
                            </div>
                        </div>

                        <button
                            className="pd-status-save"
                            onClick={saveStatus}
                        >
                            상태 변경
                        </button>
                    </div>
                    <p className="pd-muted">현재는 임시 진행률입니다. 세부 작업 기능과 연결하면 실제 진행률로 교체할 수 있습니다.</p>
                </section>

                {/* 연결된 견적 내역 */}
                <section className="pd-card">
                    <div className="pd-card-header">
                        <div>
                            <span className="pd-section-num">QUOTATION & TASKS</span>
                            <h2>연결된 견적 및 세부 작업</h2>
                        </div>
                    </div>

                    <h3 className="pd-subheading">연결 견적 정보</h3>
                    {selectedQuotation ? (
                        <div className="pd-quotation">
                            <div className="pd-quotation-top">
                                <div>
                                    <span>견적 번호</span>
                                    <strong>{formatQuotationId(selectedQuotation.id)}</strong>
                                </div>
                                <div>
                                    <span>고객사</span>
                                    <strong>{customer?.name ?? `고객 ID ${selectedQuotation.customerId}`}</strong>
                                </div>
                                <span className="pd-approved">{selectedQuotation.status}</span>
                            </div>
                            <div className="pd-table-wrap">
                                <table className="pd-quotation-table">
                                    <thead>
                                        <tr>
                                            <th>상품명</th>
                                            <th>수량</th>
                                            <th>단가</th>
                                            <th>금액</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedQuotation.items.map((item, index) => (
                                            <tr key={`${item.productId}-${index}`}>
                                                <td>{item.productName}</td>
                                                <td>{item.quantity.toLocaleString()}개</td>
                                                <td>{item.unitPrice.toLocaleString()}원</td>
                                                <td>{(item.quantity * item.unitPrice).toLocaleString()}원</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="pd-quotation-total">
                                <span>총 견적 금액</span>
                                <strong>{quotationTotal.toLocaleString()}원</strong>
                            </div>
                        </div>
                    ) : (
                        <p className="pd-empty">연결된 견적 정보를 찾을 수 없습니다.</p>
                    )}

                    <h3 className="pd-subheading pd-tasks-heading">세부 작업</h3>
                    <div className="pd-empty">
                        세부 작업 관리 담당자의 데이터가 준비되면 이곳에 작업 목록을 표시할 예정입니다.
                    </div>
                </section>
            </div>
        </div>
    );
}

export default ProjectDetail;
