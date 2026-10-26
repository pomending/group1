import React, { useState } from "react";

function ProductPage() {

    const [signup, setSignup] = useState(false);
    const [search, setSearch] = useState("");

    const [products] = useState([
        { code: "PRD-001", name: "로고 키링", type: "액세서리", price: 2000 },
        { code: "PRD-002", name: "커스텀 텀블러", type: "생활용품", price: 8500 },
        { code: "PRD-003", name: "로고 에코백", type: "패션잡화", price: 5000 },
        { code: "PRD-004", name: "캐릭터 스티커", type: "문구", price: 500 },
    ]);

    if (signup) {
        return (
            <div>
                <h2>상품 등록</h2>
                <input type="text" placeholder="상품 코드" />
                <input type="text" placeholder="상품명" />
                <br/>
                <select>
                    <option value="">전체 유형</option>
                    <option value="액세서리">액세서리</option>
                    <option value="생활용품">생활용품</option>
                    <option value="패션잡화">패션잡화</option>
                    <option value="문구">문구</option>
                    <option value="인쇄물">인쇄물</option>
                    <option value="기타">기타</option>
                </select>
                <input type="number" placeholder="기본 단가" />

                <div>
                    <input type="button" value="저장" onClick={() => setSignup(false)} />
                    <input type="button" value="취소" onClick={() => setSignup(false)} />
                </div>
            </div>
        )
    }


    return (
        <div>
            <header>
                <h1>상품 관리</h1>
                <p>상품 목록을 조회하고 관리합니다.</p>
            </header>

            <section>
                <div>
                    <h3>전체 상품</h3>
                    <p>24개</p>
                </div>
                <div>
                    <h3>판매 중</h3>
                    <p>21개</p>
                </div>
                <div>
                    <h3>판매 중지</h3>
                    <p>3개</p>
                </div>
            </section>

            <div>
                <h2>상품 목록</h2>
                <input
                    type="button"
                    value="+ 상품 등록"
                    onClick={() => setSignup(true)} />

                <br />

                <input
                    type="text"
                    placeholder="상품명 또는 상품 코드 검색"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)} />
            </div>

            <select>
                <option value="">전체 유형</option>
                <option value="액세서리">액세서리</option>
                <option value="생활용품">생활용품</option>
                <option value="패션잡화">패션잡화</option>
                <option value="문구">문구</option>
                <option value="인쇄물">인쇄물</option>
                <option value="기타">기타</option>
            </select>


        </div>
    )
}

export default ProductPage