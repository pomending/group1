//고객 등록 화면
import react, { useState } from "react";
function CustomerRegister() {

    //고객정보를 저장할 state
    const [formData, setFormData] = useState({
        companyName: "",
        businessNumber: "",
        customerManager: "",
        employeeName: "",
        phone: "",
        email: "",
        address: "",
        createdAt: "",
        memo: ""
    })







    return (

        <div>

            고객 등록 화면<br />
            <label>업체명</label>
            <input
                value={formData.companyName}
                onChange={(e) => setFormData({
                    ...formData,
                    companyName: e.target.value
                })} /><br />

            <label>사업자등록번호</label>
            <input
                value={formData.businessNumber}
                onChange={(e) => setFormData({
                    ...formData,
                    businessNumber: e.target.value
                })} /><br />


            <label>고객사 담당자명</label>
            <input
                value={formData.customerManager}
                onChange={(e) => setFormData({
                    ...formData,
                    customerManager: e.target.value
                })} /><br />

            <label>연락처</label>
            <input
                value={formData.phone}
                onChange={(e) => setFormData({
                    ...formData,
                    phone: e.target.value
                })} /><br />

            <label>이메일</label>
            <input
                value={formData.email}
                onChange={(e) => setFormData({
                    ...formData,
                    email: e.target.value
                })} /><br />

            <label>주소</label>
            <input
                value={formData.address}
                onChange={(e) => setFormData({
                    ...formData,
                    address: e.target.value
                })} /><br />

            <label>등록일</label>
            <input
                value={formData.createdAt}
                onChange={(e) => setFormData({
                    ...formData,
                    createdAt: e.target.value
                })} /><br />

            <label>메모</label>
            <input
                value={formData.memo}
                onChange={(e) => setFormData({
                    ...formData,
                    memo: e.target.value
                })} /><br />

            <label>담당자</label>
            <input
                value={formData.employeeName}
                onChange={(e) => setFormData({
                    ...formData,
                    employeeName: e.target.value
                })} /><br />

            <button>등록</button>



        </div>
    )
}
export default CustomerRegister