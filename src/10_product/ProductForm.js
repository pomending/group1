/* 입력값은 저장 전까지 이 폼에서 관리합니다. 취소하면 공통 상품 목록은 변경되지 않습니다. */
import React, { useState } from "react";

export default function ProductForm({ product, onSave, onCancel }) {
  const [name, setName] = useState(product.productName || "");
  const [price, setPrice] = useState(product.productPrice ?? "");
  const [status, setStatus] = useState(product.productStatus || "판매 중");
  const [error, setError] = useState("");
  const isEditing = product.id != null;

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) { setError("상품명을 입력해 주세요."); return; }
    const amount = Number(price);
    if (price === "" || !Number.isSafeInteger(amount) || amount < 0) {
      setError("기본 단가는 0 이상의 정수로 입력해 주세요."); return;
    }
    onSave({ productName: name.trim(), productPrice: amount, productStatus: status });
  }

  return (
    <section className="pd-panel" aria-labelledby="pd-form-title">
      <h2 id="pd-form-title">{isEditing ? "상품 수정" : "상품 등록"}</h2>
      <form className="pd-form" aria-labelledby="pd-form-title" onSubmit={submit} onChange={() => setError("")}>
        <label>상품명<input autoFocus required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="예: 스테인리스 텀블러" /></label>
        <div className="pd-form-row">
          <label>기본 단가 (원)<input type="number" required min={0} max={Number.MAX_SAFE_INTEGER} step={1} value={price} onChange={event => setPrice(event.target.value)} placeholder="예: 8000" /></label>
          <label>판매 상태<select value={status} onChange={event => setStatus(event.target.value)}>
            <option value="판매 중">판매 중</option><option value="판매중지">판매 중지</option>
          </select></label>
        </div>
        {error && <p className="pd-error" role="alert">{error}</p>}
        <div className="pd-form-actions">
          <button className="pd-button" type="button" onClick={onCancel}>취소</button>
          <button className="pd-button pd-primary" type="submit">{isEditing ? "수정 저장" : "상품 저장"}</button>
        </div>
      </form>
    </section>
  );
}
