import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./QuotationList.css";

// 뒤로가기 버튼 만들기
function QuotationList({quotations}) {

    const navi = useNavigate();

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

    //현재 페이지
    const [currentPage, setCurrentPage] = useState(1);
        
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

    const filteredQuotations = quotations.filter((quotation) => {
        const searchMatch =
            quotation.code.toLowerCase().includes(appliedsearch.toLowerCase()) ||
            quotation.client.toLowerCase().includes(appliedsearch.toLowerCase()) ||
            quotation.product.toLowerCase().includes(appliedsearch.toLowerCase());

        const startDateMatch =
            appliedstartdate === "" || quotation.date >= appliedstartdate;

        const endDateMatch =
            appliedenddate === "" || quotation.date <= appliedenddate;

        const statusMatch =
            appliedstatus === "전체 상태" ||
            quotation.status === appliedstatus;

        return searchMatch && startDateMatch && endDateMatch && statusMatch;
    })

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
            <header className="quotation-header">
                <h1>견적 관리</h1>
                <p>고객 주문에 대한 견적서 작성 및 승인 상태 관리합니다</p>
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
                        placeholder="거래처명 또는 상품명으로 검색하세요"
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
                        <option>승인 완료</option>
                        <option>승인 대기</option>
                        <option>반려</option>
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
                    <div className="summary-card">
                        <p>전체 견적 수</p>
                        <h2 className="total-count">{quotations.length}건</h2>
                    </div>

                    <div className="summary-card">
                        <p>승인 대기</p>
                        <h2 className="pending-count">
                            {quotations.filter(q => q.status === "승인 대기").length}건
                        </h2>
                    </div>

                    <div className="summary-card">
                        <p>승인 완료</p>
                        <h2 className="approved-count">
                            {quotations.filter(q => q.status === "승인 완료").length}건
                        </h2>
                    </div>

                    <div className="summary-card">
                        <p>반려</p>
                        <h2 className="rejected-count">
                            {quotations.filter(q => q.status === "반려").length}건
                        </h2>
                    </div>
                </div>
            </section>

            {/* 견적 목록 */}
            <section className="recent-quotation">

                <h2>견적 목록</h2>

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
                                <tr key={quotation.code}>
                                    <td>{quotation.code}</td>
                                    <td>{quotation.client}</td>
                                    <td>{quotation.product}</td>
                                    <td>{quotation.date}</td>
                                    <td>{quotation.amount.toLocaleString()}원</td>
                                    <td>
                                        <span className={`status-badge ${quotation.status === "승인 대기" ? "pending" :
                                                quotation.status === "승인 완료" ? "approved" :
                                                    "rejected"
                                            }`}>
                                            {quotation.status}

                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => navi(`/quotation/detail/${quotation.code}`)}>
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