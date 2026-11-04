import { replace } from "react-router-dom";

//고객정보 등록시 필수입력 해야 될값 검사
export function validateCustomer(customerData) {

    if (customerData.companyName.trim() === ""
        || customerData.customerManager.trim() === ""
        || customerData.phone.trim() === "") {

        alert("필수등록정보(고객사명, 고객사 담당자명, 연락처)를 입력해주세요.")
        return false;
    }
    else {
        return true;
    }
}
//
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
//숫자만 남겨서 10자리까지 가져오기
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