//고객 등록 화면
import react, { useState } from "react";
import "./03_CustomerForm.css";
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
        { name: "companyName", label: "고객사명" },
        { name: "businessNumber", label: "사업자등록번호" },
        { name: "customerManager", label: "고객사 담당자명" },
        { name: "phone", label: "연락처" },
        { name: "email", label: "이메일" },
        { name: "address", label: "주소" },
        { name: "memo", label: "메모" },
        { name: "employeeName", label: "담당자" }
    ];

    function registerCustomer(e) {
        e.preventDefault()



        if (formData.companyName.trim() === "" || formData.customerManager.trim() === ""
            || formData.phone.trim() === "") {
            alert("필수등록정보(고객사명, 고객사 담당자명, 연락처)를 입력해주세요.");
            return;

        }

        if (
            formData.businessNumber !== "" &&
            formData.businessNumber.replace(/-/g, "").length !== 10
        ) {
            alert("사업자등록번호를 확인해 주세요.");
            return;
        }


        const phoneNumbers = formData.phone.replace(/-/g, "");

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
        const today = new Date();

        const createdAt =
            today.getFullYear() + "-" +
            String(today.getMonth() + 1).padStart(2, "0") + "-" +
            String(today.getDate()).padStart(2, "0");

        window.opener.addCustomer({
            ...formData,
            createdAt: createdAt
        });

        window.close();


    }





    return (


        <div className="crm-form-page">
            <div className="crm-form-header">
                <h2>고객 등록</h2>
                <p>신규 고객사 정보를 입력해 주세요.</p>
            </div>
            <form className="crm-form" onSubmit={registerCustomer}>
                {fields.map((field) => (
                    <div className="crm-form-field" key={field.name}>
                        <label>
                            {field.label}
                            {["companyName", "customerManager", "phone"].includes(field.name) && (
                                <span className="crm-required"> *</span>
                            )}
                        </label>

                        <input
                            value={formData[field.name]}
                            onChange={(e) => {
                                const value = e.target.value;

                                if (field.name === "businessNumber" || field.name === "phone") {
                                    if (/[^0-9]/.test(value.replace(/-/g, ""))) {
                                        alert(
                                            field.name === "businessNumber"
                                                ? "사업자등록번호는 숫자만 입력 가능합니다."
                                                : "연락처는 숫자만 입력 가능합니다."
                                        );
                                        return;
                                    }
                                }

                                let formatted = value;

                                if (field.name === "businessNumber") {
                                    const numbers = value.replace(/-/g, "").slice(0, 10);

                                    formatted = numbers;

                                    if (numbers.length > 5) {
                                        formatted = numbers.slice(0, 3) + "-"
                                            + numbers.slice(3, 5) + "-"
                                            + numbers.slice(5);
                                    } else if (numbers.length > 3) {
                                        formatted = numbers.slice(0, 3) + "-"
                                            + numbers.slice(3);
                                    }
                                }

                                let formattedPhone = value;

                                if (field.name === "phone") {
                                    const phoneNumbers = value.replace(/-/g, "").slice(0, 11);

                                    formattedPhone = phoneNumbers;

                                    if (phoneNumbers.startsWith("02")) {
                                        if (phoneNumbers.length > 6) {
                                            formattedPhone = phoneNumbers.slice(0, 2) + "-"
                                                + phoneNumbers.slice(2, -4) + "-"
                                                + phoneNumbers.slice(-4);
                                        } else if (phoneNumbers.length > 2) {
                                            formattedPhone = phoneNumbers.slice(0, 2) + "-"
                                                + phoneNumbers.slice(2);
                                        }
                                    } else {
                                        if (phoneNumbers.length > 7) {
                                            formattedPhone = phoneNumbers.slice(0, 3) + "-"
                                                + phoneNumbers.slice(3, -4) + "-"
                                                + phoneNumbers.slice(-4);
                                        } else if (phoneNumbers.length > 3) {
                                            formattedPhone = phoneNumbers.slice(0, 3) + "-"
                                                + phoneNumbers.slice(3);
                                        }
                                    }
                                }

                                setFormData({
                                    ...formData,
                                    [field.name]: field.name === "businessNumber"
                                        ? formatted
                                        : field.name === "phone"
                                            ? formattedPhone
                                            : value
                                });
                            }}
                        />
                    </div>
                ))}

                <button type="submit">등록</button>
            </form>
        </div>

    )
}
export default CustomerRegister