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

    const fields = [
        { name: "companyName", label: "업체명" },
        { name: "businessNumber", label: "사업자등록번호" },
        { name: "customerManager", label: "고객사 담당자명" },
        { name: "phone", label: "연락처" },
        { name: "email", label: "이메일" },
        { name: "address", label: "주소" },
        { name: "createdAt", label: "등록일" },
        { name: "memo", label: "메모" },
        { name: "employeeName", label: "담당자" }
    ];

    function registerCustomer(e) {
        e.preventDefault()
        console.log(formData)
        window.opener.addCustomer(formData)
        window.close()
    }




    return (

        <div>

            <form onSubmit={registerCustomer}>
                {fields.map((field) => (
                    <div key={field.name}>
                        <label>{field.label}</label>
                        <input value={formData[field.name]}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    [field.name]: e.target.value
                                })} />
                    </div>
                ))}

                <button type="submit">등록</button>

            </form>

        </div>
    )
}
export default CustomerRegister