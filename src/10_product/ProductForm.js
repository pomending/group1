/* 입력값은 저장 전까지 이 폼에서 관리합니다. 취소하면 공통 상품 목록은 변경되지 않습니다.
 * 입력 → 이름·금액·중복·판매 상태 검증 → 부모 onSave로 전달
 * 검증 실패는 첫 오류의 입력칸 아래에 표시하고 초점을 옮깁니다. 해당 입력을 바꾸면 안내를 해제합니다.
 * products는 부모의 최신 Context 목록입니다. product는 신규 등록 시 빈 객체, 복사 등록 시 입력 세 필드입니다.
 * onSave에는 검증된 상품명·숫자 단가·판매 상태만 전달합니다. ID·날짜와 화면 상태는 포함하지 않습니다.
 * onSave가 오류 문구를 반환하면 창을 유지하고 안내합니다. 취소 확인은 이 화면의 취소 버튼에 적용합니다.
 */
import React, { useRef, useState } from "react";
import { PRODUCT_STATUS, productStatuses, normalizeProductName } from "./productData";

// 저장 데이터와 분리된 화면 문구입니다. 신규 등록·기존 수정·복사 등록을 구분합니다.
const formLabels = {
  create: { title: "상품 등록", cancelMessage: "작성 중인 새 상품을 저장하지 않고 등록을 취소할까요?" },
  edit: { title: "상품 수정", cancelMessage: "상품 수정 내용을 저장하지 않고 취소할까요?" },
  copy: { title: "상품 복사 등록", cancelMessage: "복사한 상품의 작성 내용을 저장하지 않고 취소할까요?" },
};

export default function ProductForm({ product, products, onSave, onCancel, mode = "create" }) {
  // 편집 시작값은 고정합니다. 다른 입력을 했다가 원래 값으로 되돌리면 취소 확인이 필요 없습니다.
  const [initial] = useState(() => ({
    name: product.productName || "",
    price: String(product.productPrice ?? ""),
    status: product.productStatus || PRODUCT_STATUS.SELLING,
  }));
  const [name, setName] = useState(initial.name);
  const [price, setPrice] = useState(initial.price);
  const [status, setStatus] = useState(initial.status);
  // 입력 문자열은 유지하고 유효한 정수만 읽기 쉬운 금액으로 미리 보여줍니다.
  const amount = Number(price);
  const pricePreview = price !== "" && Number.isSafeInteger(amount) && amount >= 0
    ? `${amount.toLocaleString("ko-KR")}원` : null;
  const [error, setError] = useState(null);
  const nameRef = useRef(null);
  const priceRef = useRef(null);
  const statusRef = useRef(null);
  const inputs = { name: nameRef, price: priceRef, status: statusRef };
  const isEditing = product.id != null;
  let labels = formLabels.create;
  if (mode === "copy") labels = formLabels.copy;
  if (isEditing) labels = formLabels.edit;
  const { title, cancelMessage } = labels;

  // 첫 오류의 입력칸과 문구를 연결하고, 키보드로 바로 고칠 수 있도록 초점을 이동합니다.
  function showError(field, message) {
    setError({ field, message });
    inputs[field]?.current?.focus();
  }
  const errorProps = field => ({
    "aria-invalid": error?.field === field || undefined,
    "aria-describedby": [field !== "status" && `pd-${field}-hint`,
      error?.field === field && `pd-${field}-error`].filter(Boolean).join(" ") || undefined,
  });
  function fieldError(field) {
    if (error?.field !== field) return null;
    return <p id={`pd-${field}-error`} className="pd-error" role="alert">{error.message}</p>;
  }

  // 해당 입력의 오류와 폼 전체 오류만 해제합니다. 다른 입력의 오류는 그대로 둡니다.
  function clearInputError(event) {
    const field = event.target.name;
    setError(current => {
      if (!current?.field || current.field === field) return null;
      return current;
    });
  }

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) { showError("name", "상품명을 입력해 주세요."); return; }
    if (name.length > 100) { showError("name", "상품명은 100자 이내로 입력해 주세요."); return; }
    if (price === "" || !Number.isSafeInteger(amount) || amount < 0) {
      showError("price", "기본 단가는 0 이상의 정수로 입력해 주세요."); return;
    }
    // 앞뒤 공백·영문 대소문자·동일한 유니코드 표기를 정리해 비교하고 수정 중인 상품은 제외합니다.
    if (products.some(item => item.id !== product.id && normalizeProductName(item.productName) === normalizeProductName(name))) {
      showError("name", "이미 등록된 상품명입니다. 다른 이름을 입력해 주세요."); return;
    }
    if (!productStatuses.some(option => option.value === status)) { showError("status", "판매 상태를 선택해 주세요."); return; }
    const message = onSave({ productName: name.trim(), productPrice: amount, productStatus: status });
    if (message) setError({ field: null, message });
  }

  function cancel() {
    const changed = name !== initial.name || String(price) !== initial.price || status !== initial.status;
    if (changed && !window.confirm(cancelMessage)) return;
    onCancel();
  }

  return (
    <section className="pd-panel" aria-labelledby="pd-form-title">
      <h2 id="pd-form-title">{title}</h2>
      <p className="pd-muted pd-form-intro">상품명과 기본 단가는 필수 입력 항목입니다.</p>
      {/* noValidate로 브라우저 팝업 대신 동일한 검증 순서·인접 문구를 사용합니다. 검증은 submit에서 수행합니다. */}
      <form
        className="pd-form"
        aria-labelledby="pd-form-title"
        noValidate
        onSubmit={submit}
        onChange={clearInputError}
      >
        <div className="pd-field"><div className="pd-field-label"><label htmlFor="pd-name">상품명</label><span className="pd-required" aria-hidden="true">필수</span></div>
          <input id="pd-name" name="name" ref={nameRef} autoFocus required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="예: 스테인리스 텀블러" {...errorProps("name")} />
          <p id="pd-name-hint" className="pd-field-hint"><span>최대 100자 · 앞뒤 공백은 저장 시 제거됩니다.</span><span>{name.length} / 100자</span></p>
          {fieldError("name")}
        </div>
        <div className="pd-form-row">
          <div className="pd-field"><div className="pd-field-label"><label htmlFor="pd-price">기본 단가 (원)</label><span className="pd-required" aria-hidden="true">필수</span></div>
            <input id="pd-price" name="price" ref={priceRef} type="number" required min={0} max={Number.MAX_SAFE_INTEGER} step={1} value={price} onChange={event => setPrice(event.target.value)} placeholder="예: 8000" {...errorProps("price")} />
            <p id="pd-price-hint" className="pd-field-hint">원 단위로 0 이상의 정수를 입력해 주세요.</p>
            {pricePreview !== null && <p className="pd-price-preview">입력 금액: {pricePreview}</p>}
            {fieldError("price")}
          </div>
          <div className="pd-field"><label htmlFor="pd-status">판매 상태</label>
            <select id="pd-status" name="status" ref={statusRef} value={status} onChange={event => setStatus(event.target.value)} {...errorProps("status")}>
              {productStatuses.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            {fieldError("status")}
          </div>
        </div>
        {error && !error.field && <p className="pd-error" role="alert">{error.message}</p>}
        <div className="pd-form-actions">
          <button className="pd-button" type="button" onClick={cancel}>취소</button>
          <button className="pd-button pd-primary" type="submit">{isEditing ? "수정 저장" : "등록 저장"}</button>
        </div>
      </form>
    </section>
  );
}
