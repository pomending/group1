import { useState } from "react";
import "./ProjectForm.css";
import { useERP } from "../context/ERPContext";

function ProjectForm(props) {

    const [projectName, setProjectName] = useState('');
    const [manager, setManager] = useState(props.employees[0]?.id ?? '');
    const [due, setDue] = useState('');
    const [selQuotation, setSelQuotation] = useState('')
    const { addProject } = useERP()

    const quotations = props.quotations;

    const selectedQuotation = quotations.find(
        q => q.id === Number(selQuotation)
    )

    const formatQuotationId = (id) => {
        return `QT-${String(id).padStart(3, '0')}`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // 데이터에 대한 유효성 체크들
        if (projectName.trim() === '') {
            alert('프로젝트명을 입력하세요');
            return;
        }

        if (!selectedQuotation || selectedQuotation.status !== "승인") {
            alert("승인된 견적을 선택하세요.");
            return;
        }

        if (props.projects.some(p => p.quotationId === selectedQuotation.id)) {
            alert("이미 다른 프로젝트에 연결된 견적입니다.");
            return;
        }

        // 간단한 날짜 관련 유효성 체크들
        const today = new Date().toLocaleDateString('sv-SE');

        if (!due) {
            alert('납품 예정일을 선택하세요.');
            return;
        }

        if (due < today) {
            alert('납품 예정일은 오늘 이후로 설정해주세요.');
            return;
        }

        addProject({
            name: projectName.trim(),
            managerId: manager,
            startDate: new Date().toLocaleDateString('sv-SE'),
            completedDate: null,
            description: "",
            dueDate: due,
            quotationId: Number(selQuotation),
            customerId: selectedQuotation.customerId,
            status: '대기'
        });

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
                                PROJECT INFO
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

                            <input id="pf-name" value={projectName} onChange={(e) => { setProjectName(e.target.value) }} />

                            <label htmlFor="pf-quotation">연결 견적 선택</label>

                            <select
                                id="pf-quotation"
                                name="quotation"
                                value={selQuotation}
                                onChange={(e) => setSelQuotation(e.target.value)}
                            >
                                <option value="">견적을 선택하세요</option>

                                {quotations
                                    .filter(q => q.status === "승인" &&
                                        !props.projects.some(p => p.quotationId === q.id)
                                    )
                                    .map(q => (
                                        <option key={q.id} value={q.id}>
                                            {formatQuotationId(q.id)} | 고객 {q.customerId}
                                        </option>
                                    ))}
                            </select>

                            {selectedQuotation && (
                                <div className="pf-quotation-preview">

                                    <div className="pf-quotation-title">
                                        <h4>선택된 견적 정보</h4>
                                        <span className="pf-approved">승인 완료</span>
                                    </div>

                                    <div className="pf-quotation-meta">
                                        <div>
                                            <span>견적 번호</span>
                                            <strong>
                                                {formatQuotationId(selectedQuotation.id)}
                                            </strong>
                                        </div>

                                        <div>
                                            <span>고객 ID</span>
                                            <strong>
                                                {props.customers.find(c => c.id === selectedQuotation.customerId)?.name
                                                    ?? `고객 ${selectedQuotation.customerId}`}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="pf-quotation-table-wrap">
                                        <table className="pf-quotation-table">
                                            <thead>
                                                <tr>
                                                    <th>상품명</th>
                                                    <th>수량</th>
                                                    <th>단가</th>
                                                    <th>금액</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {selectedQuotation.items.map((product, index) => (
                                                    <tr key={index}>
                                                        <td>{product.productName}</td>
                                                        <td>{product.quantity}개</td>
                                                        <td>
                                                            {product.unitPrice.toLocaleString()}원
                                                        </td>
                                                        <td>
                                                            {(product.quantity * product.unitPrice)
                                                                .toLocaleString()}원
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="pf-quotation-summary">
                                        <span>총 견적 금액</span>
                                        <strong>
                                            {selectedQuotation.items.reduce(
                                                (sum, product) =>
                                                    sum + product.quantity * product.unitPrice,
                                                0
                                            ).toLocaleString()}원
                                        </strong>
                                    </div>

                                </div>
                            )}

                        </div>

                        <div className="pf-field">
                            <label htmlFor="pf-manager">담당자</label>
                            <select
                                id="pf-manager"
                                name="manager"
                                value={manager}
                                onChange={(e) => setManager(Number(e.target.value))}
                            >
                                {props.employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="pf-field">
                            <label htmlFor="pf-due">납품 예정일</label>
                            <input
                                id="pf-due"
                                type="date"
                                // 납품 예정일을 오늘 날짜보다 더 이전 날짜로 할 수 없다
                                min={new Date().toLocaleDateString('sv-SE')}
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
