// 기존 고객정보 조회 및 수정, 입력값 검증, 수정 내용 저장
import "./03_CustomerForm.css";
import React, { useState } from "react";
import { useERP } from "../context/ERPContext";
import {
    formatBusinessNumber, validateBusinessNumber,
    validateCustomer, validateDuplicateBusinessNumber
} from "../utils/customerUtils";
import {
    validatePhone, formatPhone,
    validateEmail, validateCompanyName,
    validateCustomerManager, validateMemo
} from "../utils/consultationUtils";

function CustomerEdit({ customerId, onClose }) {

    const { employees, customers, saveEditedCustomer } = useERP();

    // 수정할 고객 정보 조회
    const CustomerData = customers.find(
        customer => customer.id === customerId
    );

    // 수정할 고객 정보 관리
    const [EditingCustomerData, setEditingCustomerData] =
        useState(CustomerData || {});

    if (!CustomerData) {
        return (
            <div className="crm-form-page">
                <p>존재하지 않는 고객입니다.</p>
                <button onClick={onClose}>닫기</button>
            </div>
        );
    }


    function updateCustomer(e) {
        e.preventDefault();

        if (!validateBusinessNumber(EditingCustomerData.businessNumber)) {
            return;
        }
        if (!validateDuplicateBusinessNumber(EditingCustomerData.businessNumber, customers, EditingCustomerData.id)) {
            return;
        }

        if (!validateCustomer(EditingCustomerData)) {
            return;
        }

        if (EditingCustomerData.employeeId == null || EditingCustomerData.employeeId === "") {
            alert(" 담당자를 확인해주세요.");
            return;
        }
        if (!validatePhone(EditingCustomerData.phone)) {
            return;

        }

        if (!validateEmail(EditingCustomerData.email)) {
            return;
        }
        if (!validateCompanyName(EditingCustomerData.companyName)) {
            return;
        }
        if (!validateCustomerManager(EditingCustomerData.customerManager)) {
            return;
        }
        if (!validateMemo(EditingCustomerData.memo)) {
            return;
        }

        const result = saveEditedCustomer(EditingCustomerData);

        if (!result.ok) {
            alert(result.message);
            return;
        }

        alert("고객의 정보가 수정되었습니다.");
        onClose();
    }

    return (
        <div className="crm-form-page">

            <div className="crm-form-header">
                <h2>고객정보 수정</h2>
                <p>기존 고객사 정보를 수정해 주세요.</p>
            </div>


            <form className="crm-form" onSubmit={updateCustomer}>

                <div className="crm-form-field">
                    <label>고객사명 <span className="crm-required">*</span></label>
                    <input value={EditingCustomerData.companyName}
                        onChange={(e) => (
                            setEditingCustomerData({ ...EditingCustomerData, companyName: e.target.value })
                        )} />
                </div>

                <div className="crm-form-field">
                    <label>사업자등록번호</label>
                    <input value={EditingCustomerData.businessNumber}
                        onChange={(e) => (
                            setEditingCustomerData({ ...EditingCustomerData, businessNumber: formatBusinessNumber(e.target.value) })
                        )} />
                </div>

                <div className="crm-form-field">
                    <label>고객사 담당자 <span className="crm-required">*</span></label>
                    <input value={EditingCustomerData.customerManager}
                        onChange={(e) => (
                            setEditingCustomerData({ ...EditingCustomerData, customerManager: e.target.value })
                        )} />
                </div>

                <div className="crm-form-field">
                    <label>연락처 <span className="crm-required">*</span></label>
                    <input value={EditingCustomerData.phone}
                        onChange={(e) => (
                            setEditingCustomerData({ ...EditingCustomerData, phone: formatPhone(e.target.value) })
                        )} />
                </div>

                <div className="crm-form-field">
                    <label>이메일</label>
                    <input value={EditingCustomerData.email}
                        onChange={(e) => (
                            setEditingCustomerData({ ...EditingCustomerData, email: e.target.value })
                        )} />
                </div>

                <div className="crm-form-field">
                    <label>주소</label>
                    <input value={EditingCustomerData.address}
                        onChange={(e) => (
                            setEditingCustomerData({ ...EditingCustomerData, address: e.target.value })
                        )} />
                </div>

                <div className="crm-form-field">
                    <label>메모</label>
                    <textarea
                        value={EditingCustomerData.memo}
                        onChange={(e) => (
                            setEditingCustomerData({ ...EditingCustomerData, memo: e.target.value })
                        )} />
                </div>

                <div className="crm-form-field">
                    <label>담당자<span className="crm-required">*</span></label>
                    <select value={EditingCustomerData.employeeId ?? ""}
                        onChange={(e) => (
                            setEditingCustomerData({
                                ...EditingCustomerData,
                                employeeId: e.target.value === "" ? null : Number(e.target.value)
                            })
                        )}>
                        <option value="">미배정</option>
                        {employees
                            .filter(employee =>
                                employee.department === "영업팀" &&
                                employee.status === "재직"
                            )
                            .map((employee) =>
                                <option key={employee.id}
                                    value={employee.id}>{employee.name}</option>)}

                    </select>
                </div>

                <button type="submit">수정완료</button>

            </form>

        </div>
    );
}

export default CustomerEdit;
