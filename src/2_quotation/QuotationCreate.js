import React from "react";

function QuotationCreate() {

    

    return (
        <div>
            <header>

                <h1>새 견적서 작성</h1>
                <p>거래처에 전달할 견적 정보를 입력합니다.</p>

            </header>

            <main>

                <div>
                    <h2>01. 견적 기본 정보</h2>
                    {/* 견적 번호는 중복되지 않게 자동생성되게 만들기 */}
                    <p>견적 번호</p>
                    <p>작성일</p>
                    <input type="date" />
                </div>

                <div>
                    <h2>02. 거래처 정보</h2>
                    <p>거래처명</p>
                    <input
                        type="text"
                        placeholder="거래처명을 입력하세요."
                        />

                    <p>담당자</p>
                    <input
                        type="text"
                        placeholder="담당자를 입력하세요."
                        />

                    <p>연락처</p>
                    <input
                        type="text"
                        placeholder="연락처를 입력하세요."
                        />
                </div>

                <div>
                    <h2>03. 상품 정보</h2>

                    <div>
                        <p>상품명</p>
                        <input 
                        type="text"
                        placeholder="상품명을 입력하세요." />
                        
                        <p>수량</p>
                        <input 
                        type="number"
                        placeholder="수량을 입력하세요."/>

                        <p>단가</p>
                        <input 
                        type="number"
                        placeholder="단가를 입력하세요."/>

                        <p>상품 총 금액</p>
                        <input 
                        type="number"
                        />
                    </div>

                </div>

                <div>
                    <h2>04. 견적 금액</h2>
                    <p>공급가액</p>

                    <p>부가세 (10%)</p>

                    <p>최종 견적 금액</p>
                </div>

                <div>
                    <h2>05. 거래 조건</h2>
                    <p>견적 유효 기간</p>
                    <input 
                    type="text" 
                    placeholder="유효기간을 입력하세요."/>

                    <p>납품 예정일</p>
                    <input type="date"/>

                    <p>결제 방법</p>
                    <input 
                    type="text"
                    placeholder="결제 방법을 입력하세요"/>

                    <p>특이사항</p>
                    <input 
                    type="text"
                    placeholder="특이사항을 입력하세요."/>
                </div>

            </main>

            <input
                type="button"
                value="취소" />

            <input
                type="button"
                value="견적서 저장" />

        </div>
    )
}

export default QuotationCreate