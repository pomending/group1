// 기존 고객정보 조회 및 수정, 입력값 검증, 수정 내용 저장
import "./03_CustomerForm.css";
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useERP } from "../context/ERPContext";

function CustomerEdit() {

    const { employees } = useERP();

    //현재 페이지의 URL 주소정보
    const location = useLocation();
    //URL에서 필요한 값을 가져오기 위한 객체
    const params = new URLSearchParams(location.search);
    //URL에서 가져온 수정할 대상의 고객ID
    const EditCustomerId = Number(params.get("id"));
    //고객 ID와 일치하는 기존 고객정보
    const CustomerData = window.opener.getCurrentCustomers().find(
        customer => customer.id === EditCustomerId
    );

    const [EditingCustomerData, setEditingCustomerData] = useState(CustomerData || {});



    function updateCustomer(e) {
        e.preventDefault();

        if (
            !EditingCustomerData.companyName?.trim() ||
            !EditingCustomerData.customerManager?.trim() ||
            !EditingCustomerData.phone?.trim()
        ) {
            alert("필수등록정보(고객사명, 고객사 담당자명, 연락처)를 입력해주세요.");
            return;
        }

        const businessNumbers = (EditingCustomerData.businessNumber || "").replace(/-/g, "");

        if (businessNumbers !== "" && businessNumbers.length !== 10) {
            alert("사업자등록번호를 확인해 주세요.");
            return;
        }

        const phoneNumbers = EditingCustomerData.phone.replace(/-/g, "");

        if (
            (phoneNumbers.startsWith("02") &&
                phoneNumbers.length !== 9 &&
                phoneNumbers.length !== 10) ||
            (!phoneNumbers.startsWith("02") &&
                phoneNumbers.length !== 10 &&
                phoneNumbers.length !== 11)
        ) {
            alert("연락처를 확인해주세요.");
            return;
        }


        window.opener.saveEditedCustomer(EditingCustomerData);
        alert("고객의 정보가 수정되었습니다.")
        window.close();
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
                            setEditingCustomerData({ ...EditingCustomerData, businessNumber: e.target.value })
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
                            setEditingCustomerData({ ...EditingCustomerData, phone: e.target.value })
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
                    <input value={EditingCustomerData.memo}
                        onChange={(e) => (
                            setEditingCustomerData({ ...EditingCustomerData, memo: e.target.value })
                        )} />
                </div>

                <div className="crm-form-field">
                    <label>내부 담당자</label>
                    <select value={EditingCustomerData.employeeId ?? ""}
                        onChange={(e) => (
                            setEditingCustomerData({
                                ...EditingCustomerData,
                                employeeId: e.target.value === "" ? null : Number(e.target.value)
                            })
                        )}>
                        <option value="">미배정</option>
                        {employees
                            .filter((employee) => (employee.department === "영업팀"))
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
