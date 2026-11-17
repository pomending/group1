import { formatPrice, formatQuotationId } from "../utils/formatUtils"
import { totalPrice, getQuotationPriceDetails } from "../utils/quotationUtils";

function ProjectQuotationInfo({ quotation, product, customer }) {

    if (!quotation) return null;

    const quantity = Number(quotation.quantity);

    const {
        baseUnitPrice,
        options,
        finalUnitPrice
    } = getQuotationPriceDetails(quotation);

    const quotationSupply = totalPrice(quantity, finalUnitPrice);

    const quotationVat = quotationSupply * 0.1;

    const quotationTotal = quotationSupply + quotationVat;

    return (
        <div className="pd-quotation">
            <div className="pd-quotation-top">
                <div>
                    <span>견적 번호</span>
                    <strong>{formatQuotationId(quotation.id)}</strong>
                </div>
                <div>
                    <span>고객사</span>
                    <strong>{customer?.companyName ?? `고객 ID ${quotation.customerId}`}</strong>
                </div>
                <span className="pd-approved pj-approved pj-badge">{quotation.status}</span>
            </div>
            <div className="pd-table-wrap pj-quote-wrap">
                <table className="pd-quotation-table pj-quote-table">
                    <thead>
                        <tr>
                            <th>상품 / 옵션</th>
                            <th>수량</th>
                            <th>개당 단가</th>
                            <th>공급가액</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* 상품 기본 단가 */}
                        <tr className="pj-quote-product-row">
                            <td>{product?.productName ?? "상품 정보 없음"}</td>
                            <td>{quantity.toLocaleString()}개</td>
                            <td>{formatPrice(baseUnitPrice)}</td>
                            <td>{formatPrice(totalPrice(quantity, baseUnitPrice))}</td>
                        </tr>

                        {/* 추가 옵션 */}
                        {options.map((option, index) => {
                            const optionPrice = Number(option.unitPrice);

                            return (
                                <tr className="pj-quote-option-row" key={index}>
                                    <td>
                                        <div className="pj-quote-option-label">
                                            <span className={
                                                optionPrice < 0
                                                    ? "pj-quote-option-badge discount"
                                                    : "pj-quote-option-badge"
                                            }>
                                                {optionPrice < 0 ? "할인" : "옵션"}
                                            </span>
                                            <span>{option.name}</span>
                                        </div>
                                    </td>
                                    <td></td>
                                    <td>{formatPrice(optionPrice)}</td>
                                    <td></td>
                                </tr>
                            );
                        })}

                        {/* 상품 + 옵션 합계 */}
                        {options.length > 0 && (
                            <tr className="pj-quote-total-row">
                                <td><strong>옵션 적용 합계</strong></td>
                                <td></td>
                                <td><strong>{formatPrice(finalUnitPrice)}</strong></td>
                                <td><strong>{formatPrice(quotationSupply)}</strong></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="pj-quotation-amounts">
                <div className="pj-quotation-amount-row">
                    <span>공급가액</span>
                    <strong>{formatPrice(quotationSupply)}</strong>
                </div>
                <div className="pj-quotation-amount-row">
                    <span>부가세 (10%)</span>
                    <strong>{formatPrice(quotationVat)}</strong>
                </div>
                <div className="pj-quotation-amount-row pj-quotation-final">
                    <span>최종 견적 금액</span>
                    <strong>{formatPrice(quotationTotal)}</strong>
                </div>
            </div>
        </div>
    )
}

export default ProjectQuotationInfo