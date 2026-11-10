//필수 입력 항목 검사 
export function validateConsultation(consultationData) {
    if ((consultationData.companyName || "").trim() === ""
        || (consultationData.customerManager || "").trim() === ""
        || (consultationData.phone || "").trim() === "") {
        alert("필수등록정보(고객사명,고객사 담당자명, 연락처)를 확인해주세요")
        return false;
    }
    return true;
}

//이메일 검사
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || email.trim() === "") {
        return true;
    } else if (emailRegex.test(email) === false) {
        alert("이메일 형식이 올바르지 않습니다.")
        return false;
    } else {
        return true;
    }
}

//고객사명 최대글자 수 제한
export function validateCompanyName(companyName) {
    if ((companyName || "").length > 20) {
        alert("고객사명은 최대 20자까지 입력 할수 있습니다.")
        return false;
    }
    return true;
}

//고객사 담당자명 최대글자 수 제한
export function validateCustomerManager(customerManager) {
    if ((customerManager || "").length > 10) {
        alert("고객사 담당자명은 최대 10자까지 입력할 수 있습니다.")
        return false;
    }
    return true;
}
// 메모 최대글자 수 제한
export function validateMemo(memo) {
    if ((memo || "").length > 1000) {
        alert("메모는 최대 1,000자까지 입력할 수 있습니다.")
        return false;
    }
    return true;
}


//전화번호 입력중 형식변환(-표시)
export function formatPhone(phone) {
    const numbers = (phone || "").replace(/[^0-9]/g, "").slice(0, 11);
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

//전화번호 입력값의 길이검사
export function validatePhone(phone) {
    const numbers = (phone || "").replace(/[^0-9]/g, "");
    if (numbers.startsWith("02")) {
        if (numbers.length === 9 || numbers.length === 10) {
            return true;
        } else {
            alert("전화번호 형식이 올바르지 않습니다.")
            return false;
        }
    }
    if (numbers.startsWith("010")) {
        if (numbers.length === 11) {
            return true;
        }

    }
    const prefixes = [
        "011", "016", "017", "018", "019",
        "031", "032", "033",
        "041", "042", "043", "044",
        "051", "052", "053", "054", "055",
        "061", "062", "063", "064"
    ];

    if ((numbers.length === 10 || numbers.length === 11)
        && prefixes.some(prefix => numbers.startsWith(prefix))) {
        return true;
    }
    alert("전화번호 형식이 올바르지 않습니다.")
    return false;

}
//기존문의와 동일한 고객사와연락처를 가진 정보를 등록할경우
export function validateDuplicateConsultation(newConsultation, consultation) {
    const isDuplicate = consultation.some(item =>
        item.companyName === newConsultation.companyName
        && item.phone === newConsultation.phone
        && item.id !== newConsultation.id)
    if (isDuplicate) {
        return window.confirm(
            "동일한 고객사와 연락처로 등록된 문의가 있습니다. 계속 등록하시겠습니까?"
        )
    }
    return true;
}