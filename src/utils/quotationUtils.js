//견적 상태
export const QUOTATION_STATUS = ["승인 대기", "승인 완료", "반려"]

//공급가액 계산
export const totalPrice = (quantity, price) => {
    return quantity * price
}