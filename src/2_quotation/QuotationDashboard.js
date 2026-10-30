import React from "react";
import { Link, useNavigate } from "react-router-dom";

function QuotationDashboard() {

    const navi = useNavigate();

    return (
        <div className="quotation-menu">


            <header className="quotation-header">
                <div>
                    <h1>견적 및 상품 관리</h1>
                    <p>상품과 견적 현황을 한눈에 확인하고 관리합니다.</p>
                </div>
            </header>

            <section className="quotation-summary">
                <div className="summary-card">
                    <h3>전체 상품 수</h3>
                    <p className="summary-number">24개</p>
                    <Link to="/quotation/product" className="summary-link">
                        상품 관리 바로가기 →
                    </Link>
                </div>
                <div className="summary-card">
                    <h3>전체 견적 수</h3>
                    <p className="summary-number">19개</p>
                    <Link to="/quotation/list" className="summary-link">
                        견적 관리 바로가기 →
                    </Link>
                </div>
                <div className="summary-card">
                    <h3>승인 대기</h3>
                    <p className="summary-number">2개</p>
                    <Link to="/quotation/list" className="summary-link">
                        승인 대기 견적 보기 →
                    </Link>
                </div>
                <div className="summary-card">
                    <h3>승인 완료</h3>
                    <p className="summary-number">4개</p>
                    <Link to="/quotation/list" className="summary-link">
                        승인 완료 내역 보기 →
                    </Link>
                </div>
            </section>

            <section className="fast-work">
                <div className="section-heading">
                    <h2>빠른 작업</h2>
                    <p>자주 사용하는 업무를 빠르게 실행합니다.</p>
                
                    <div className="product">
                        <h3>상품 등록</h3>
                        <p>새로운 상품을 등록하고 관리합니다.</p>
                        <input type="button"
                            value="+ 상품 등록"
                            onClick={() => navi("/quotation/product")} />
                    </div>

                    <div className="quotation">
                        <h3>새 견적 작성</h3>
                        <p>거래처에 전달할 견적 업무를 시작합니다.</p>
                        <input type="button"
                            value="+ 견적 작성"
                            onClick={() => navi("/quotation/create")} />
                    </div>
                </div>

            </section>

            <section>
                <div className="recent-quotation">
                    <div className="recent-quotation-header">
                        <h2>최근 견적 내역</h2>
                        <Link to="/quotation/list">
                            전체 견적 보기 →
                        </Link>
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
                                    <th>비고</th>
                                </tr>
                            </thead>
                            <tbody>

                                <tr>
                                    <td>2342342332</td>
                                    <td>성민팩토리</td>
                                    <td>성민키링</td>
                                    <td>2026-10-12</td>
                                    <td>100,000,000원</td>
                                    <td>승인대기중</td>
                                    <td>-</td>
                                </tr>

                            </tbody>
                        </table>
                    </div>
                </div>

            </section>
        </div>
    );
}

export default QuotationDashboard