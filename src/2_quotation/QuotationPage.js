
import React from "react";
import "./QuotationPage.css";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import QuotationList from "./QuotationList";
import ProductPage from "./ProductPage";

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

            <section>
                <div>
                    <h3>전체 상품 수</h3>
                    <p>24개</p>
                    <Link to="/quotation/product">
                        상품 관리 바로가기 →
                    </Link>
                </div>
                <div>
                    <h3>전체 견적 수</h3>
                    <p>19개</p>
                    <Link to="/quotation/list">
                        견적 관리 바로가기 →
                    </Link>
                </div>
                <div>
                    <h3>승인 대기</h3>
                    <p>2개</p>
                    {/* 버튼 수정 필요 */}
                    <input type="button"
                        value="승인 대기 견적"
                        onClick={() => navi("/quotation/list")} />
                </div>
                <div>
                    <h3>승인 완료</h3>
                    <p>4개</p>
                    {/* 버튼 수정 필요 */}
                    <input type="button"
                        value="승인 대기 견적"
                        onClick={() => navi("/quotation/list")} />
                </div>
            </section>

            <div className="fast-work">
                <h2>빠른 작업</h2>

                <div className="product">
                    <h2>상품 등록</h2>
                    <input type="button"
                        value="+ 상품 등록"
                        onClick={() => navi("/quotation/product")} />
                </div>

                <div className="quotation">
                    <h2>새 견적 작성</h2>
                    <input type="button"
                        value="+ 견적 작성"
                        onClick={() => navi("/quotation/list")} />
                </div>
            </div>

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
        </div>
    );
}

function QuotationPage() {
    return (
        <Routes>
            <Route index element={<QuotationDashboard />} /> {/* index는 해당 메뉴의 첫화면을 보여준다 */}
            <Route path="list" element={<QuotationList />} />
            <Route path="product/*" element={<ProductPage />} />
        </Routes>
    )
}

export default QuotationPage

