import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { productImages, findProductImage as catalogImage } from "./productImages";

const isImageAddress = value => typeof value === "string"
  && /^(https?:\/\/|\/(?!\/)|data:image\/(png|jpeg|webp|gif);base64,)/i.test(value);

// 기본 이미지는 지정하지 않습니다. 선택한 이미지 ID만 상품별로 보관합니다.
// 이전에 PC에서 추가한 이미지도 읽으며 Context의 상품 정보는 수정하지 않습니다.
export default function ProductImage({ product }) {
  const storageKey = "erp_product_image:" + product.id;
  const [selectedImage, setImage] = useState(() => {
    try {
      const saved = product.id != null && localStorage.getItem(storageKey);
      if (typeof saved === "string" && (saved === "" || saved.startsWith("catalog:") || isImageAddress(saved))) return saved;
    } catch { /* 저장소 접근이 막혀도 화면에서 이미지를 선택할 수 있습니다. */ }
    return null;
  });
  // 직접 고른 값이 없을 때만 상품에 저장된 주소를 사용합니다. 빈 문자열은 제거한 상태입니다.
  let imageValue = selectedImage;
  if (imageValue == null) {
    imageValue = typeof product.productImageUrl === "string" ? product.productImageUrl.trim() : "";
  }
  const selectedCatalogImage = catalogImage(imageValue);
  const image = selectedCatalogImage?.src || imageValue;
  const [message, setMessage] = useState("");
  const [failedAddress, setFailedAddress] = useState(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const triggerRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    function resetImage() {
      setImage(null);
      setFailedAddress(null);
      setMessage("");
      setOpen(false);
    }
    window.addEventListener("erp-product-images-reset", resetImage);
    return () => window.removeEventListener("erp-product-images-reset", resetImage);
  }, []);

  // 선택창 안으로 초점을 옮기고, 닫힐 때 원래 버튼으로 돌려줍니다.
  useEffect(() => {
    if (!open) return undefined;
    dialogRef.current?.querySelector("button")?.focus();
    const trigger = triggerRef.current;
    return () => trigger?.focus();
  }, [open]);

  function applyImage() {
    if (!pending) return;
    const value = "catalog:" + pending;
    setImage(value);
    setFailedAddress(null);
    setOpen(false);
    if (product.id == null) {
      setMessage("이미지를 적용했습니다. 상품 번호가 없어 이 화면에서만 유지됩니다.");
      return;
    }
    try {
      localStorage.setItem(storageKey, value);
      setMessage("이미지를 적용했습니다.");
    } catch {
      setMessage("이미지는 표시했지만 저장하지 못했습니다. 화면을 다시 열면 유지되지 않을 수 있습니다.");
    }
  }

  function removeImage() {
    // 빈 문자열은 기본 주소도 숨기는 명시적인 '이미지 없음' 선택입니다.
    // 먼저 저장하고 성공한 경우에만 화면을 바꿔 실패 시 기존 선택을 유지합니다.
    try {
      if (product.id != null) localStorage.setItem(storageKey, "");
      setImage("");
      setFailedAddress(null);
      setMessage("이미지를 제거했습니다.");
    } catch {
      setMessage("이미지 제거를 저장하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  function dialogKeys(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
    if (event.key !== "Tab") return;
    const buttons = Array.from(dialogRef.current.querySelectorAll("button:not(:disabled)"));
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function openImagePicker() {
    setPending(selectedCatalogImage?.id || null);
    setOpen(true);
  }

  const hasImage = selectedCatalogImage || isImageAddress(image);
  const visible = hasImage && failedAddress !== image;
  return (
    <section className="pd-image-section" aria-label="상품 이미지">
      {visible && <div className="pd-product-image">
        <img src={image} alt={product.productName + " 상품 이미지"}
          referrerPolicy="no-referrer" onError={() => setFailedAddress(image)} />
      </div>}
      <button ref={triggerRef} type="button" className="pd-button" aria-haspopup="dialog" onClick={openImagePicker}>
        {visible ? "이미지 변경" : "이미지 추가"}
      </button>
      {imageValue && <button type="button" className="pd-button" onClick={removeImage}>이미지 제거</button>}
      {image && !visible && <p className="pd-error" role="alert">이미지를 불러오지 못했습니다. 다른 이미지를 선택해 주세요.</p>}
      {message && <p className="pd-field-hint" role="status">{message}</p>}
      {open && createPortal(
        <div className="pd-app pd-image-overlay">
          <button type="button" className="pd-image-backdrop" aria-label="이미지 선택창 닫기" tabIndex={-1} onClick={() => setOpen(false)} />
          <section ref={dialogRef} className="pd-image-dialog" role="dialog" aria-modal="true"
            aria-labelledby="pd-image-picker-title" onKeyDown={dialogKeys}>
            <div className="pd-list-heading">
              <h2 id="pd-image-picker-title">상품 이미지 선택</h2>
              <button type="button" className="pd-button" onClick={() => setOpen(false)}>닫기</button>
            </div>
            <p className="pd-muted">이미지를 고른 뒤 적용을 눌러 주세요.</p>
            <div className="pd-image-grid">
              {productImages.map(item => <button key={item.id} type="button" className="pd-image-option"
                aria-pressed={pending === item.id} onClick={() => setPending(item.id)}>
                <img src={item.src} alt="" /><span>{item.name}</span>
              </button>)}
            </div>
            {productImages.length === 0 && <p className="pd-muted">선택할 이미지가 없습니다. images 폴더에 이미지 파일을 추가해 주세요.</p>}
            <div className="pd-form-actions">
              <button type="button" className="pd-button" onClick={() => setOpen(false)}>취소</button>
              <button type="button" className="pd-button pd-primary" disabled={!pending} onClick={applyImage}>적용</button>
            </div>
          </section>
        </div>, document.body,
      )}
    </section>
  );
}
