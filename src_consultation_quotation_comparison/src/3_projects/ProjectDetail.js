import React, { useState } from "react";
import { useERP } from "../context/ERPContext";
import { formatProjectId, formatQuotationId } from "../utils/formatUtils";
import { getProjectStatus, getProjectProgress } from "../utils/projectStatus";
import ProjectQuotationInfo from "./ProjectQuotationInfo";

function ProjectDetail(props) {

    const { projects,
        updateProject,
        deleteProject,
        customers,
        projectHistory,
        employees,
        quotations,
        products,
        tasks
    } = useERP()

    const selectedProject = projects.find(project => project.id === props.selectedProjectId);

    const [status, setStatus] = useState(selectedProject?.status ?? '대기');

    if (!selectedProject) {
        return (
            <div className="pd-page pj-page">
                <div className="pd-container pj-container">
                    <p>프로젝트를 찾을 수 없습니다.</p>
                    <button className="pd-back pj-back" onClick={() => props.setPage('list')}>
                        ← 프로젝트 목록으로
                    </button>
                </div>
            </div>
        );
    }

    // 프로젝트에 연결된 견적/고객/직원을 각각 ID로 조회
    const selectedQuotation = quotations.find(
        q => q.id === selectedProject.quotationId
    );
    const customer = customers.find(
        c => c.id === selectedProject.customerId
    );
    const manager = employees.find(
        emp => emp.id === selectedProject.managerId
    );
    const selectedProduct = products.find(
        product => product.id === selectedQuotation?.productId
    );

    const projectTasks = tasks.filter(
        task => task.projectId === selectedProject.id
    );

    const histories = projectHistory
        .filter(history => history.projectId === selectedProject.id)
        .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))

    const fieldLabels = {
        name: '프로젝트명',
        status: '진행 상태',
        managerId: '담당자',
        customerId: '고객사',
        quotationId: '견적 번호',
        startDate: '시작 예정일',
        dueDate: '납품 예정일',
        completedDate: '실제 완료일',
        description: '프로젝트 설명'
    }

    const formatHistoryValue = (field, value) => {

        if (value === null || value === undefined || value === '') {
            return '없음'
        }

        if (field === 'managerId') {
            return employees.find(emp => emp.id === value)?.name ?? `직원 ID ${value}`
        }

        if (field === 'customerId') {
            return customers.find(c => c.id === value)?.companyName ?? `고객 ID ${value}`
        }

        if (field === 'quotationId') {
            return formatQuotationId(value)
        }

        return String(value)
    }

    

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
        <div className="pd-page pj-page">
            <div className="pd-container pj-container">
                <div className="pd-top-actions">
                    <button
                        className="pd-back pj-back"
                        onClick={() => props.setPage("list")}
                    >
                        ← 프로젝트 목록으로
                    </button>

                    <button
                        className="pd-print-btn pj-btn"
                        onClick={() => window.print()}
                    >
                        보고서 인쇄
                    </button>
                </div>

                <div className="project-report">

                    <div className="pd-heading">
                        <div>
                            <p className="pd-eyebrow pj-eyebrow">PROJECT MANAGEMENT / DETAIL</p>
                            <h1>{selectedProject.name}</h1>
                            <p>프로젝트의 기본 정보와 제작 진행 상황을 확인합니다.</p>
                        </div>

                        <div className="pd-heading-actions">
                            <span className={
                                "pd-status pj-badge pd-status-" +
                                getProjectStatus(selectedProject).replaceAll(' ', '')
                            }>
                                {getProjectStatus(selectedProject)}
                            </span>

                            <button
                                className="pd-edit-btn pj-btn pj-primary"
                                onClick={() => props.setPage('edit')}
                            >
                                수정
                            </button>

                            <button className="pd-delete-btn pj-btn" onClick={delProject}>삭제</button>
                        </div>
                    </div>

                    {/* 프로젝트 기본 정보 */}
                    <section className="pd-card pj-card">
                        <div className="pd-card-header pj-card-heading">
                            <div>
                                <span className="pd-section-num pj-eyebrow">PROJECT INFO</span>
                                <h2>프로젝트 기본 정보</h2>
                            </div>
                            <span className="pd-number">{formatProjectId(selectedProject.id)}</span>
                        </div>

                        <div className="pd-info-grid">
                            <div className="pd-info-item">
                                <span>고객사</span>
                                <strong>{customer?.companyName ?? `고객 ID ${selectedProject.customerId}`}</strong>
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
                                <strong>{getProjectStatus(selectedProject)}</strong>
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

                    {/* 고객사 상세 정보 */}
                    <section className="pd-card pj-card">
                        <div className="pd-card-header pj-card-heading">
                            <div>
                                <span className="pd-section-num pj-eyebrow">CUSTOMER INFO</span>
                                <h2>고객사 상세 정보</h2>
                            </div>
                        </div>

                        {customer ? (
                            <>
                                <div className="pd-info-grid">
                                    <div className="pd-info-item">
                                        <span>고객사명</span>
                                        <strong>{customer.companyName}</strong>
                                    </div>

                                    <div className="pd-info-item">
                                        <span>사업자등록번호</span>
                                        <strong>{customer.businessNumber || '미등록'}</strong>
                                    </div>

                                    <div className="pd-info-item">
                                        <span>고객사 담당자</span>
                                        <strong>{customer.customerManager || '미등록'}</strong>
                                    </div>

                                    <div className="pd-info-item">
                                        <span>담당자 연락처</span>
                                        <strong>{customer.phone || '미등록'}</strong>
                                    </div>

                                    <div className="pd-info-item">
                                        <span>이메일</span>
                                        <strong>{customer.email || '미등록'}</strong>
                                    </div>

                                    <div className="pd-info-item">
                                        <span>주소</span>
                                        <strong>{customer.address || '미등록'}</strong>
                                    </div>
                                </div>

                                <div className="pd-description">
                                    <span>고객 메모</span>
                                    <p>{customer.memo || '등록된 메모가 없습니다.'}</p>
                                </div>
                            </>
                        ) : (
                            <p className="pd-empty">
                                연결된 고객사 정보를 찾을 수 없습니다.
                            </p>
                        )}
                    </section>

                    {/* 프로젝트 진행 현황 - 현재는 기존 목록과 동일하게 임시 80% */}
                    <section className="pd-card pj-card">
                        <div className="pd-card-header pj-card-heading">
                            <div>
                                <span className="pd-section-num pj-eyebrow">PROGRESS</span>
                                <h2>프로젝트 진행 현황</h2>
                            </div>
                            <strong className="pd-progress-percent">{getProjectProgress(selectedProject, tasks)}%</strong>
                        </div>
                        <div className="pd-progress-track pj-progress-track">
                            <div className="pd-progress-fill pj-progress-fill" style={{ width: `${getProjectProgress(selectedProject, tasks)}%` }} />
                        </div>

                        <div className="pd-status-section pd-status-editor">
                            <h3>프로젝트 상태 변경</h3>

                            <div className="pd-status-grid">
                                <div className="pd-status-field pj-field">
                                    <label>현재 상태</label>
                                    <div className="pd-current-status">
                                        {getProjectStatus(selectedProject)}
                                    </div>
                                </div>

                                <div className="pd-status-field pj-field">
                                    <label htmlFor="pd-status-select">변경할 상태</label>
                                    <select
                                        id="pd-status-select"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="대기">대기</option>
                                        <option value="진행 중">진행 중</option>
                                        <option value="완료">완료</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                className="pd-status-save pj-btn pj-primary"
                                onClick={saveStatus}
                            >
                                상태 변경
                            </button>
                        </div>

                    </section>

                    {/* 프로젝트 변경 이력 */}
                    <section className="pd-card pj-card pd-history-card">
                        <div className="pd-card-header pj-card-heading">
                            <div>
                                <span className="pd-section-num pj-eyebrow">PROJECT HISTORY</span>
                                <h2>프로젝트 변경 이력</h2>
                            </div>
                        </div>

                        {histories.length === 0 ? (
                            <p className="pd-empty">변경 이력이 없습니다.</p>
                        ) : (
                            <div className="pd-history-list">
                                {histories.map(history => (
                                    <div className="pd-history-item" key={history.id}>

                                        <strong>
                                            {new Date(history.changedAt).toLocaleString('ko-KR')}
                                        </strong>

                                        <ul>
                                            {history.changes.map((change, index) => (
                                                <li key={`${change.field}-${index}`}>
                                                    {fieldLabels[change.field] ?? change.field} :
                                                    {' '}
                                                    {formatHistoryValue(change.field, change.oldValue)}
                                                    {' → '}
                                                    {formatHistoryValue(change.field, change.newValue)}
                                                </li>
                                            ))}
                                        </ul>

                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* 연결된 견적 내역 */}
                    <section className="pd-card pj-card pd-quotation-tasks-card">
                        <div className="pd-card-header pj-card-heading">
                            <div>
                                <span className="pd-section-num pj-eyebrow">QUOTATION & TASKS</span>
                                <h2>연결된 견적 및 세부 작업</h2>
                            </div>
                        </div>

                        <h3 className="pd-subheading">연결 견적 정보</h3>
                        {selectedQuotation ? (
                            <ProjectQuotationInfo product={selectedProduct} quotation={selectedQuotation} customer={customer}/>
                        ) : (
                            <p className="pd-empty">연결된 견적 정보를 찾을 수 없습니다.</p>
                        )}

                        <h3 className="pd-subheading pd-tasks-heading">세부 작업</h3>

                        {projectTasks.length === 0 ? (
                            <p className="pd-empty">
                                등록된 세부 작업이 없습니다.
                            </p>
                        ) : (
                            <div className="pd-table-wrap pj-quote-wrap">
                                <table className="pd-quotation-table pj-quote-table">
                                    <thead>
                                        <tr>
                                            <th>작업 종류</th>
                                            <th>담당자</th>
                                            <th>마감일</th>
                                            <th>진행 상태</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectTasks.map(task => (
                                            <tr key={task.id}>
                                                <td>{task.taskStatus}</td>
                                                <td>
                                                    {employees.find(
                                                        emp => emp.id === task.employeeId
                                                    )?.name ?? "미등록"}
                                                </td>
                                                <td>{task.taskDeadline || "미정"}</td>
                                                <td>
                                                    <span className={`pd-task-status ${task.progress === "완료" ? "done" :
                                                            task.progress === "작업중" ? "working" : "waiting"
                                                        }`}>
                                                        {task.progress}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default ProjectDetail;
