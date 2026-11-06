import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./QuotationList.css";
import { QUOTATION_STATUS } from "../utils/quotationUtils";
import { formatCustomerName, formatProductName, formatQuotationId } from "../utils/formatUtils";
import { useERP } from "../context/ERPContext";

function QuotationList({ quotations }) {

    const { customers, products, setQuotations } = useERP()

    const navi = useNavigate();
    const location = useLocation();

    //검색 조건 상태
    const [search, setSearch] = useState("");
    const [startdate, setStartDate] = useState("");
    const [enddate, setEndDate] = useState("");
    const [status, setStatus] = useState("전체 상태");

    //실제 검색에 적용할 조건
    const [appliedsearch, setAppliedSearch] = useState("");
    const [appliedstartdate, setAppliedStartDate] = useState("");
    const [appliedenddate, setAppliedEndDate] = useState("");
    const [appliedstatus, setAppliedStatus] = useState("전체 상태");

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
        setAppliedStatus(status);
        setCurrentPage(1);
    }

    //초기화 버튼 클릭
    const handleReset = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setStatus("전체 상태");

        setAppliedSearch("")
        setAppliedStartDate("")
        setAppliedEndDate("")
        setAppliedStatus("전체 상태")

        setCurrentPage(1);
    }

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

        const statusMatch =
            (appliedstatus === "전체 상태" ||
                quotation.status === appliedstatus) &&
            (selectedCard === "전체 상태" ||
                quotation.status === selectedCard);

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
                                                    setQuotations(
                                                        quotations.filter(item => item.id !== q.id)
                                                    )
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

            <header className="quotation-header">
                <h1>견적 관리</h1>
                <p>고객 주문에 대한 견적서 작성 및 승인 상태 관리합니다</p>

                <button onClick={() => setShowTempModel(true)}>
                    임시 저장(
                    {quotations.filter(q => q.status === "임시 저장").length}
                    )
                </button>



                <input
                    type="button"
                    value="+ 새 견적 작성"
                    onClick={() => navi("/quotation/create")} />
            </header>


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


                <div className="search-item">
                    <label>견적 상태</label>
                    <select value={status}
                        onChange={(e) => setStatus(e.target.value)}>
                        <option>전체 상태</option>
                        {QUOTATION_STATUS.map(status =>
                            <option>{status}</option>
                        )
                        }
                    </select>
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

            {/* 견적 현황 */}
            <section className="quotation-status">

                <div className="quotation-summary">
                    <div
                        className="summary-card"
                        onClick={() => {
                            setSelectedCard("전체 상태")
                            setCurrentPage(1)
                        }}>
                        <p>전체 견적 수</p>
                        <h2 className="total-count">
                            {quotations.filter(q => q.status !== "임시 저장").length}건
                        </h2>
                    </div>

                    <div
                        className="summary-card"
                        onClick={() => {
                            setSelectedCard("승인 대기")
                            setCurrentPage(1)
                        }}>
                        <p>승인 대기</p>
                        <h2 className="pending-count">
                            {quotations.filter(q => q.status === "승인 대기").length}건
                        </h2>
                    </div>

                    <div
                        className="summary-card"
                        onClick={() => {
                            setSelectedCard("승인 완료")
                            setCurrentPage(1)
                        }}>
                        <p>승인 완료</p>
                        <h2 className="approved-count">
                            {quotations.filter(q => q.status === "승인 완료").length}건
                        </h2>
                    </div>

                    <div
                        className="summary-card"
                        onClick={() => {
                            setSelectedCard("반려")
                            setCurrentPage(1)
                        }}>
                        <p>반려</p>
                        <h2 className="rejected-count">
                            {quotations.filter(q => q.status === "반려").length}건
                        </h2>
                    </div>
                </div>
            </section >

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
                <div className="table-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>견적 번호</th>
                                <th>거래처명</th>
                                <th>상품명</th>
                                <th>작성일</th>
                                <th>견적 금액</th>
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
                                    <td>{(quotation.quantity * quotation.unitPrice).toLocaleString()}원</td>
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