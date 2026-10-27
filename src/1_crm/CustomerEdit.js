import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import getCustomers from "./CustomerService";
import { customers } from "../data/mockData";
function CustomerEdit() {

    const location = useLocation()


    const params = new URLSearchParams(location.search)
    const customerId = Number(params.get("id"))

    const selectedCustomer = window.opener.getCurrentCustomers().find((customer) =>
        customer.id === customerId)




    const [formData, setFormData] = useState(selectedCustomer || {})

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
    console.log(location.search)


    function updateCustomer(e){
        e.preventDefault()

        console.log(formData)
        window.opener.saveEditedCustomer(formData)
        window.close()
    }


    return (
        <form onSubmit={updateCustomer}>
            <div>
                {fields.map((field) => (
                    <div key={field.name}>
                        <label>{field.label}</label>
                        <input value={formData[field.name] || ""}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    [field.name]: e.target.value
                                })} />
                    </div>
                ))}

                <button type="submit">수정완료</button>
            </div>
        </form>
    )


}

export default CustomerEdit;