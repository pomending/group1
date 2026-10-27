import React, { useState } from "react";
import "./ProjectEdit.css";
import { useERP } from "../context/ERPContext";

function ProjectEdit(props) {

    const selectedProject = props.projects.find(
        project => project.id === props.selectedProjectId
    );

    const { updateProject } = useERP()

    // 수정 중에는 기존 프로젝트를 직접 변경하지 않고 입력값을 별도 관리
    const [projectName, setProjectName] = useState(selectedProject?.name ?? "");
    const [managerId, setManagerId] = useState(selectedProject?.managerId ?? "");
    const [startDate, setStartDate] = useState(selectedProject?.startDate ?? "");
    const [dueDate, setDueDate] = useState(selectedProject?.dueDate ?? "");
    const [description, setDescription] = useState(selectedProject?.description ?? "");

    const customer = props.customers.find(
        c => c.id === selectedProject?.customerId
    );

    const formatQuotationId = (id) => `QT-${String(id).padStart(3, "0")}`;

    const editProject = (e) => {
        e.preventDefault();

        // 유효성 체크
        if (!selectedProject) return;

        if (projectName.trim() === "") {
            alert("프로젝트명을 입력하세요.");
            return;
        }

        if (!startDate || !dueDate) {
            alert('시작일과 납품 예정일을 모두 입력하세요.');
            return;
        }

        if (dueDate < startDate) {
            alert("납품 예정일은 시작일보다 빠를 수 없습니다.");
            return;
        }

        updateProject({
            id: selectedProject.id,
            name: projectName.trim(),
            managerId: managerId === "" ? null : managerId,
            startDate: startDate,
            dueDate: dueDate,
            description: description
        })

        props.setPage("list");
    };

    if (!selectedProject) {
        return (
            <div className="pe-page">
                <div className="pe-container">
                    <p>프로젝트를 찾을 수 없습니다.</p>
                    <button className="pe-back" onClick={() => props.setPage("list")}>
                        ← 프로젝트 목록으로
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pe-page">
            <div className="pe-container">
                <button type="button" className="pe-back" onClick={() => props.setPage("list")}>
                    ← 프로젝트 목록으로
                </button>

                <header className="pe-heading">
                    <div>
                        <p className="pe-eyebrow">PROJECT MANAGEMENT / EDIT</p>
                        <h1>프로젝트 수정</h1>
                        <p className="pe-subtitle">기존 프로젝트 정보를 확인하고 필요한 항목을 변경하세요.</p>
                    </div>
                    <span className="pe-project-number">
                        PRJ-{String(selectedProject.id).padStart(3, "0")}
                    </span>
                </header>

                <form className="pe-card" onSubmit={editProject}>
                    <div className="pe-card-heading">
                        <div>
                            <span className="pe-section-num">PROJECT INFO</span>
                            <h2>프로젝트 기본 정보</h2>
                        </div>
                        <span className="pe-card-note">고객사와 연결 견적은 변경할 수 없습니다.</span>
                    </div>

                    <div className="pe-grid">
                        <div className="pe-field pe-full">
                            <label htmlFor="pe-name">프로젝트명 <span className="pe-required">*</span></label>
                            <input
                                id="pe-name"
                                name="projectName"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="pe-field">
                            <label>고객사</label>
                            <div className="pe-readonly">
                                {customer?.name ?? `고객 ID ${selectedProject.customerId}`}
                            </div>
                        </div>

                        <div className="pe-field">
                            <label>연결된 견적</label>
                            <div className="pe-readonly">
                                {selectedProject.quotationId != null
                                    ? formatQuotationId(selectedProject.quotationId)
                                    : "미연결"}
                            </div>
                        </div>

                        <div className="pe-field">
                            <label htmlFor="pe-manager">담당자</label>
                            <select
                                id="pe-manager"
                                name="manager"
                                value={managerId}
                                onChange={(e) => setManagerId(Number(e.target.value))}
                            >
                                <option value="" disabled>담당자를 선택하세요</option>
                                {props.employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="pe-field">
                            <label>진행 상태</label>
                            <div className="pe-readonly pe-readonly-status">
                                <span className="pe-status-dot" />
                                {selectedProject.status}
                            </div>
                        </div>

                        <div className="pe-field">
                            <label htmlFor="pe-start-date">시작 예정일</label>
                            <input
                                id="pe-start-date"
                                name="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        <div className="pe-field">
                            <label htmlFor="pe-due-date">납품 예정일</label>
                            <input
                                id="pe-due-date"
                                name="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>

                        <div className="pe-field pe-full">
                            <label htmlFor="pe-description">프로젝트 설명</label>
                            <textarea
                                id="pe-description"
                                name="description"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <footer className="pe-footer">
                        <p><span className="pe-required">*</span> 필수 입력 항목</p>
                        <div className="pe-actions">
                            <button type="button" className="pe-btn pe-cancel" onClick={() => props.setPage("detail")}>
                                취소
                            </button>
                            <button type="submit" className="pe-btn pe-save">
                                변경사항 저장
                            </button>
                        </div>
                    </footer>
                </form>
            </div>
        </div>
    );
}

export default ProjectEdit;
