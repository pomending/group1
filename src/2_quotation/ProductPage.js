import React, { useState } from "react";

// 뒤로가기 버튼 만들기
function ProductPage() {

    const [signup, setSignup] = useState(false);
    const [search, setSearch] = useState("");

    const [products, setProducts] = useState([]);

    const [code, setCode] = useState("")
    const [name, setName] = useState("")
    const [type, setType] = useState("")
    const [price, setPrice] = useState("")

    //상품 등록 유효성 검사
    function valiProduct() {
        if (code.trim() === "") {
            alert("상품 코드를 입력해 주세요")
            return false;
        }
        if (name.trim() === "") {
            alert("상품명을 입력해 주세요")
            return false;
        }
        if (type === "") {
            alert("상품 유형을 선택해 주세요")
            return false;
        }
        if (price === "") {
            alert("기본 단가를 입력해 주세요")
            return false;
        }

        //상품 코드 중복 검사
        for (let i = 0; i < products.length; i++) {
            if (products[i].code.toLowerCase() === code.trim().toLowerCase()) {
                alert("이미 등록된 상품 코드입니다")
                return false;
            }
        }

        return true;
    }

    //상품 등록 코드
    if (signup) {
        return (
            <div>
                <h2>상품 등록</h2>
                <input type="text" placeholder="상품 코드" value={code}
                    onChange={(e) => setCode(e.target.value)} />
                <input type="text" placeholder="상품명" value={name}
                    onChange={(e) => setName(e.target.value)} />
                <br />
                <select value={type}
                    onChange={(e) => setType(e.target.value)}>
                    <option value="">전체 유형</option>
                    <option value="액세서리">액세서리</option>
                    <option value="생활용품">생활용품</option>
                    <option value="패션잡화">패션잡화</option>
                    <option value="문구">문구</option>
                    <option value="인쇄물">인쇄물</option>
                    <option value="기타">기타</option>
                </select>
                <input type="number" placeholder="기본 단가" value={price}
                    onChange={(e) => setPrice(e.target.value)} />


                <div>
                    <input type="button"
                        value="저장"
                        onClick={() => {

                            if (!valiProduct()) {
                                return;
                            }

                            const newProduct = {
                                code: code.trim(),
                                name: name.trim(),
                                type: type,
                                price: Number(price)
                            }

                            //상품 목록에 추가
                            setProducts([...products, newProduct])

                            //입력값 초기화
                            setCode("");
                            setName("");
                            setType("");
                            setPrice("");

                            //목록화면으로 이동
                            setSignup(false);

                        }} />
                    <input type="button"
                        value="취소"
                        onClick={() => setSignup(false)} />
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

            {/* section 자동으로 개수 보이게 수정해야함 */}
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

            {/* 유형별로 선택했을 때 각자 유형들만 나오게 만들기 */}
            <select value={type} >
                <option value="">전체 유형</option>
                <option value="액세서리">액세서리</option>
                <option value="생활용품">생활용품</option>
                <option value="패션잡화">패션잡화</option>
                <option value="문구">문구</option>
                <option value="인쇄물">인쇄물</option>
                <option value="기타">기타</option>
            </select>

            <table>
                <thead>
                    <tr>
                        <th>상품명</th>
                        <th>상품 코드</th>
                        <th>상품 유형</th>
                        <th>기본 단가</th>
                    </tr>
                </thead>

                <tbody>
                    {products.filter(product =>
                        product.name.toLowerCase().includes(search.toLowerCase()) ||
                        product.code.toLowerCase().includes(search.toLowerCase())
                    ).map(product => (
                        <tr key={product.code}>
                            <td>{product.name}</td>
                            <td>{product.code}</td>
                            <td>{product.type}</td>
                            <td>{product.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div >
    )
}

export default ProductPage