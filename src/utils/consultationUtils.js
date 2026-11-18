import { isValidEmail, isValidPhone } from "./validationUtils";

export function validateConsultationForm(data) {

    const companyName = data.companyName ?? "";
    const customerManager = data.customerManager ?? "";
    const phone = data.phone ?? "";
    const email = data.email ?? "";

    // 필수 입력
    if (
        !companyName.trim() ||
        !customerManager.trim() ||
        !phone.trim()
    ) {
        return {
            ok: false,
            message: "필수등록정보(고객사명, 고객사 담당자명, 연락처)를 확인해주세요."
        };
    }

    if (!isValidPhone(phone)) {
        return {
            ok: false,
            message: "전화번호 형식이 올바르지 않습니다."
        };
    }

    // 이메일 형식 (선택 입력)
    if (email && !isValidEmail(email)) {
        return {
            ok: false,
            message: "이메일 형식이 올바르지 않습니다."
        };
    }

    // 글자 수
    if (companyName.length > 20) {
        return {
            ok: false,
            message: "고객사명은 최대 20자까지 입력할 수 있습니다."
        };
    }

    if (customerManager.length > 10) {
        return {
            ok: false,
            message: "고객사 담당자명은 최대 10자까지 입력할 수 있습니다."
        };
    }

    return { ok: true, message: "" };
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