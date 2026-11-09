/* 상품 상세. 최신 상품은 Page에서 전달받고 상태 변경·수정·복사·목록 이동은 부모 콜백에 맡깁니다.
 * focusRef로 복귀할 제목·버튼을 등록합니다. 목록의 검색·정렬·페이지 상태는 Page가 유지합니다.
 */
import React from "react";
import ProductImage from "./ProductImage";
import { formatProductDate, getProductStatus } from "./productData";

export default function ProductDetails({ product, onBack, onEdit, onCopy, onStatusChange, focusRef }) {
  const sale = product ? getProductStatus(product.productStatus) : null;
  return (
    <section className="pd-panel" aria-labelledby="pd-detail-title">
      <div className="pd-list-heading"><h2 id="pd-detail-title" tabIndex={-1} ref={focusRef("detail-heading")}>상품 상세</h2>
        <button type="button" className="pd-button" onClick={onBack}>목록으로</button>
      </div>
      {product ? <>
        <ProductImage key={product.id} product={product} />
        <dl className="pd-details pd-detail-summary" aria-label="주요 상품 정보">
          <div className="pd-detail-name"><dt>상품명</dt><dd>{product.productName}</dd></div>
          <div><dt>기본 단가</dt><dd className="pd-detail-price">{product.productPrice.toLocaleString("ko-KR")}원</dd></div>
          <div>
            <dt>판매 상태</dt>
            <dd className="pd-status-actions">
              <span className={`pd-badge ${sale.badgeClass}`}>{sale.label}</span>
              <button type="button" className="pd-button pd-status-toggle"
                aria-label={`${product.productName} ${sale.actionLabel}`}
                onClick={() => onStatusChange(product)}>
                {sale.actionLabel}
              </button>
            </dd>
          </div>
        </dl>
        <h3 className="pd-detail-meta-title">관리 정보</h3>
        <dl className="pd-details pd-detail-meta" aria-label="상품 관리 정보">
          {[
            ["상품 번호", product.id],
            ["등록일", formatProductDate(product.productCreatedAt, true)],
            ["최종 수정일", formatProductDate(product.productUpdatedAt, true)],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
        <p className="pd-muted">시각은 한국 시간(KST) 기준입니다.</p>
        <div className="pd-form-actions">
          <button ref={focusRef("detail-copy")} type="button" className="pd-button" onClick={onCopy}>상품 복사</button>
          <button ref={focusRef("detail-edit")} type="button" className="pd-button pd-primary" onClick={onEdit}>상품 수정</button>
        </div>
      </> : <p className="pd-muted" role="status">상품을 찾을 수 없습니다. 목록으로 돌아가 다시 선택해 주세요.</p>}
    </section>
  );
}
