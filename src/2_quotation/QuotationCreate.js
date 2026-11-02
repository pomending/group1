import React from "react";
import "./QuotationCreate.css"

function QuotationCreate() {

    const today = new Date().toISOString().slice(0, 10);

    return (
        <div className="quotation-create">
            <header className="create-header">

                <h1>새 견적서 작성</h1>
                <p>거래처에 전달할 견적 정보를 입력합니다.</p>

            </header>

            <main className="create-content">

                <section>
                    <div className="section-header">
                        <span className="section-number">01</span>
                        <h2>견적 기본 정보</h2>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            {/* 견적 번호는 중복되지 않게 자동생성되게 만들기 */}
                            <label>견적 번호</label>
                            <input
                                type="text"
                                value="자동 생성 예정"
                                readOnly
                                className="readonly-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>작성일</label>
                            <input
                                type="date"
                                value={today}
                                readOnly
                            />
                        </div>

                        <div className="form-group">
                            <label>내부 담당자</label>
                            <input
                                type="text"
                                placeholder="담당자명을 입력하세요."
                            />
                        </div>
                    </div>
                </section>

                <section className="create-card">
                    <div className="section-header">
                        <span className="section-number">02</span>
                        <h2>거래처 정보</h2>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>거래처명</label>
                            <input
                                type="text"
                                placeholder="거래처명을 입력하세요."
                            />
                        </div>

                        <div className="form-group">
                            <label>담당자</label>
                            <input
                                type="text"
                                placeholder="담당자를 입력하세요."
                            />
                        </div>

                        <div className="form-group">
                            <label>연락처</label>
                            <input
                                type="text"
                                placeholder="연락처를 입력하세요."
                            />
                        </div>
                    </div>
                </section>


                <section className="create-card">
                    <div className="section-header">
                        <span className="section-number">03</span>
                        <h2>상품 정보</h2>
                    </div>

                    <div className="product-form">
                        <div className="form-group product-name">
                            <label>상품명</label>
                            <input
                                type="text"
                                placeholder="상품명을 입력하세요." />
                        </div>

                        <div className="form-group">
                            <label>수량</label>
                            <input
                                type="number"
                                placeholder="수량을 입력하세요." />
                        </div>

                        <div className="form-group">
                            <label>단가 (원)</label>
                            <input
                                type="number"
                                placeholder="단가를 입력하세요." />
                        </div>

                        <div className="form-group">
                            <p>상품 총 금액 (원)</p>
                            <input
                                type="number"
                                placeholder="자동 계산"
                                readOnly
                                className="readonly-input"
                            />
                        </div>
                    </div>
                </section>

                <section className="create-card">
                    <div className="section-header">
                        <span className="section-number">04</span>
                        <h2>견적 금액</h2>
                    </div>

                    <div className="amount-grid">
                        <div className="amount-item">
                            <span>공급가액</span>
                            <strong>0원</strong>
                        </div>

                        <div className="amount-item">
                            <span>부가세 (10%)</span>
                            <strong>0원</strong>
                        </div>

                        <div className="amount-item total-amount">
                            <span>최종 견적 금액</span>
                            <strong>0원</strong>
                        </div>
                    </div>
                </section>

                <section className="create-card">
                    <div className="section-header">
                        <span className="section-number">05</span>
                        <h2>거래 조건</h2>
                    </div>

                    <div className="form-grid">
                        <div className="form-group">
                            <label>견적 유효 기간</label>
                            <input
                                type="text"
                                placeholder="예: 발행일로부터 30일" />
                        </div>

                        <div className="form-group">
                            <label>납품 예정일</label>
                            <input type="date" />
                        </div>

                        <div className="form-group">
                            <label>결제 방법</label>
                            <select defaultValue="">
                                <option value="" disabled>결제방법을 선택하세요.</option>
                                <option value="계좌이체">계좌이체</option>
                                <option value="카드결제">카드결제</option>
                                <option value="현금결제">현금결제</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>특이사항</label>
                            <input
                                type="text"
                                placeholder="특이사항을 입력하세요." />
                        </div>
                    </div>
                </section>
            </main>

            <div className="create-footer">
                <button type="button" className="cancel-btn">
                    취소
                </button>

                <button type="button" className="save-btn">
                    견적서 저장
                </button>
            </div>

        </div>
    )
}

export default QuotationCreate