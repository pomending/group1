import React, { useState } from "react";
import { EMPLOYEE_POSITIONS, EMPLOYEE_STATUSES } from "../utils/employeeUtils";

const emptyEmployee = {
    name: "", department: "", position: "사원", status: "재직",
    email: "", phone: "", hireDate: ""
};

export default function EmployeeForm({ employee, employees, onSave, onCancel }) {
    const isEdit = Boolean(employee);
    const [form, setForm] = useState(() => employee ? {
        name: employee.name || "", department: employee.department || "",
        position: employee.position || "", status: employee.status || "재직",
        email: employee.email || "", phone: employee.phone || "", hireDate: employee.hireDate || ""
    } : { ...emptyEmployee });
    const [error, setError] = useState("");
    const departmentOptions = [...new Set(employees.map(e => e.department).filter(Boolean))].sort();
    const change = e => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError("");
    };
    const submit = e => {
        e.preventDefault();
        const result = onSave(form);
        if (!result.ok) setError(result.message || "직원 정보를 저장하지 못했습니다.");
    };

    return (
        <section className="hr-panel hr-form-panel">
            <div className="hr-section-title">
                <div>
                    <p className="hr-eyebrow">EMPLOYEE {isEdit ? "EDIT" : "REGISTRATION"}</p>
                    <h2>{isEdit ? "직원 정보 수정" : "신규 직원 등록"}</h2>
                    <p className="hr-muted">직원 기본 정보와 재직 상태를 관리합니다.</p>
                </div>
            </div>
            <form onSubmit={submit} noValidate>
                {error && <div className="hr-form-error" role="alert">{error}</div>}
                <h3 className="hr-form-subtitle">기본 정보</h3>
                <div className="hr-form-grid">
                    <label className="hr-field"><span>직원 이름 <em>*</em></span>
                        <input className="hr-input" name="name" value={form.name} onChange={change} placeholder="이름 입력" maxLength={30} required />
                    </label>
                    <label className="hr-field"><span>부서 <em>*</em></span>
                        <input className="hr-input" name="department" value={form.department} onChange={change} list="hr-department-suggestions" placeholder="부서 입력 또는 선택" maxLength={50} required />
                        <datalist id="hr-department-suggestions">{departmentOptions.map(dep => <option key={dep} value={dep} />)}</datalist>
                    </label>
                    <label className="hr-field"><span>직급 <em>*</em></span>
                        <input className="hr-input" name="position" value={form.position} onChange={change} list="hr-position-suggestions" maxLength={30} required />
                        <datalist id="hr-position-suggestions">{EMPLOYEE_POSITIONS.map(position => <option key={position} value={position} />)}</datalist>
                    </label>
                    <label className="hr-field"><span>재직 상태 <em>*</em></span>
                        <select className="hr-input" name="status" value={form.status} onChange={change}>
                            {EMPLOYEE_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                        </select>
                    </label>
                </div>
                <h3 className="hr-form-subtitle">연락처 및 입사 정보</h3>
                <div className="hr-form-grid">
                    <label className="hr-field"><span>이메일 <em>*</em></span>
                        <input className="hr-input" type="email" name="email" value={form.email} onChange={change} placeholder="name@example.com" maxLength={100} required />
                    </label>
                    <label className="hr-field"><span>연락처 <em>*</em></span>
                        <input className="hr-input" type="tel" name="phone" value={form.phone} onChange={change} placeholder="010-1234-5678" maxLength={20} required />
                    </label>
                    <label className="hr-field"><span>입사일 <em>*</em></span>
                        <input className="hr-input" type="date" name="hireDate" value={form.hireDate} max={new Date().toLocaleDateString("sv-SE")} onChange={change} required />
                    </label>
                </div>
                <p className="hr-form-note">* 필수 항목 · 이메일 중복 검사 및 날짜 검사가 적용됩니다.</p>
                <div className="hr-form-actions">
                    <button type="button" className="hr-btn hr-btn-ghost" onClick={onCancel}>취소</button>
                    <button type="submit" className="hr-btn hr-btn-primary">{isEdit ? "변경 사항 저장" : "직원 등록"}</button>
                </div>
            </form>
        </section>
    );
}
