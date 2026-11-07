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
//전화번호 입력값의 길이검사
export function validatePhone(phone) {
    const numbers = phone.replace(/[^0-9]/g, "");
    if (numbers.startsWith("02")) {
        if (numbers.length === 9 || numbers.length === 10) {
            return true;
        } else {
            alert("전화번호 형식이 올바르지 않습니다.")
            return false;
        }
    }
    if (numbers.length === 10 || numbers.length === 11) {
        return true;
    }
    alert("전화번호 형식이 올바르지 않습니다.")
    return false;

}



//전화번호 입력중 형식변환
export function formatPhone(phone) {
    const numbers = phone.replace(/[^0-9]/g, "").slice(0, 11);
    //02로 시작되는 번호
    if (numbers.startsWith("02")) {
        if (numbers.length === 10) {
            return numbers.slice(0, 2) + "-" + numbers.slice(2, 6) + "-" + numbers.slice(6, 10);
        }
        if (numbers.length === 9) {
            return numbers.slice(0, 2) + "-" + numbers.slice(2, 5) + "-" + numbers.slice(5, 9);
        }
        if (numbers.length > 2) {
            return numbers.slice(0, 2) + "-" + numbers.slice(2)
        } else {
            return numbers;
        }
        //010으로 시작되는 번호
    }
    if (numbers.length === 11) {
        return numbers.slice(0, 3) + "-" + numbers.slice(3, 7) + "-" + numbers.slice(7, 11)
    }
    if (numbers.length === 10) {
        return numbers.slice(0, 3) + "-" + numbers.slice(3, 6) + "-" + numbers.slice(6, 10);
    }

    if (numbers.length > 3) {
        return numbers.slice(0, 3) + "-" + numbers.slice(3);
    } else {
        return numbers;
    }


}

//컬럼선택으로 정렬하기 data:정렬할 고객또는 문의배열 sortKey:정렬기준컬럼 sortOrder:오름차순,내림차순
export function sortData(data, sortKey, sortOrder) {

    const copiedData = [...data]
}