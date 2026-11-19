
import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import { useLocation, useNavigate } from "react-router-dom";
import "./QuotationList.css";
import { getQuotationPriceDetails, totalPrice } from "../utils/quotationUtils";
import { formatCustomerName, formatProductName, formatQuotationId } from "../utils/formatUtils";
import { useERP } from "../context/ERPContext";

function QuotationList() {

    const {
        quotations,
        customers,
        products,
        deleteQuotation,
        consultations
    } = useERP()

    const navi = useNavigate();
    const location = useLocation();

    //검색 조건 상태
    const [search, setSearch] = useState("");
    const [startdate, setStartDate] = useState("");
    const [enddate, setEndDate] = useState("");

    //실제 검색에 적용할 조건
    const [appliedsearch, setAppliedSearch] = useState("");
    const [appliedstartdate, setAppliedStartDate] = useState("");
    const [appliedenddate, setAppliedEndDate] = useState("");

    const [selectedCard, setSelectedCard] = useState("전체 상태")

    //현재 페이지
    const [currentPage, setCurrentPage] = useState(1);

    //임시저장 열기 닫기 기능
    const [showTempModel, setShowTempModel] = useState(
        location.state?.openTempModal || false
    )

    //검색 버튼 클릭
    const handleSearch = () => {
        setAppliedSearch(search);
        setAppliedStartDate(startdate);
        setAppliedEndDate(enddate);
        setCurrentPage(1);
    }

    //검색 초기화 버튼 클릭
    const handleReset = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");

        setAppliedSearch("")
        setAppliedStartDate("")
        setAppliedEndDate("")

        setCurrentPage(1);
    }

    const pendingRequests = consultations.filter(consultation =>
        consultation.status === "견적 요청" &&
        !quotations.some(quotation =>
            Number(quotation.consultationId) === Number(consultation.id) &&
            quotation.status !== "임시 저장"
        )
    )


    const [sortOrder, setSortOrder] = useState("latest");

    const filteredQuotations = quotations.filter((quotation) => {

        if (quotation.status === "임시 저장") return false;

        const searchMatch =
            formatQuotationId(quotation.id).toLowerCase().includes(appliedsearch.toLowerCase()) ||
            formatCustomerName(customers, quotation.customerId).toLowerCase().includes(appliedsearch.toLowerCase()) ||
            formatProductName(products, quotation.productId).toLowerCase().includes(appliedsearch.toLowerCase());

        const startDateMatch =
            appliedstartdate === "" || quotation.createdAt >= appliedstartdate;

        const endDateMatch =
            appliedenddate === "" || quotation.createdAt <= appliedenddate;

        const statusMatch = selectedCard === "전체 상태" ||
            quotation.status === selectedCard;

        return searchMatch && startDateMatch && endDateMatch && statusMatch;
    }).sort((a, b) => {
        if (sortOrder === "latest") {
            return new Date(b.createdAt) - new Date(a.createdAt);
        } else {
            return new Date(a.createdAt) - new Date(b.createdAt);
        }
    });

    //페이지네이션
    const itemsPerPage = 10;
    const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;

    const currentQuotations = filteredQuotations.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    //페이지 번호 배열 만들기
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
        pages[i - 1] = i
    }

    return (
        <div className="quotation-menu">

            {showTempModel && (
                <div className="temp-modal-overlay">

                    <div className="temp-modal">

                        <div className="temp-modal-header">
                            <h2>임시 저장 목록</h2>

                            <button onClick={() => setShowTempModel(false)}>
                                X
                            </button>

                        </div>

                        <div className="temp-modal-content">
                            {quotations.filter(q => q.status === "임시 저장").length > 0 ? (
                                quotations.filter(q => q.status === "임시 저장")
                                    .map(q => (
                                        <div
                                            key={q.id}
                                            className="temp-modal-item"
                                        >
                                            <strong>
                                                {formatQuotationId(q.id)}
                                            </strong>

                                            <span>
                                                {formatCustomerName(customers, q.customerId)}
                                            </span>

                                            <span>
                                                {formatProductName(products, q.productId)}
                                            </span>

                                            <span>
                                                {q.createdAt}
                                            </span>

                                            <button
                                                onClick={() => {
                                                    navi("/quotation/create", {
                                                        state: { editId: q.id }
                                                    })
                                                }}>
                                                불러오기
                                            </button>

                                            <button onClick={() => {
                                                if (window.confirm("이 임시 저장 견적서를 삭제하시겠습니까?")) {
                                                    const result = deleteQuotation(q.id);

                                                    if (!result.ok) {
                                                        alert(result.message);
                                                        return;
                                                    }
                                                }
                                            }}>
                                                삭제
                                            </button>

                                        </div>
                                    ))
                            ) : (
                                <p>저장된 임시 견적서가 없습니다.</p>
                            )}
                        </div>

                    </div>

                </div>
            )}

            <PageHeader
                eyebrow="QUOTATION MANAGEMENT"
                title="견적 관리"
                description="고객 주문에 대한 견적서 작성 및 승인 상태를 관리합니다."
                actions={
                    <>
                        <button
                            type="button"
                            className="quotation-temp-btn"
                            onClick={() => setShowTempModel(true)}
                        >
                            임시 저장({quotations.filter(q => q.status === "임시 저장").length})
                        </button>
                        <input
                            type="button"
                            className="quotation-new-btn"
                            value="+ 새 견적 작성"
                            onClick={() => navi("/quotation/create")}
                        />
                    </>
                }
            />


            {/* 미완료 견적 요청 알림 */}
            {pendingRequests.length > 0 && (
                <div className="quotation-request-alert">
                    <span className="alert-dot"></span>
                    <strong>
                        견적 작성 대기 {pendingRequests.length}건
                    </strong>
                </div>
            )}


            {/* 견적 현황: 상태 카드를 클릭하면 목록에 상태 필터를 적용한다. */}
            <section className="quotation-status">
                <div className="quotation-summary">
                    {[
                        { label: "전체 견적 수", status: "전체 상태", count: quotations.filter(q => q.status !== "임시 저장").length },
                        { label: "승인 대기", status: "승인 대기", count: quotations.filter(q => q.status === "승인 대기").length },
                        { label: "승인 완료", status: "승인 완료", count: quotations.filter(q => q.status === "승인 완료").length },
                        { label: "반려", status: "반려", count: quotations.filter(q => q.status === "반려").length }
                    ].map(card => (
                        <button
                            type="button"
                            key={card.status}
                            className={`summary-card ${selectedCard === card.status ? "active" : ""}`}
                            onClick={() => {
                                setSelectedCard(card.status);
                                setCurrentPage(1);
                            }}
                            aria-pressed={selectedCard === card.status}
                        >
                            <span className="quotation-stat-label">{card.label}</span>
                            <strong className="quotation-stat-value">
                                {card.count}<small className="quotation-stat-unit">건</small>
                            </strong>
                        </button>
                    ))}
                </div>
            </section>

            {/* 견적 목록 */}
            < section className="recent-quotation" >

                <h2>견적 목록</h2>
                <div className="sort-select">
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="latest">최신순</option>
                        <option value="oldest">오래된순</option>
                    </select>
                </div>
                {/* 검색 조건 코드 만들기 */}
                <section className="quotation-search">

                    <div>
                        <label>검색어</label>
                        <input
                            type="text"
                            placeholder="견적번호, 거래처명 또는 상품명으로 검색"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)} />
                    </div>

                    <div className="search-item">
                        <label>작성일 기간</label>

                        <div className="date-range">
                            <input type="date"
                                value={startdate}
                                onChange={(e) => setStartDate(e.target.value)} />

                            <span>~</span>

                            <input type="date"
                                value={enddate}
                                onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>


                    <div className="search-buttons">
                        <input
                            type="button"
                            value="검색"
                            onClick={handleSearch}
                        />
                        <input
                            type="button"
                            value="초기화"
                            onClick={handleReset}
                        />
                    </div>

                    <div>
                        <p>현재 조회 결과</p>
                        <h2>{filteredQuotations.length}건</h2>
                    </div>
                </section>
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>견적 번호</th>
                                <th>거래처명</th>
                                <th>상품명</th>
                                <th>작성일</th>
                                <th>공급가액</th>
                                <th>상태</th>
                                <th>관리</th>
                            </tr>
                        </thead>

                        <tbody>
                            {currentQuotations.map((quotation) => (
                                <tr key={quotation.id}>
                                    <td>{formatQuotationId(quotation.id)}</td>
                                    <td>{formatCustomerName(customers, quotation.customerId)}</td>
                                    <td>{formatProductName(products, quotation.productId)}</td>
                                    <td>{quotation.createdAt}</td>
                                    <td>
                                        {totalPrice(
                                            quotation.quantity,
                                            getQuotationPriceDetails(quotation).finalUnitPrice
                                        ).toLocaleString()}원
                                    </td>
                                    <td>
                                        <span className={`status-badge ${quotation.status === "승인 대기" ? "pending" :
                                            quotation.status === "승인 완료" ? "approved" : "rejected"
                                            }`}>
                                            {quotation.status}

                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => navi(`/quotation/detail/${quotation.id}`)}>
                                            상세
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {currentQuotations.length === 0 && (
                                <tr>
                                    <td colSpan="7">
                                        검색 결과가 없습니다.
                                    </td>
                                </tr>
                            )

                            }
                        </tbody>

                    </table>
                </div>

                {/* 페이지 번호 */}
                <div className="pagination">
                    <button
                        onClick={() => {
                            setCurrentPage(Math.max(1, currentPage - 1))
                        }}
                        disabled={currentPage === 1}>
                        이전
                    </button>


                    {pages.map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page ? "active" : ""}>
                            {page}

                        </button>
                    ))

                    }

                    <button
                        onClick={() => {
                            setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }}
                        disabled={currentPage === totalPages || totalPages === 0}>
                        다음
                    </button>
                </div>
            </section >

        </div >
    )
}

export default QuotationList
