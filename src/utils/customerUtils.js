//고객정보 등록시 필수입력 해야 될값 검사
export function validateCustomer(customerData) {

    if ((customerData.companyName || "").trim() === ""
        || (customerData.customerManager || "").trim() === ""
        || (customerData.phone || "").trim() === "") {

        alert("필수등록정보(고객사명, 고객사 담당자명, 연락처)를 확인해주세요.")
        return false;
    }
    else {
        return true;
    }
}
//사업자등록번호 입력값의 길이 검사 10자리
export function validateBusinessNumber(businessNumber) {
    if (businessNumber === "") {
        return true;
    }

    const numbers = businessNumber.replace(/-/g, "");

    if (numbers.length !== 10) {
        alert("사업자등록번호를 확인해 주세요.");
        return false;
    }

    return true;
}



// 사업자번호 입력중 형식변환 
export function formatBusinessNumber(businessNumber) {
    const numbers = businessNumber.replace(/[^0-9]/g, "").slice(0, 10);

    if (numbers.length > 5) {
        return numbers.slice(0, 3) + "-" + numbers.slice(3, 5) + "-" + numbers.slice(5);
    }
    if (numbers.length > 3) {
        return numbers.slice(0, 3) + "-" + numbers.slice(3);
    } else {
        return numbers;
    }

}

//사업자등록번호 중복 검사
export function validateDuplicateBusinessNumber(businessNumber, customers, customerId) {
    if(!businessNumber || businessNumber.trim()===""){
        return true;
    }
    const isDuplicate = customers.some(
        item =>
            item.businessNumber === businessNumber
            && item.id !== customerId)
    if (isDuplicate) {
        alert("이미 등록된 사업자등록번호입니다.")
        return false;
    }
    return true;
}

export function validateCustomerData(customer, customers, excludeId = null) {
    const companyName = String(customer.companyName ?? "").trim();
    const customerManager = String(customer.customerManager ?? "").trim();
    const phone = String(customer.phone ?? "").replace(/\D/g, "");
    const email = String(customer.email ?? "").trim();
    const businessNumber = String(customer.businessNumber ?? "").replace(/-/g, "");

    if (!companyName || !customerManager || !phone) {
        return {
            ok: false,
            message: "필수 고객 정보를 확인해주세요."
        };
    }

    if (companyName.length > 20 || customerManager.length > 10) {
        return {
            ok: false,
            message: "고객사명 또는 고객사 담당자명의 길이를 확인해주세요."
        };
    }

    const validPhone = phone.startsWith("02")
        ? [9, 10].includes(phone.length)
        : phone.startsWith("010")
            ? phone.length === 11
            : ["011", "016", "017", "018", "019",
               "031", "032", "033", "041", "042", "043", "044",
               "051", "052", "053", "054", "055",
               "061", "062", "063", "064"].some(prefix =>
                phone.startsWith(prefix)
            ) && [10, 11].includes(phone.length);

    if (!validPhone) {
        return { ok: false, message: "전화번호 형식이 올바르지 않습니다." };
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, message: "이메일 형식이 올바르지 않습니다." };
    }

    if (businessNumber && !/^\d{10}$/.test(businessNumber)) {
        return { ok: false, message: "사업자등록번호를 확인해주세요." };
    }

    if (businessNumber && customers.some(c =>
        c.id !== excludeId &&
        String(c.businessNumber ?? "").replace(/-/g, "") === businessNumber
    )) {
        return { ok: false, message: "이미 등록된 사업자등록번호입니다." };
    }

    return { ok: true };
}


