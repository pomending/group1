//견적 상태
export const QUOTATION_STATUS = ["승인 대기", "승인 완료", "반려"]

//공급가액 계산
export const totalPrice = (quantity, price) => {
    return quantity * price
}

export function getQuotationPriceDetails(quotation) {

    const baseUnitPrice = Number(quotation.baseUnitPrice);

    const options = Array.isArray(quotation.options)
        ? quotation.options
        : [];

    const optionUnitPrice = options.reduce(
        (sum, option) => sum + Number(option.unitPrice ?? 0),
        0
    );


    return {
        baseUnitPrice,
        options,
        optionUnitPrice,
        finalUnitPrice: baseUnitPrice + optionUnitPrice
    };
}

//견적 데이터 유효성 검사
export const validateQuotation = (quotation) => {

    //임시 저장은 필수 입력 검사 제외
    if (quotation.status === "임시 저장") {
        return { ok: true };
    }

    if (!quotation.customerId) {
        return { ok: false, message: "거래처를 선택해주세요." }
    }

    if (!quotation.productId) {
        return { ok: false, message: "상품을 선택해주세요." }
    }

    if (!quotation.employeeId) {
        return { ok: false, message: "내부 담당자를 선택해주세요." };
    }

    if (!quotation.createdAt) {
        return { ok: false, message: "작성일을 입력해주세요." };
    }

    //Number.isFinite()은 정상적인 숫자인지 확인해준다.
    if (!Number.isFinite(Number(quotation.quantity)) ||
        Number(quotation.quantity) <= 0) {
        return { ok: false, message: "수량은 0보다 커야 합니다." }
    }

    // if(!Number.isFinite(Number(quotation.unitPrice)) ||
    //     Number(quotation.unitPrice) <= 0){
    //         return {ok: false, message: "단가는 0보다 커야 합니다."}
    // }

    if (!Number.isFinite(quotation.baseUnitPrice) ||
        quotation.baseUnitPrice <= 0) {
        return {
            ok: false,
            message: "기본 단가는 0보다 커야 합니다."
        };
    }

    if (!Array.isArray(quotation.options)) {
        return {
            ok: false,
            message: "올바르지 않은 옵션 정보입니다."
        };
    }

    const hasInvalidOption = quotation.options.some(option =>
        typeof option?.name !== "string" ||
        !option.name.trim() ||
        !Number.isFinite(option.unitPrice)
    );

    if (hasInvalidOption) {
        return {
            ok: false,
            message: "옵션 이름과 단가를 확인해주세요."
        };
    }

    const finalUnitPrice = getQuotationPriceDetails(quotation).finalUnitPrice;

    if (!Number.isFinite(finalUnitPrice) || finalUnitPrice <= 0) {
        return {
            ok: false,
            message: "옵션을 포함한 최종 단가는 0보다 커야 합니다."
        };
    }

    //결제 방법 유효성 검사
    if (!quotation.paymentMethod) {
        return { ok: false, message: "결제 방법을 선택해주세요." }
    }

    //견적 유효기간 필수 입력 검사
    if (!quotation.validUntil) {
        return { ok: false, message: "견적 유효기간을 입력해주세요." }
    }

    //견적 유효기간 날짜 검사
    if (quotation.validUntil < quotation.createdAt) {
        return { ok: false, message: "견적 유효기간은 작성일 이후여야 합니다." }
    }

    //납품 예정일 필수 입력 검사
    if (!quotation.deliveryDate) {
        return { ok: false, message: "납품 예정일을 입력해주세요." }
    }

    //납품 예정일 날짜 검사
    if (quotation.deliveryDate < quotation.createdAt) {
        return { ok: false, message: "납품 예정일은 작성일 이후여야 합니다." };
    }

    return { ok: true };

}