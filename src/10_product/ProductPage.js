/* 상품관리 진입 화면: ERPContext의 상품 목록을 읽고 등록·수정합니다.
 * 진입: App.js의 /product 경로 → ProductPage → 상세(ProductDetails) 또는 등록·수정(ProductForm)
 * 데이터: ERPProvider 내부에서 useERP() → products / setProducts 사용
 * 표시: 전체 현황 집계 → 검색·상태 필터 → 정렬 → 10개 단위 표시
 * 저장: ProductForm 검증 → saveProduct에서 전달 필드 선택 → Context 갱신 → 목록 또는 원래 상세로 복귀
 * Context의 setProducts는 공통 상품 상태를 갱신하며, 현재는 새로고침 후 저장을 보장하지 않습니다.
 */
import React, { useLayoutEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import { useERP } from "../context/ERPContext";
import ProductForm from "./ProductForm";
import ProductDetails from "./ProductDetails";
import {
  formatProductDate, getProductStatus, productStatuses, normalizeProductName,
  compareProductDates, createProductCsv, getProductInput, updateProduct, getProductPriceRange,
} from "./productData";
import "./productStyles.css";

const PAGE_SIZE = 10;
// 정렬은 filter가 만든 새 배열에만 적용합니다. 같은 값이면 ID순으로 정해 페이지 이동 중 순서를 유지합니다.
const productSorters = {
  newest: (a, b) => compareProductDates(a.productCreatedAt, b.productCreatedAt),
  oldest: (a, b) => compareProductDates(a.productCreatedAt, b.productCreatedAt, false),
  updated: (a, b) => compareProductDates(a.productUpdatedAt, b.productUpdatedAt),
  name: (a, b) => a.productName.localeCompare(b.productName, "ko"),
  priceAsc: (a, b) => a.productPrice - b.productPrice,
  priceDesc: (a, b) => b.productPrice - a.productPrice,
};

export default function ProductPage() {
  // [1] 데이터와 화면 상태: Context 상품과 검색·편집 조건을 분리합니다.
  const { products, setProducts } = useERP();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const range = getProductPriceRange(priceRange.min, priceRange.max);
  const hasPriceRange = priceRange.min !== "" || priceRange.max !== "";
  // null이면 편집하지 않습니다. ID가 없는 객체는 신규·복사 등록, ID가 있으면 기존 상품 수정입니다.
  const [editing, setEditing] = useState(null);
  // 화면 제목·취소 안내용 모드이며 상품 객체나 Context에는 저장하지 않습니다.
  const [editorMode, setEditorMode] = useState("create");
  // 상세는 ID만 기억해 Context에서 갱신된 최신 상품을 표시합니다.
  const [selectedId, setSelectedId] = useState(null);
  const selectedProduct = products.find(product => product.id === selectedId);
  const [notice, setNotice] = useState("");
  // 복귀 위치는 상품명 대신 ID로 기억합니다. 이름 변경·필터 결과 제외 시에도 안전하게 처리합니다.
  const focusTargets = useRef(new Map());
  const focusRequest = useRef(null);
  const listReturnFocus = useRef("list-heading");
  const editReturnFocus = useRef("register");
  const focusRef = key => node => {
    if (node) focusTargets.current.set(key, node);
    else focusTargets.current.delete(key);
  };
  // [2] 목록 계산: 현황은 전체 상품, visible은 조회 결과, pageProducts는 현재 페이지입니다.
  const statusCounts = productStatuses.map(option => [
    option.value, option.label, products.filter(product => product.productStatus === option.value).length,
  ]);
  const visible = products.filter(product =>
    normalizeProductName(product.productName).includes(normalizeProductName(query))
    && (status === "all" || product.productStatus === status)
    && !range.error && product.productPrice >= range.min && product.productPrice <= range.max
  ).sort((a, b) => productSorters[sort](a, b)
    || String(a.id).localeCompare(String(b.id), "en", { numeric: true }));
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  // 외부 Context 갱신으로 목록이 줄어도 없는 페이지를 표시하지 않습니다.
  const page = Math.min(currentPage, totalPages);
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageProducts = visible.slice(pageStart, pageStart + PAGE_SIZE);

  useLayoutEffect(() => {
    if (!focusRequest.current) return;
    const target = focusTargets.current.get(focusRequest.current)
      || focusTargets.current.get(selectedId === null ? "list-heading" : "detail-heading");
    focusRequest.current = null;
    target?.focus();
  }, [editing, selectedId, products, page]);

  function openEditor(product, returnTarget, mode = product.id != null ? "edit" : "create") {
    editReturnFocus.current = returnTarget;
    setNotice("");
    setEditorMode(mode);
    setEditing({ ...product });
  }
  function closeEditor() {
    focusRequest.current = editReturnFocus.current;
    setEditing(null);
  }

  // 입력값 세 개만 복사합니다. 신규 저장 시 ID·등록일을 생성하고 수정일은 비우며 원본은 변경하지 않습니다.
  function copyProduct() {
    if (!selectedProduct) return;
    openEditor(getProductInput(selectedProduct), "detail-copy", "copy");
    setNotice("복사 등록을 준비했습니다. 새 상품명을 입력한 뒤 저장하세요.");
  }

  // 빈 결과에서 조건만 풀 때는 정렬을 유지합니다. 상단 초기화는 정렬도 기본값으로 되돌립니다.
  function resetConditions() {
    setQuery("");
    setStatus("all");
    setPriceRange({ min: "", max: "" });
    setCurrentPage(1);
  }

  // 카드와 선택 상자는 같은 필터 상태를 사용합니다. 검색·정렬은 유지하고 첫 페이지로 이동합니다.
  function filterByStatus(value) {
    setStatus(value);
    setCurrentPage(1);
  }

  function filterByPrice(boundary, value) {
    setPriceRange(current => ({ ...current, [boundary]: value }));
    setCurrentPage(1);
  }

  // 페이지를 자르기 전 검색·필터·정렬 결과 전체를 내려받습니다. 상품 상태와 저장소에는 쓰지 않습니다.
  function exportProducts() {
    if (!visible.length) return;
    try {
      const blob = new Blob([createProductCsv(visible)], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `상품목록_${formatProductDate(new Date().toISOString())}.csv`);
      setNotice(`조회한 상품 ${visible.length}건의 CSV 다운로드를 요청했습니다.`);
    } catch {
      setNotice("CSV 다운로드를 시작하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  // [3] 저장: 전달 필드 선택 → 편집 충돌 검사 → Context 갱신 → 이전 화면 복귀.
  function saveProduct(values) {
    // Context로 보낼 입력값은 상품명·단가·상태로 제한합니다. ID·날짜는 아래에서 관리합니다.
    const input = getProductInput(values);
    const isNew = editing.id == null;
    if (!isNew) {
      const original = products.find(product => product.id === editing.id);
      if (!original) return "수정할 상품을 찾을 수 없습니다. 취소한 뒤 목록을 확인해 주세요.";
      // 수정창을 열 때 복사한 값과 현재 Context 값을 비교합니다. 다른 상품의 변경은 막지 않습니다.
      const fields = ["productName", "productPrice", "productStatus", "productCreatedAt", "productUpdatedAt"];
      if (fields.some(key => original[key] !== editing[key])) {
        return "편집 중 상품 정보가 다른 화면에서 변경되었습니다. 입력 내용을 확인한 뒤 취소하고 다시 수정해 주세요.";
      }
      // 정리된 저장값이 같으면 공통 상태·수정일을 갱신하지 않습니다.
      if (Object.keys(input).every(key => input[key] === original[key])) {
        setNotice("변경된 내용이 없습니다.");
        closeEditor();
        return;
      }
    }
    const now = new Date().toISOString();
    // 함수형 갱신으로 최신 목록의 최대 ID 다음 번호를 발급합니다. 기존 견적의 단가는 수정하지 않습니다.
    setProducts(current => {
      if (!isNew) return updateProduct(current, editing.id, input, now);
      return [...current, {
        ...input,
        id: Math.max(0, ...current.map(product => Number(product.id) || 0)) + 1,
        productCreatedAt: now,
        productUpdatedAt: "",
      }];
    });
    setNotice(isNew ? "상품을 등록했습니다." : "상품을 수정했습니다.");
    closeEditor();
    // 기존 상품 수정은 검색·페이지를 유지하고 신규 등록일 때만 조건을 해제합니다.
    if (isNew) {
      setSelectedId(null);
      focusRequest.current = "register";
      resetConditions();
    }
  }

  // 목록의 상태 변경도 동일한 Context 상품만 갱신합니다. 취소하면 수정일과 상태를 유지합니다.
  function changeProductStatus(product) {
    const next = getProductStatus(product.productStatus).nextValue;
    const label = getProductStatus(next).label;
    if (!window.confirm(`'${product.productName}' 상품을 ${label} 상태로 변경할까요?`)) return;
    const now = new Date().toISOString();
    setProducts(current => updateProduct(current, product.id, { productStatus: next }, now));
    setNotice(`판매 상태를 ${label}로 변경했습니다.`);
  }

  // [4] 목록·상세·등록/수정은 하나씩 표시합니다. 상세에서 수정 취소 시 같은 상품 상세로 돌아갑니다.
  return (
    <div className="pd-app">
      <div className="pd-shell">
        <header className="pd-heading">
          <div>
            <p className="pd-eyebrow">PRODUCT MANAGEMENT</p>
            <h1>상품 관리</h1>
            <p className="pd-muted">상품의 기본 단가와 판매 상태를 관리합니다.</p>
          </div>
          {editing === null && selectedId === null && (
            <button
              ref={focusRef("register")}
              className="pd-button pd-primary"
              type="button"
              onClick={() => openEditor({}, "register")}
            >
              + 상품 등록
            </button>
          )}
        </header>

        {notice && <p className="pd-notice" role="status" aria-label="상품 처리 결과">{notice}</p>}
        {editing !== null ? (
          <ProductForm
            key={`${editorMode}:${editing.id ?? "new"}`}
            mode={editorMode}
            product={editing}
            products={products}
            onSave={saveProduct}
            onCancel={() => {
              setNotice("");
              closeEditor();
            }}
          />
        ) : selectedId !== null ? (
          <ProductDetails
            product={selectedProduct}
            focusRef={focusRef}
            onBack={() => {
              focusRequest.current = listReturnFocus.current;
              setSelectedId(null);
            }}
            onEdit={() => openEditor(selectedProduct, "detail-edit")}
            onCopy={copyProduct}
          />
        ) : (
          <>
            <section className="pd-stats" aria-label="상품 현황">
              {[["all", "전체 상품", products.length], ...statusCounts].map(([value, label, count]) => (
                <button
                  type="button"
                  className="pd-stat"
                  key={value}
                  aria-pressed={status === value}
                  onClick={() => filterByStatus(value)}
                >
                  <span>{label}</span>
                  <strong>{count}<small>개</small></strong>
                </button>
              ))}
            </section>
            <section className="pd-panel" aria-labelledby="pd-list-title">
              <div className="pd-list-heading">
                <h2 id="pd-list-title" tabIndex={-1} ref={focusRef("list-heading")}>상품 목록</h2>
                <div className="pd-list-actions">
                  {/* 건수가 같아도 조건 변경을 알 수 있도록 검색어·상태를 함께 읽습니다. */}
                  <span className="pd-muted" role="status" aria-label="상품 조회 결과" aria-live="polite" aria-atomic="true">
                    <span className="pd-sr-only">{query.trim() ? `검색어 ${query.trim()}, ` : "전체 상품명, "}{status === "all" ? "전체 상태" : getProductStatus(status).label}, </span>
                    {hasPriceRange && <span className="pd-sr-only">{range.error || `단가 ${range.min.toLocaleString("ko-KR")}원부터 ${priceRange.max === "" ? "상한 없음" : `${range.max.toLocaleString("ko-KR")}원까지`}, `}</span>}
                    조회 {visible.length}건
                  </span>
                  <button
                    type="button"
                    className="pd-button pd-export"
                    disabled={!visible.length}
                    onClick={exportProducts}
                    title="현재 검색·필터 결과 전체를 내보냅니다."
                  >CSV 내보내기</button>
                </div>
              </div>
              {/* 조회 조건은 상품 데이터와 분리하며, 변경 시 첫 페이지를 표시합니다. */}
              <div className="pd-filters">
                <label className="pd-search">상품명 검색
                  <input ref={focusRef("search")} type="search" value={query} onChange={event => { setQuery(event.target.value); setCurrentPage(1); }} placeholder="상품명을 입력하세요" />
                </label>
                <label>판매 상태
                  <select value={status} onChange={event => filterByStatus(event.target.value)}>
                    <option value="all">전체 상태</option>
                    {productStatuses.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label>정렬
                  <select value={sort} onChange={event => { setSort(event.target.value); setCurrentPage(1); }}>
                    <option value="newest">등록일 최신순</option>
                    <option value="oldest">등록일 오래된순</option>
                    <option value="updated">최근 수정순</option>
                    <option value="name">상품명순</option>
                    <option value="priceAsc">낮은 단가순</option>
                    <option value="priceDesc">높은 단가순</option>
                  </select>
                </label>
                <button type="button" className="pd-button" onClick={() => { resetConditions(); setSort("newest"); }}>초기화</button>
              </div>
              {/* 접어도 입력한 단가 조건은 유지합니다. 초기화는 숨겨진 조건까지 해제합니다. */}
              <details className="pd-price-filter" aria-label="단가 범위 검색">
                <summary>추가 검색 조건{hasPriceRange ? " · 단가 조건 적용 중" : ""}</summary>
                <div className="pd-price-range">
                  <label>최소 단가 (원)
                    <input type="number" min={0} max={Number.MAX_SAFE_INTEGER} step={1}
                      value={priceRange.min} onChange={event => filterByPrice("min", event.target.value)}
                      placeholder="제한 없음" aria-invalid={!!range.error || undefined}
                      aria-describedby={range.error ? "pd-price-range-hint pd-price-range-error" : "pd-price-range-hint"} />
                  </label>
                  <label>최대 단가 (원)
                    <input type="number" min={0} max={Number.MAX_SAFE_INTEGER} step={1}
                      value={priceRange.max} onChange={event => filterByPrice("max", event.target.value)}
                      placeholder="제한 없음" aria-invalid={!!range.error || undefined}
                      aria-describedby={range.error ? "pd-price-range-hint pd-price-range-error" : "pd-price-range-hint"} />
                  </label>
                </div>
                <p id="pd-price-range-hint" className="pd-field-hint">입력하면 바로 조회합니다. 빈 값은 제한 없음이며 양 끝 금액을 포함합니다.</p>
                {range.error && <p id="pd-price-range-error" className="pd-error" role="alert">{range.error}</p>}
              </details>
              <div className="pd-table-scroll" role="region" aria-label="상품 목록 표" tabIndex={0}>
                <table className="pd-table">
                  <thead>
                    <tr>
                      {["번호", "상품명", "기본 단가", "판매 상태", "등록일", "최종 수정일", "관리"].map(label => (
                        <th scope="col" key={label}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageProducts.map(product => {
                      const sale = getProductStatus(product.productStatus);
                      return (
                        <tr key={product.id}>
                          <td>{product.id}</td>
                          <td className="pd-name">
                            <button
                              type="button"
                              className="pd-name-link"
                              ref={focusRef(`detail:${product.id}`)}
                              aria-label={`${product.productName} 상세 보기`}
                              onClick={() => {
                                listReturnFocus.current = `detail:${product.id}`;
                                focusRequest.current = "detail-heading";
                                setNotice("");
                                setSelectedId(product.id);
                              }}
                            >
                              {product.productName}
                            </button>
                          </td>
                          <td className="pd-price">{product.productPrice.toLocaleString("ko-KR")}원</td>
                          <td>
                            <div className="pd-status-actions">
                              <span className={`pd-badge ${sale.badgeClass}`}>{sale.label}</span>
                              <button
                                type="button"
                                className="pd-button pd-status-toggle"
                                aria-label={`${product.productName} ${sale.actionLabel}`}
                                onClick={() => changeProductStatus(product)}
                              >
                                {sale.actionLabel}
                              </button>
                            </div>
                          </td>
                          <td title={formatProductDate(product.productCreatedAt, true)}>
                            {formatProductDate(product.productCreatedAt)}
                          </td>
                          <td title={formatProductDate(product.productUpdatedAt, true)}>
                            {formatProductDate(product.productUpdatedAt)}
                          </td>
                          <td>
                            <button
                              className="pd-button pd-edit"
                              type="button"
                              ref={focusRef(`edit:${product.id}`)}
                              aria-label={`${product.productName} 수정`}
                              onClick={() => openEditor(product, `edit:${product.id}`)}
                            >
                              수정
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {visible.length === 0 && (
                      <tr>
                        <td className="pd-empty" colSpan={7}>
                          <div className="pd-empty-content">
                            <p>
                              {range.error ? "단가 조건을 확인해 주세요. 유효한 범위를 입력하면 조회됩니다." : products.length === 0
                                ? "등록된 상품이 없습니다. 상품 등록 버튼으로 추가해 주세요."
                                : "조건에 맞는 상품이 없습니다. 검색어·판매 상태·단가 조건을 변경해 주세요."}
                            </p>
                            {products.length > 0 && (
                              <button
                                type="button"
                                className="pd-button"
                                aria-label="검색 조건 초기화"
                                onClick={() => {
                                  resetConditions();
                                  focusTargets.current.get("search")?.focus();
                                }}
                              >
                                조건 초기화
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <nav className="pd-pagination" aria-label="상품 목록 페이지">
                  <span className="pd-muted">{pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, visible.length)} / {visible.length}건</span>
                  <div className="pd-page-controls">
                    <button type="button" className="pd-button" disabled={page === 1} onClick={() => setCurrentPage(page - 1)}>이전</button>
                    <span role="status" aria-label="현재 상품 페이지">{page} / {totalPages} 페이지</span>
                    <button type="button" className="pd-button" disabled={page === totalPages} onClick={() => setCurrentPage(page + 1)}>다음</button>
                  </div>
                </nav>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
