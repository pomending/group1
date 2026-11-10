import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import {
    formatQuotationId,
    formatCustomerName,
    formatProductName,
    formatPrice
} from "../utils/formatUtils";
import "./QuotationDetail.css"

function QuotationDetail() {

    const { id } = useParams();
    const navi = useNavigate();

    const {
        quotations,
        updateQuotation,
        deleteQuotation,
        customers,
        products,
        employees
    } = useERP();



    // URL의 견적 ID와 일치하는 견적서 찾기
    const quotation = quotations.find(
        q => q.id === Number(id)
    );

    if (!quotation) {
        return <div>견적서를 찾을 수 없습니다.</div>;
    }

    //견적 금액 계산
    const supplyAmount = Number(quotation.quantity || 0)
        * Number(quotation.unitPrice || 0);
    const vat = supplyAmount * 0.1;
    const finalPrice = supplyAmount + vat;

    // 담당자 이름 찾기
    const employee = employees.find(
        e => e.id === quotation.employeeId
    );

    //거래처 찾는 코드
    const customer = customers.find(
        c => c.id === quotation.customerId
    )

    // 승인 완료 처리
    const handleApprove = () => {
        const result = updateQuotation({
            id: quotation.id,
            status: "승인 완료"
        })

        if (!result.ok) {
            alert(result.message)
            return;
        }

        alert("견적서가 승인 완료되었습니다.");
    };

    // 반려 처리
    const handleReject = () => {
        const result = updateQuotation({
            id: quotation.id,
            status: "반려"
        })

        if (!result.ok) {
            alert(result.message)
            return;
        }

        alert("견적서가 반려되었습니다.");
    };

    //재검토 요청 처리
    const handleReview = () => {

        const result = updateQuotation({
            id: quotation.id,
            status: "승인 대기"
        })

        if (!result.ok) {
            alert(result.message)
            return
        }

        alert("재검토 요청이 완료되었습니다.")
    }

    //견적서 수정
    const handleEdit = () => {

        if (quotation.status === "승인 완료" ||
            quotation.status === "반려"
        ) {
            alert("수정할 수 없는 견적서입니다.")
            return;
        }

        navi("/quotation/create", {
            state: {
                editId: quotation.id,
                fromDetail: true
            }
        })
    }

    //견적서 삭제
    const handleDelete = () => {

        if(quotation.status === "승인 완료"){
            alert("승인 완료된 견적서는 삭제할 수 없습니다.")
            return;
        }

        if (!window.confirm("이 견적서를 삭제하시겠습니까?\n삭제한 견적서는 복구할 수 없습니다.")) {
            return;
        }

        deleteQuotation(quotation.id)

        alert("견적서가 삭제되었습니다.")
        navi("/quotation")

    }

    return (
        <div className="quotation-detail">

            <header className="detail-header">
                <div>
                    <h1>견적 상세 정보</h1>
                    <p>견적 번호: {formatQuotationId(quotation.id)}</p>
                </div>
            </header>

            <main className="detail-content">

                <section className="detail-info">
                    <h2>견적 정보</h2>

                    <div className="detail-info-grid">
                        <div className="detail-item">
                            <span>거래처</span>
                            <strong>{formatCustomerName(customers, quotation.customerId)}</strong>
                        </div>

                        <div className="detail-item">
                            <span>거래처 담당자</span>
                            <strong>{customer?.customerManager || "-"}</strong>
                        </div>

                        <div className="detail-item">
                            <span>거래처 연락처</span>
                            <strong>{customer?.phone || "-"}</strong>
                        </div>

                        <div className="detail-item">
                            <span>상품</span>
                            <strong>{formatProductName(products, quotation.productId)}</strong>
                        </div>

                        <div className="detail-item">
                            <span>내부 담당자</span>
                            <strong>{employee?.name || "-"}</strong>
                        </div>

                        <div className="detail-item">
                            <span>작성일</span>
                            <strong>{quotation.createdAt}</strong>
                        </div>

                        <div className="detail-item">
                            <span>납품 예정일</span>
                            <strong>{quotation.deliveryDate || "-"}</strong>
                        </div>

                        <div className="detail-item">
                            <span>견적 유효기간</span>
                            <strong>{quotation.validUntil || "-"}</strong>
                        </div>

                        <div className="detail-item">
                            <span>수량</span>
                            <strong>{quotation.quantity?.toLocaleString()}개</strong>
                        </div>

                        <div className="detail-item">
                            <span>단가</span>
                            <strong>{formatPrice(quotation.unitPrice)}</strong>
                        </div>
                    </div>
                </section>

                <section className="detail-price">
                    <h2>견적 금액</h2>

                    <div className="price-row">
                        <span>공급가액</span>
                        <strong>{formatPrice(supplyAmount)}</strong>
                    </div>

                    <div className="price-row">
                        <span>부가세 (10%)</span>
                        <strong>{formatPrice(vat)}</strong>
                    </div>

                    <div className="price-divider"></div>

                    <div className="price-info">
                        <span>총 견적 금액 (부가세 포함)</span>
                        <strong>
                            {formatPrice(finalPrice)}
                        </strong>
                    </div>
                </section>

                <section className="detail-status">
                    <h2>진행 상태</h2>
                    <span className={`detail-status-badge ${quotation.status === "승인 완료" ? "approved" :
                        quotation.status === "승인 대기" ? "pending" :
                            quotation.status === "반려" ? "rejected" : "temporary"
                        }`}>
                        {quotation.status}
                    </span>
                </section>

                <section className="detail-memo">
                    <h2>메모</h2>
                    <p>{quotation.memo || "등록된 메모가 없습니다."}</p>
                </section>

            </main>

            <div className="detail-actions">

                <div className="detail-process">
                    {quotation.status === "승인 대기" && (
                        <>
                            <button className="approve-btn" onClick={handleApprove}>
                                승인 완료
                            </button>

                            <button className="reject-btn" onClick={handleReject}>
                                반려
                            </button>
                        </>
                    )}

                    {quotation.status === "승인 완료" && (
                        <button className="review-btn" onClick={handleReview}>
                            재검토 요청
                        </button>
                    )}

                    {quotation.status === "반려" && (
                        <button className="review-btn" onClick={handleReview}>
                            승인 대기
                        </button>
                    )}
                </div>

                <div className="detail-manage">
                    {(quotation.status !== "승인 완료" &&
                        quotation.status !== "반려") && (
                            <button className="edit-btn" onClick={handleEdit}>
                                수정
                            </button>
                        )}

                    {quotation.status !== "승인 완료" && (
                        <button className="delete-btn" onClick={handleDelete}>
                            삭제
                        </button>
                    )}
                    <button className="back-btn" onClick={() => navi("/quotation")}>
                        목록으로
                    </button>
                </div>

            </div>
        </div>
    );
}

export default QuotationDetail;