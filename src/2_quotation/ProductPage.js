import React from "react";

function ProductPage(){
    return(
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

            


        </div>
    )
}

export default ProductPage