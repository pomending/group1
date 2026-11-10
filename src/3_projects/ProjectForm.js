import { useState } from "react";
import { useERP } from "../context/ERPContext";
import { formatQuotationId } from "../utils/formatUtils";
import ProjectQuotationInfo from "./ProjectQuotationInfo";
import { getProjectManagers } from "../utils/projectUtils";

function ProjectForm(props) {

    const { projects, addProject, customers, employees, quotations, products } = useERP()
    const [projectName, setProjectName] = useState('');
    const [managerId, setManagerId] = useState('');
    const [selQuotation, setSelQuotation] = useState('');
    const [description, setDescription] = useState("");

    const selectedQuotation = quotations.find(
        q => q.id === Number(selQuotation)
    )

    const selectedProduct = products.find(
        product => product.id === selectedQuotation?.productId
    );

    const projectManagers = getProjectManagers(employees)

    const handleSubmit = (e) => {

        e.preventDefault();

        const result = addProject({
            name: projectName.trim(),
            managerId: Number(managerId),
            startDate: new Date().toLocaleDateString('sv-SE'),
            completedDate: null,
            description: description.trim(),
            quotationId: Number(selQuotation)
        });

        if (!result.ok) {
            alert(result.message);
            return;
        }

        props.setPage('list');
    };

    return (
        <div className="pf-page pj-page">
            <div className="pf-container pj-container">

                <button
                    type="button"
                    className="pf-back pj-back"
                    onClick={() => props.setPage('list')}
                >
                    <span>←</span> 프로젝트 목록으로
                </button>

                <div className="pf-heading">
                    <div>
                        <p className="pf-eyebrow pj-eyebrow">PROJECT MANAGEMENT</p>
                        <h2>새 프로젝트 등록</h2>
                        <p className="pf-subtitle pj-subtitle">
                            새로운 굿즈 제작 프로젝트의 정보를 입력하세요.
                        </p>
                    </div>
                    <span className="pf-heading-tag">+ 신규 등록</span>
                </div>

                <form className="pf-card pj-card" onSubmit={handleSubmit}>

                    <div className="pf-card-header pj-card-heading">
                        <div>
                            <span className="pf-section-num pj-eyebrow">
                                PROJECT INFO
                            </span>
                            <h3>프로젝트 기본 정보</h3>
                            <p>프로젝트 진행에 필요한 정보를 등록합니다.</p>
                        </div>
                    </div>

                    <div className="pf-fields">

                        <div className="pf-field pf-full pj-field pj-full">
                            <label htmlFor="pf-name">
                                프로젝트명 <span className="pf-required pj-required">*</span>
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
                                    .filter(q => q.status === "승인 완료" &&
                                        !projects.some(p => p.quotationId === q.id)
                                    )
                                    .map(q => (
                                        <option key={q.id} value={q.id}>
                                            {formatQuotationId(q.id)} | {
                                                customers.find(c => c.id === q.customerId)?.companyName
                                                ?? `고객 ID ${q.customerId}`
                                            }
                                        </option>
                                    ))}
                            </select>

                            {selectedQuotation && (
                                <ProjectQuotationInfo
                                    quotation={selectedQuotation}
                                    product={selectedProduct}
                                    customer={customers.find(c => c.id === selectedQuotation.customerId)} />
                            )}

                        </div>

                        <div className="pf-field pj-field">
                            <label htmlFor="pf-manager">담당자</label>
                            <select
                                id="pf-manager"
                                name="managerId"
                                value={managerId}
                                onChange={(e) => setManagerId(e.target.value === '' ? '' : Number(e.target.value))}
                            >
                                <option value="" disabled>담당자를 선택하세요</option>

                                {projectManagers.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="pf-field pj-field">
                            <label>납품 예정일</label>
                            <input
                                type="date"
                                value={selectedQuotation?.deliveryDate ?? ""}
                                readOnly
                            />
                        </div>

                        <div className="pf-field pj-field">
                            <label>프로젝트 상태</label>
                            <div className="pf-status-box">
                                <span className="pf-status-dot"></span>
                                대기
                                <span className="pf-status-hint">최초 등록 상태</span>
                            </div>
                        </div>

                        <div className="pf-field pf-full pj-field pj-full">
                            <label htmlFor="pf-description">프로젝트 메모 (선택)</label>
                            <textarea
                                id="pf-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="프로젝트 관련 요청사항이나 특이사항을 입력하세요."
                                rows={4}
                                maxLength={500}
                            />
                        </div>

                    </div>

                    <div className="pf-footer pj-footer">
                        <p>
                            <span className="pf-required pj-required">*</span> 필수 입력 항목
                        </p>

                        <div className="pf-actions pj-actions">
                            <button
                                type="button"
                                className="pf-btn pf-btn-cancel pj-btn"
                                onClick={() => props.setPage('list')}
                            >
                                취소
                            </button>

                            <button
                                type="submit"
                                className="pf-btn pf-btn-submit pj-btn pj-primary"
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
