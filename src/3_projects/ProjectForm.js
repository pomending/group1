
import { useState } from "react";
import "./ProjectForm.css";

function ProjectForm(props) {
    const [projectName, setProjectName] = useState('');
    const [manager, setManager] = useState('김민수');
    const [due, setDue] = useState('');

    const quotations = [
        {
            id: 1,
            customerId: 1,
            status: "승인",
            items: [
                {
                    productId: 1,
                    productName: "스테인리스 텀블러",
                    quantity: 300,
                    unitPrice: 8000
                }
            ]
        },
        {
            id: 2,
            customerId: 2,
            status: "승인",
            items: [
                {
                    productId: 2,
                    productName: "캔버스 에코백",
                    quantity: 500,
                    unitPrice: 5000
                }
            ]
        },
        {
            id: 3,
            customerId: 3,
            status: "승인",
            items: [
                {
                    productId: 3,
                    productName: "세라믹 머그컵",
                    quantity: 400,
                    unitPrice: 6000
                },
                {
                    productId: 2,
                    productName: "캔버스 에코백",
                    quantity: 200,
                    unitPrice: 5000
                }
            ]
        },
        {
            id: 4,
            customerId: 1,
            status: "승인 대기",
            items: [
                {
                    productId: 4,
                    productName: "아크릴 키링",
                    quantity: 1000,
                    unitPrice: 2500
                }
            ]
        },
        {
            id: 5,
            customerId: 4,
            status: "거절",
            items: [
                {
                    productId: 1,
                    productName: "스테인리스 텀블러",
                    quantity: 100,
                    unitPrice: 8500
                }
            ]
        },
        {
            id: 6,
            customerId: 4,
            status: "승인",
            items: [
                {
                    productId: 4,
                    productName: "아크릴 키링",
                    quantity: 800,
                    unitPrice: 2300
                }
            ]
        }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();

        if (projectName.trim() === '') {
            alert('프로젝트명을 입력하세요');
            return;
        }

        props.setProjects(prev => [...prev, {
            id: Math.max(0, ...prev.map(p => Number(p.id) || 0)) + 1,
            projectName: projectName.trim(),
            manager: manager,
            dueDate: due,
            status: '대기'
        }]);

        props.setPage('list');
    };

    return (
        <div className="pf-page">
            {/* aaa */}
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

                            <input value={projectName} onChange={(e)=>{setProjectName(e.target.value)}}/>

                            <label>연결 견적 선택</label>

                            <select>
                                {
                                    quotations.map((q)=>(
                                        <option> {q.qt_id} | {q.qt_name} </option>
                                    ))
                                }
                            </select>

                            <table>
                                <caption>선택된 견적 정보</caption>
                                <tr>
                                    <td></td>
                                </tr>
                            </table>

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
