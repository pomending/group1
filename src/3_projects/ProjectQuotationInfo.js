import { formatPrice, formatQuotationId } from "../utils/formatUtils"
import { totalPrice } from "../utils/quotationUtils";

function ProjectQuotationInfo({ quotation, product, customer }) {

    if(!quotation) return null;

    const quotationSupply = totalPrice(Number(quotation.quantity),Number(quotation.unitPrice));

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
                            <th>상품명</th>
                            <th>수량</th>
                            <th>단가</th>
                            <th>공급가액</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{product?.productName ?? "상품 정보 없음"}</td>
                            <td>{Number(quotation.quantity).toLocaleString()}개</td>
                            <td>{formatPrice(quotation.unitPrice)}</td>
                            <td>{formatPrice(quotationSupply)}</td>
                        </tr>
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