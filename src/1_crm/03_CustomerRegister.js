//고객 등록 화면
import react, { useState } from "react";
import { useERP } from "../context/ERPContext";
import {
    validateCustomer, formatBusinessNumber,
    validateBusinessNumber, validateDuplicateBusinessNumber,
} from "../utils/customerUtils";
import {
    validatePhone, formatPhone, validateEmail,
    validateCompanyName, validateCustomerManager, validateMemo
} from "../utils/consultationUtils";
import "./03_CustomerForm.css";


function CustomerRegister() {

    const { employees, addCustomer, customers } = useERP();


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

        //.toLocaleDateString("sv-SE"); 문자열 형태의 날짜로 변환하는 메서드 ,괄호안에 코드를 쓰면 국가나 언어별 형식으로 가져올수있게 함
        const createdAt = new Date().toLocaleDateString("sv-SE");

        //필수입력값 유효성검사
        if (!validateCustomer(customerData)) {
            return;
        }
        if (customerData.employeeId == null || customerData.employeeId === "") {
            alert("필수 등록정보(내부 담당자)를 확인해주세요.");
            return;
        }

        if (!validateDuplicateBusinessNumber(
            customerData.businessNumber,
            customers,
            null
        )) {
            return;
        }

        //사업자등록번호 10자리검사
        if (!validateBusinessNumber(customerData.businessNumber, customers, null)) {
            return;
        }
        //전화번호 10~11자리 검사
        if (!validatePhone(customerData.phone)) {

            return;
        }

        //이메일 유효성 검사
        if (!validateEmail(customerData.email)) {
            return;
        }

        //고객사명 제한 20자 검사

        if (!validateCompanyName(customerData.companyName)) {
            return;
        }

        //메모 1000자 제한 검사
        if (!validateMemo(customerData.memo)) {
            return;
        }

        window.opener.addCustomer({
            ...customerData,
            createdAt: createdAt
        });

        alert("고객이 등록되었습니다.");
        window.close();
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
                        .filter((employee) => employee.department === "영업팀")
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