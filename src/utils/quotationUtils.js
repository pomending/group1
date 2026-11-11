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