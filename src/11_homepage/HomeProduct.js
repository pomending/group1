
import React, { useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import { productImages, findProductImage } from "../10_product/productImages";
import "./HomeProduct.css";

// 10번 상품 관리에서 설정한 이미지를 사용합니다.
function getImage(item) {
    let value = item.productImageUrl || "";

    try {
        const saved = localStorage.getItem("erp_product_image:" + item.id);
        if (saved === "") return "";
        if (saved !== null) value = saved;
    } catch {
        // 저장값이 없으면 기본 상품 이미지를 사용합니다.
    }

    if (value.startsWith("catalog:")) {
        const image = findProductImage(value);
        return image ? image.src : "";
    }

    const image = productImages.find(img => img.id === value);
    if (image) return image.src;
    if (value.startsWith("http") || value.startsWith("/") || value.startsWith("data:image/")) return value;
    if (value) return "";

    const name = item.productName === "세라믹 머그컵" ? "도자기 머그컵" : item.productName;
    return productImages.find(img => img.name === name)?.src || "";
}

function Photo({ item }) {
    const src = getImage(item);
    const [failed, setFailed] = useState("");

    if (!src || failed === src) return <span className="shop-no-img">📦</span>;
    return <img src={src} alt={item.productName} loading="lazy" onError={() => setFailed(src)} />;
}

function HomeProduct() {
    const { products } = useERP();
    const location = useLocation();
    const productId = new URLSearchParams(location.search).get("product");
    const [search, setSearch] = useState("");
    const [openId, setOpenId] = useState(null);

    // 판매 중인 상품만 검색합니다.
    const list = (products || []).filter(item =>
        item.productStatus === "판매 중" &&
        item.productName.toLowerCase().includes(search.trim().toLowerCase())
    );

    // 미리보기로 들어오면 해당 상품으로, 메뉴로 들어오면 맨 위로 이동합니다.
    useLayoutEffect(() => {
        const card = productId ? document.getElementById("shop-" + productId) : null;
        if (card) card.scrollIntoView({ block: "start" });
        else window.scrollTo(0, 0);
    }, [productId, products]);

    // 선택한 상품 정보만 열고 닫습니다.
    function toggle(id) {
        setOpenId(openId === id ? null : id);
    }

    return (
        <main className="shop">
            <div className="shop-inner">
                <header className="shop-head">
                    <p>GOODS / PRODUCTS</p>
                    <h1>제작 상품</h1>
                    <span>브랜드와 행사에 어울리는 다양한 굿즈를 만나보세요.</span>
                </header>

                {/* 상품명 검색 */}
                <div className="shop-search">
                    <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="상품명을 검색하세요." aria-label="상품명 검색" />
                    <span>총 <strong>{list.length}</strong>개 상품</span>
                </div>

                {/* 상품 목록 */}
                {list.length === 0 ? (
                    <div className="shop-empty">
                        <div aria-hidden="true">📦</div>
                        <h2>검색되는 상품이 없습니다.</h2>
                        <p>{search ? "다른 상품명으로 검색해 보세요." : "판매 중인 상품이 등록되면 표시됩니다."}</p>
                        {search && <button type="button" onClick={() => setSearch("")}>검색 초기화</button>}
                    </div>
                ) : (
                    <div className="shop-list">
                        {list.map(item => (
                            <article className="shop-card" id={"shop-" + item.id} key={item.id}>
                                <div className="shop-img"><Photo item={item} /></div>
                                <div className="shop-info">
                                    <small>GOODS / CUSTOM MADE</small>
                                    <h2>{item.productName}</h2>
                                    <strong>{Number(item.productPrice).toLocaleString("ko-KR")}원</strong>
                                    <button type="button" onClick={() => toggle(item.id)}>
                                        {openId === item.id ? "정보 닫기 −" : "상품 정보 +"}
                                    </button>
                                    {openId === item.id && (
                                        <div className="shop-detail">
                                            <p>상품번호: {item.id}</p>
                                            <p>상품명: {item.productName}</p>
                                            <p>기본 단가: {Number(item.productPrice).toLocaleString("ko-KR")}원</p>
                                            <p>판매 상태: {item.productStatus}</p>
                                        </div>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}

export default HomeProduct;
