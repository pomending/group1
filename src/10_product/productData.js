/* 상품 데이터의 선택·갱신·표시 규칙입니다. 입력 원본을 변경하거나 Context·저장소에 직접 쓰지 않습니다. */
// 폼 저장과 복사에 사용하는 세 필드입니다. ID·날짜·검색 조건·편집 모드는 전달하지 않습니다.
export function getProductInput(product) {
  return {
    productName: product.productName,
    productPrice: product.productPrice,
    productStatus: product.productStatus,
  };
}

// 최신 Context 목록을 받아 해당 상품의 변경 필드와 수정일만 갱신한 배열을 반환합니다.
// 호출부에서 정한 변경 필드 외의 ID·등록일·추가 정보와 다른 상품은 보존합니다.
export function updateProduct(products, id, changes, updatedAt) {
  return products.map(product => product.id === id
    && Object.keys(changes).some(key => product[key] !== changes[key])
    ? { ...product, ...changes, productUpdatedAt: updatedAt }
    : product);
}

// 검색과 이름 중복 검사는 같은 기준을 사용합니다. 저장된 원래 이름은 변경하지 않습니다.
export const normalizeProductName = value => value.trim().normalize().toLocaleLowerCase("ko-KR");

// 빈 경계는 제한 없음이며 양 끝 금액도 포함합니다. 잘못된 범위를 임의로 뒤집지 않습니다.
export function getProductPriceRange(minValue, maxValue) {
  const min = minValue === "" ? 0 : Number(minValue);
  const max = maxValue === "" ? Infinity : Number(maxValue);
  if (!Number.isSafeInteger(min) || min < 0
    || (maxValue !== "" && (!Number.isSafeInteger(max) || max < 0))) {
    return { min, max, error: "단가는 0 이상의 정수로 입력해 주세요." };
  }
  if (min > max) return { min, max, error: "최소 단가는 최대 단가 이하여야 합니다." };
  return { min, max, error: "" };
}

export const PRODUCT_STATUS = {
  SELLING: "판매 중",
  STOPPED: "판매중지",
};

// 저장값은 기존 Context와 호환되도록 유지합니다. 표시 문구의 띄어쓰기는 여기서만 정합니다.
export const productStatuses = [
  { value: PRODUCT_STATUS.SELLING, label: "판매 중", badgeClass: "pd-selling", actionLabel: "판매 중지", nextValue: PRODUCT_STATUS.STOPPED },
  { value: PRODUCT_STATUS.STOPPED, label: "판매 중지", badgeClass: "pd-stopped", actionLabel: "판매 재개", nextValue: PRODUCT_STATUS.SELLING },
];

export function getProductStatus(value) {
  return productStatuses.find(option => option.value === value) || {
    value, label: value || "미지정", badgeClass: "pd-stopped", actionLabel: "판매 재개", nextValue: PRODUCT_STATUS.SELLING,
  };
}

const productDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

// 날짜만 있는 기존 자료는 한국 자정으로 해석합니다. 잘못된 날짜는 표시와 정렬에서 같은 기준으로 제외합니다.
function parseProductDate(value) {
  if (typeof value !== "string" || !value) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00+09:00` : value);
  if (!Number.isFinite(date.getTime())) return null;
  const parts = Object.fromEntries(productDateFormatter.formatToParts(date).map(part => [part.type, part.value]));
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  if (dateOnly && day !== value) return null;
  return { date, dateOnly, parts, day };
}

// 저장된 ISO 시각은 유지하고 표시만 한국 시간으로 변환합니다. 날짜만 있는 자료에 시각을 만들어 표시하지 않습니다.
export function formatProductDate(value, withTime = false) {
  const parsed = parseProductDate(value);
  if (!parsed) return "—";
  const { dateOnly, parts, day } = parsed;
  return withTime && !dateOnly ? `${day} ${parts.hour}:${parts.minute}:${parts.second}` : day;
}

// 문자열 순서 대신 실제 시각으로 비교합니다. 날짜가 없거나 잘못된 항목은 양쪽 정렬 모두 마지막에 둡니다.
export function compareProductDates(left, right, newestFirst = true) {
  const a = parseProductDate(left);
  const b = parseProductDate(right);
  if (!a) return b ? 1 : 0;
  if (!b) return -1;
  return newestFirst ? b.date - a.date : a.date - b.date;
}

// Excel에서도 한글을 읽도록 BOM을 넣고 쉼표·따옴표·줄바꿈을 CSV 규칙으로 감쌉니다.
export function createProductCsv(products) {
  const cell = value => {
    let text = String(value ?? "");
    // 상품명이 계산식으로 실행되지 않고 문자 그대로 열리도록 처리합니다.
    if (typeof value === "string" && (/^\s*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text))) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const rows = [["상품 번호", "상품명", "기본 단가 (원)", "판매 상태", "등록일 (한국 시간)", "최종 수정일 (한국 시간)"],
    ...products.map(product => [
      product.id, product.productName, product.productPrice, getProductStatus(product.productStatus).label,
      formatProductDate(product.productCreatedAt, true), formatProductDate(product.productUpdatedAt, true),
    ])];
  return "\uFEFF" + rows.map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
