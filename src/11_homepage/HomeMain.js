
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import { productImages, findProductImage } from "../10_product/productImages";
import "./HomeMain.css";

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

    // 초기 상품에 이미지 주소가 없으면 이름으로 찾습니다.
    const name = item.productName === "세라믹 머그컵" ? "도자기 머그컵" : item.productName;
    return productImages.find(img => img.name === name)?.src || "";
}

function Photo({ item }) {
    const src = getImage(item);
    const [failed, setFailed] = useState("");

    if (!src || failed === src) return <span className="goods-no-img">📦</span>;
    return <img src={src} alt={item.productName} loading="lazy" onError={() => setFailed(src)} />;
}

function HomeMain() {
    const { products } = useERP();
    const preview = (products || []).filter(item => item.productStatus === "판매 중").slice(0, 4);
    const features = [
        { icon: "🎨", name: "맞춤 제작", info: "브랜드 디자인" },
        { icon: "🎁", name: "기업 굿즈", info: "홍보 · 기념품" },
        { icon: "📦", name: "단체 제작", info: "다양한 제작 상품" }
    ];

    return (
        <main className="goods-home">
            <div className="goods-home-inner">
                {/* 회사 소개 */}
                <section className="goods-hero">
                    <div className="goods-hero-text">
                        <p className="goods-hero-label">CUSTOM GOODS FOR BUSINESS</p>
                        <h1>브랜드의 가치를<span>특별한 굿즈로.</span></h1>
                        <p className="goods-hero-description">
                            기업 홍보용 판촉물부터 행사 기념품, 단체 굿즈까지.
                            브랜드의 개성을 담은 다양한 제작 상품을 만나보세요.
                        </p>
                        <Link className="goods-view-button" to="/homepage?page=products">
                            제작 상품 둘러보기 <span aria-hidden="true">↗</span>
                        </Link>
                    </div>
                    <div className="goods-hero-art" aria-hidden="true">
                        <span className="goods-art-top">MADE FOR YOUR BRAND</span>
                        <strong>G.</strong>
                        <span className="goods-art-bottom">GOODS STUDIO / CUSTOM MADE</span>
                    </div>
                </section>

                {/* 굿즈 제작 안내 */}
                <section className="goods-features">
                    <div className="goods-section-heading">
                        <p>01 / OUR SERVICES</p>
                        <h2>굿즈 제작 안내</h2>
                    </div>
                    <div className="goods-feature-list">
                        {features.map(item => (
                            <article className="goods-feature" key={item.name}>
                                <div className="goods-feature-icon" aria-hidden="true">{item.icon}</div>
                                <h3>{item.name}</h3>
                                <p>{item.info}</p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* 판매 중인 상품의 앞 4개만 보여줍니다. */}
                <section className="goods-preview">
                    <div className="goods-section-heading">
                        <p>02 / PRODUCTS</p>
                        <h2>제작 상품 미리보기</h2>
                        <span>굿즈 제작에 활용할 수 있는 다양한 상품을 소개합니다.</span>
                    </div>
                    {preview.length === 0 ? (
                        <div className="goods-preview-empty">
                            <div className="goods-empty-symbol">□</div>
                            <h3>검색되는 상품이 없습니다.</h3>
                            <p>판매 중인 상품이 등록되면 이곳에 표시됩니다.</p>
                        </div>
                    ) : (
                        <div className="goods-preview-list">
                            {preview.map(item => (
                                <Link className="goods-preview-card" to={`/homepage?page=products&product=${item.id}`} key={item.id}>
                                    <div className="goods-preview-img"><Photo item={item} /></div>
                                    <div className="goods-preview-info">
                                        <small>CUSTOM GOODS</small>
                                        <h3>{item.productName}</h3>
                                        <p>{Number(item.productPrice).toLocaleString("ko-KR")}원</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default HomeMain;
