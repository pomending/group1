import { isValidPhone, isValidEmail } from "./validationUtils";

export const CLAIM_TYPES = [
    "제품 불량",
    "수량 부족",
    "배송 문제",
    "기타 문의"
];

export const CLAIM_STATUSES = [
    "접수",
    "처리 중",
    "처리 완료"
];

export const parseOrderNo = (orderNo) => {

    const text = String(orderNo ?? "").trim();

    if (!/^ERP-\d{4,}$/.test(text)) {
        return null;
    }

    const id = Number(text.slice(4));

    if (!Number.isSafeInteger(id) || id <= 0) {
        return null;
    }

    return id;
};

export const validateClaim = (claim) => {

    if (!claim || typeof claim !== "object") {
        return {
            ok: false,
            message: "올바르지 않은 클레임 정보입니다."
        };
    }

    if (
        !Number.isSafeInteger(claim.consultationId) ||
        claim.consultationId <= 0
    ) {
        return {
            ok: false,
            message: "올바르지 않은 주문번호입니다."
        };
    }

    if (
        typeof claim.companyName !== "string" ||
        !claim.companyName.trim()
    ) {
        return {
            ok: false,
            message: "업체명을 입력해 주세요."
        };
    }

    if (
        typeof claim.customerManager !== "string" ||
        !claim.customerManager.trim()
    ) {
        return {
            ok: false,
            message: "작성자 이름을 입력해 주세요."
        };
    }

    if (
        typeof claim.title !== "string" ||
        !claim.title.trim()
    ) {
        return {
            ok: false,
            message: "제목을 입력해 주세요."
        };
    }

    if (
        typeof claim.content !== "string" ||
        !claim.content.trim()
    ) {
        return {
            ok: false,
            message: "내용을 입력해 주세요."
        };
    }

    // 연락처 타입 검사
    if (
        typeof claim.phone !== "string" ||
        typeof claim.email !== "string"
    ) {
        return {
            ok: false,
            message: "올바르지 않은 연락처 정보입니다."
        };
    }

    const phone = claim.phone.trim();
    const email = claim.email.trim();

    // 전화번호 또는 이메일 필수
    if (!phone && !email) {
        return {
            ok: false,
            message: "전화번호 또는 이메일을 입력해 주세요."
        };
    }

    // 전화번호 형식 검사
    if (phone && !isValidPhone(phone)) {
        return {
            ok: false,
            message: "올바른 전화번호를 입력해 주세요."
        };
    }

    // 이메일 형식 검사
    if (email && !isValidEmail(email)) {
        return {
            ok: false,
            message: "올바른 이메일 주소를 입력해 주세요."
        };
    }

    if (!CLAIM_TYPES.includes(claim.inquiryType)) {
        return {
            ok: false,
            message: "올바른 문의 유형을 선택해 주세요."
        };
    }

    if (!CLAIM_STATUSES.includes(claim.status)) {
        return {
            ok: false,
            message: "올바르지 않은 클레임 상태입니다."
        };
    }

    return { ok: true };
};