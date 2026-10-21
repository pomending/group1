
import { useState } from "react";
import "./ProjectForm.css";

function ProjectForm(props) {
    const [name, setName] = useState('');
    const [customer, setCustomer] = useState('');
    const [manager, setManager] = useState('김민수');
    const [due, setDue] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (name.trim() === '') {
            alert('프로젝트명을 입력하세요');
            return;
        }

        if (customer.trim() === '') {
            alert('고객사를 입력하세요');
            return;
        }

        props.setProjects(prev => [...prev, {
            id: Math.max(0, ...prev.map(p => Number(p.id) || 0)) + 1,
            name: name.trim(),
            customer: customer.trim(),
            manager: manager,
            dueDate: due,
            status: '대기'
        }]);

        props.setPage('list');
    };

    return (
        <div className="pf-page">
            <div className="pf-container">

                <button
                    type="button"
                    className="pf-back"
                    onClick={() => props.setPage('list')}
                >
                    <span>←</span> 프로젝트 목록으로
                </button>

                <div className="pf-heading">
                    <div>
                        <p className="pf-eyebrow">PROJECT MANAGEMENT</p>
                        <h2>새 프로젝트 등록</h2>
                        <p className="pf-subtitle">
                            새로운 굿즈 제작 프로젝트의 정보를 입력하세요.
                        </p>
                    </div>
                    <span className="pf-heading-tag">+ 신규 등록</span>
                </div>

                <form className="pf-card" onSubmit={handleSubmit}>

                    <div className="pf-card-header">
                        <div>
                            <span className="pf-section-num">
                                01 / PROJECT INFO
                            </span>
                            <h3>프로젝트 기본 정보</h3>
                            <p>프로젝트 진행에 필요한 정보를 등록합니다.</p>
                        </div>
                    </div>

                    <div className="pf-fields">

                        <div className="pf-field pf-full">
                            <label htmlFor="pf-name">
                                프로젝트명 <span className="pf-required">*</span>
                            </label>
                            <input
                                id="pf-name"
                                name="name"
                                value={name}
                                placeholder="예: ABC대학교 창립기념 텀블러 제작"
                                onChange={(e) => setName(e.target.value)}
                            />
                            <small>프로젝트를 구분할 수 있는 이름을 입력하세요.</small>
                        </div>

                        <div className="pf-field">
                            <label htmlFor="pf-customer">
                                고객사 <span className="pf-required">*</span>
                            </label>
                            <input
                                id="pf-customer"
                                name="customer"
                                value={customer}
                                placeholder="예: ABC대학교"
                                onChange={(e) => setCustomer(e.target.value)}
                            />
                        </div>

                        <div className="pf-field">
                            <label htmlFor="pf-manager">담당자</label>
                            <select
                                id="pf-manager"
                                name="manager"
                                value={manager}
                                onChange={(e) => setManager(e.target.value)}
                            >
                                <option value="김민수">김민수</option>
                                <option value="이지현">이지현</option>
                                <option value="박준호">박준호</option>
                            </select>
                        </div>

                        <div className="pf-field">
                            <label htmlFor="pf-due">납품 예정일</label>
                            <input
                                id="pf-due"
                                type="date"
                                value={due}
                                onChange={(e) => setDue(e.target.value)}
                            />
                        </div>

                        <div className="pf-field">
                            <label>프로젝트 상태</label>
                            <div className="pf-status-box">
                                <span className="pf-status-dot"></span>
                                대기
                                <span className="pf-status-hint">최초 등록 상태</span>
                            </div>
                        </div>

                    </div>

                    <div className="pf-footer">
                        <p>
                            <span className="pf-required">*</span> 필수 입력 항목
                        </p>

                        <div className="pf-actions">
                            <button
                                type="button"
                                className="pf-btn pf-btn-cancel"
                                onClick={() => props.setPage('list')}
                            >
                                취소
                            </button>

                            <button
                                type="submit"
                                className="pf-btn pf-btn-submit"
                            >
                                + 프로젝트 등록
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
}

export default ProjectForm;
