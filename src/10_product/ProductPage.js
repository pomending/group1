/* 상품관리 진입 화면: ERPContext의 상품 목록을 읽고 등록·수정합니다.
 * 경로·사이드바 연결은 App.js에서 추후 추가합니다. ERPProvider 내부에서 사용합니다.
 * Context의 setProducts는 공통 상품 상태를 갱신하며, 현재는 새로고침 후 저장을 보장하지 않습니다.
 */
import React, { useState } from "react";
import { useERP } from "../context/ERPContext";
import ProductForm from "./ProductForm";
import "./productStyles.css";

export default function ProductPage() {
  const { products, setProducts } = useERP();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  // null은 목록, {}는 신규 등록, 기존 객체는 수정 화면입니다.
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const sellingCount = products.filter(product => product.productStatus === "판매 중").length;
  const stoppedCount = products.filter(product => product.productStatus === "판매중지").length;
  const visible = products.filter(product =>
    product.productName.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
    && (status === "all" || product.productStatus === status)
  );

  function saveProduct(values) {
    const now = new Date().toISOString();
    // 함수형 갱신으로 최신 목록의 최대 ID 다음 번호를 발급합니다. 기존 견적의 단가는 수정하지 않습니다.
    setProducts(current => editing.id == null
      ? [...current, {
        ...values,
        id: Math.max(0, ...current.map(product => Number(product.id) || 0)) + 1,
        productCreatedAt: now,
        productUpdatedAt: "",
      }]
      : current.map(product => product.id === editing.id
        ? { ...product, ...values, productUpdatedAt: now }
        : product));
    setNotice(editing.id == null ? "상품을 등록했습니다." : "상품 정보를 수정했습니다.");
    setEditing(null);
    setQuery("");
    setStatus("all");
  }

  return (
    <div className="pd-app">
      <div className="pd-shell">
        <header className="pd-heading">
          <div>
            <p className="pd-eyebrow">PRODUCT MANAGEMENT</p>
            <h1>상품 관리</h1>
            <p className="pd-muted">상품의 기본 단가와 판매 상태를 관리합니다.</p>
          </div>
          {editing === null && <button className="pd-button pd-primary" type="button"
            onClick={() => { setNotice(""); setEditing({}); }}>+ 상품 등록</button>}
        </header>

        {editing !== null ? (
          <ProductForm key={editing.id ?? "new"} product={editing} onSave={saveProduct} onCancel={() => setEditing(null)} />
        ) : (
          <>
            {notice && <p className="pd-notice" role="status">{notice}</p>}
            <section className="pd-stats" aria-label="상품 현황">
              {[["전체 상품", products.length], ["판매 중", sellingCount], ["판매 중지", stoppedCount]].map(([label, count]) => (
                <div className="pd-stat" key={label}><span>{label}</span><strong>{count}<small>개</small></strong></div>
              ))}
            </section>
            <section className="pd-panel" aria-labelledby="pd-list-title">
              <div className="pd-list-heading"><h2 id="pd-list-title">상품 목록</h2><span className="pd-muted">조회 {visible.length}건</span></div>
              <div className="pd-filters">
                <label className="pd-search">상품명 검색
                  <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="상품명을 입력하세요" />
                </label>
                <label>판매 상태
                  <select value={status} onChange={event => setStatus(event.target.value)}>
                    <option value="all">전체 상태</option>
                    <option value="판매 중">판매 중</option>
                    <option value="판매중지">판매 중지</option>
                  </select>
                </label>
                <button type="button" className="pd-button" onClick={() => { setQuery(""); setStatus("all"); }}>초기화</button>
              </div>
              <div className="pd-table-scroll" role="region" aria-label="상품 목록 표" tabIndex={0}>
                <table className="pd-table">
                  <thead><tr>{["번호", "상품명", "기본 단가", "판매 상태", "등록일", "최종 수정일", "관리"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
                  <tbody>
                    {visible.map(product => (
                      <tr key={product.id}>
                        <td>{product.id}</td><td className="pd-name">{product.productName}</td>
                        <td className="pd-price">{product.productPrice.toLocaleString("ko-KR")}원</td>
                        <td><span className={`pd-badge ${product.productStatus === "판매 중" ? "pd-selling" : "pd-stopped"}`}>
                          {product.productStatus === "판매중지" ? "판매 중지" : product.productStatus}
                        </span></td>
                        <td>{product.productCreatedAt?.slice(0, 10) || "—"}</td>
                        <td>{product.productUpdatedAt?.slice(0, 10) || "—"}</td>
                        <td><button className="pd-button pd-edit" type="button" aria-label={`${product.productName} 수정`}
                          onClick={() => { setNotice(""); setEditing(product); }}>수정</button></td>
                      </tr>
                    ))}
                    {visible.length === 0 && <tr><td className="pd-empty" colSpan={7}>
                      {products.length === 0 ? "등록된 상품이 없습니다. 상품 등록 버튼으로 추가해 주세요." : "조건에 맞는 상품이 없습니다. 검색어나 판매 상태를 변경해 주세요."}
                    </td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
