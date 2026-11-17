//고객 등록 화면
import React, { useState } from "react";
import { useERP } from "../context/ERPContext";
import { formatBusinessNumber } from "../utils/customerUtils";
import { formatPhone } from "../utils/consultationUtils";
import "./03_CustomerForm.css";

function CustomerRegister({ onClose }) {

    const { employees, addCustomer } = useERP();


    //고객정보를 저장할 state
    const [customerData, setCustomerData] = useState({
        companyName: "",
        businessNumber: "",
        customerManager: "",
        employeeId: null,
        phone: "",
        email: "",
        address: "",
        createdAt: "",
        memo: ""
    })

    function registerCustomer(e) {
        e.preventDefault();
    
        const createdAt = new Date().toLocaleDateString("sv-SE");
    
        // ERPContext에서 나머지 고객 정보 검증
        const result = addCustomer({
            ...customerData,
            createdAt: createdAt,
            registrationSource: "save"
        });
    
        if (!result.ok) {
            alert(result.message);
            return;
        }
    
        alert("고객이 등록되었습니다.");
        onClose();
    }

    return (
        <div className="crm-form-page">
            <div className="crm-form-header">
                <h2>고객정보 등록</h2>
            </div>
            <div className="crm-form-field">
                <label>고객사명 <span className="crm-required">*</span></label>
                <input value={customerData.companyName}
                    onChange={(e) => (
                        setCustomerData({ ...customerData, companyName: e.target.value })
                    )} />
            </div>

            <div className="crm-form-field">
                <label>사업자등록번호</label>
                <input value={customerData.businessNumber}
                    onChange={(e) => (
                        setCustomerData({
                            ...customerData,
                            businessNumber: formatBusinessNumber(e.target.value)
                        })
                    )} />
            </div>

            <div className="crm-form-field">
                <label>고객사 담당자명 <span className="crm-required">*</span></label>
                <input value={customerData.customerManager}
                    onChange={(e) =>
                        setCustomerData({ ...customerData, customerManager: e.target.value })
                    } />
            </div>

            <div className="crm-form-field">
                <label>연락처 <span className="crm-required">*</span></label>
                <input value={customerData.phone}
                    onChange={(e) =>
                        setCustomerData({ ...customerData, phone: formatPhone(e.target.value) })
                    } />
            </div>

            <div className="crm-form-field">
                <label>이메일</label>
                <input value={customerData.email}
                    onChange={(e) =>
                        setCustomerData({ ...customerData, email: e.target.value })
                    } />
            </div>

            <div className="crm-form-field">
                <label>주소</label>
                <input value={customerData.address}
                    onChange={(e) =>
                        setCustomerData({ ...customerData, address: e.target.value })
                    } />
            </div>

            <div className="crm-form-field">
                <label>메모</label>
                <input value={customerData.memo}
                    onChange={(e) =>
                        setCustomerData({ ...customerData, memo: e.target.value })
                    } />
            </div>

            <div className="crm-form-field">
                <label>담당자 <span className="crm-required">*</span></label>
                <select value={(customerData.employeeId) ?? ""}
                    onChange={(e) =>
                        setCustomerData({
                            ...customerData,
                            employeeId: e.target.value === "" ? null : Number(e.target.value)
                        })
                    }>
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

            <div>
                <button onClick={registerCustomer}>고객 등록</button>
            </div>


        </div >

    )
}
export default CustomerRegister