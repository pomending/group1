import React from "react";
import { act, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import ProductPage from "./ProductPage";
import { useERP } from "../context/ERPContext";
import { saveAs } from "file-saver";
import { createProductCsv, getProductInput } from "./productData";
import useProductData from "../context/useProductData";

// 조작만 공통화합니다. 검증과 시나리오의 순서는 각 테스트에 남깁니다.
function clickButton(name) {
  fireEvent.click(screen.getByRole("button", { name }));
}

function changeInput(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

test("전달 필드는 입력 세 개로 제한하고 원본 메타데이터와 화면 상태를 제외한다", () => {
  const source = {
    id: 50, productName: "상품", productPrice: 8000, productStatus: "판매 중",
    productCreatedAt: "2026-11-01", productUpdatedAt: "2026-11-02", editorMode: "copy", query: "검색",
  };
  const before = JSON.stringify(source);
  expect(getProductInput(source)).toEqual({ productName: "상품", productPrice: 8000, productStatus: "판매 중" });
  expect(JSON.stringify(source)).toBe(before);
});

test("공통 갱신은 대상 상품의 변경 필드·수정일만 바꾸고 다른 정보와 원본을 유지한다", () => {
  const source = [
    { id: 1, productName: "원본", productPrice: 8000, productStatus: "판매 중", productCreatedAt: "2026-11-01", extra: "유지" },
    { id: 2, productName: "다른 상품", productPrice: 900, productStatus: "판매 중" },
  ];
  const before = JSON.stringify(source);
  initialProducts = source;
  const { result } = renderHook(() => useProductData(source));
  const untouched = result.current.products[1];
  act(() => result.current.updateProduct({ id: 1, productPrice: 10000, productCreatedAt: "변경 금지", extra: "변경 금지" }));
  expect(result.current.products[0]).toEqual({ ...source[0], productPrice: 10000, productUpdatedAt: expect.any(String) });
  expect(Number.isFinite(Date.parse(result.current.products[0].productUpdatedAt))).toBe(true);
  expect(result.current.products[1]).toBe(untouched);
  expect(result.current.products[1]).toEqual(source[1]);
  expect(JSON.stringify(source)).toBe(before);
  const saved = result.current.products;
  act(() => result.current.updateProduct({ id: 1, productPrice: 10000 }));
  expect(result.current.products[0]).toBe(saved[0]);
  act(() => result.current.updateProduct({ id: 99, productPrice: 0 }));
  expect(result.current.products).toEqual(saved);
});

test("상품 Hook을 여러 곳에서 사용해도 같은 Context를 공유하며 연속 등록의 ID와 날짜를 자동 생성한다", () => {
  const SharedContext = React.createContext(null);
  function Wrapper({ children }) {
    const productData = useProductData(initialProducts);
    return <SharedContext.Provider value={productData}>{children}</SharedContext.Provider>;
  }
  useERP.mockImplementation(() => React.useContext(SharedContext));
  const original = JSON.stringify(initialProducts);
  const { result } = renderHook(() => ({ first: useERP(), second: useERP() }), { wrapper: Wrapper });
  const values = { productName: "[테스트] 공유 등록", productPrice: 1000, productStatus: "판매 중", id: 999, productCreatedAt: "변경 금지", query: "제외" };
  act(() => {
    result.current.first.addProduct(values);
    result.current.second.addProduct({ ...values, productName: "[테스트] 연속 등록" });
  });
  expect(result.current.first.products).toBe(result.current.second.products);
  expect(result.current.first.products.slice(2).map(product => product.id)).toEqual([3, 4]);
  expect(result.current.second.products[2]).toEqual({
    id: 3, productName: values.productName, productPrice: 1000, productStatus: "판매 중",
    productCreatedAt: expect.any(String), productUpdatedAt: "",
  });
  expect(Number.isFinite(Date.parse(result.current.second.products[2].productCreatedAt))).toBe(true);
  act(() => result.current.second.updateProduct({ id: 3, productStatus: "판매중지" }));
  expect(result.current.first.products[2].productStatus).toBe("판매중지");
  expect(JSON.stringify(initialProducts)).toBe(original);
});

test("상품 초기화는 초기 목록을 복구하고 mockData 원본과 다른 상태에는 쓰지 않는다", () => {
  const { result } = renderHook(() => useProductData(initialProducts));
  const before = JSON.stringify(initialProducts);
  expect(result.current.products[0]).not.toBe(initialProducts[0]);
  act(() => {
    result.current.addProduct({ productName: "[테스트] 초기화", productPrice: 1000, productStatus: "판매 중" });
    result.current.updateProduct({ id: 1, productPrice: 2000 });
  });
  expect(result.current.products).toHaveLength(3);
  act(() => result.current.resetProducts());
  expect(result.current.products).toEqual(initialProducts);
  expect(result.current.products[0]).not.toBe(initialProducts[0]);
  expect(JSON.stringify(initialProducts)).toBe(before);
});

test("실제 ERPProvider의 상품 초기화와 전체 초기화가 같은 상품 Hook을 갱신한다", () => {
  const { ERPProvider, useERP: useRealERP } = jest.requireActual("../context/ERPContext");
  const { result } = renderHook(() => useRealERP(), { wrapper: ERPProvider });
  const originalProducts = JSON.stringify(result.current.products);
  const originalProjects = JSON.stringify(result.current.projects);
  const values = { productName: "[테스트] Provider 초기화", productPrice: 1000, productStatus: "판매 중" };
  act(() => result.current.addProduct(values));
  expect(JSON.stringify(result.current.products)).not.toBe(originalProducts);
  act(() => result.current.resetProducts());
  expect(JSON.stringify(result.current.products)).toBe(originalProducts);
  expect(JSON.stringify(result.current.projects)).toBe(originalProjects);
  act(() => result.current.addProduct(values));
  act(() => result.current.resetAllData());
  expect(JSON.stringify(result.current.products)).toBe(originalProducts);
});

// 새 화면만 검사합니다. 실제 Context·브라우저 저장소·기존 상품에는 쓰지 않습니다.
jest.mock("../context/ERPContext", () => ({ useERP: jest.fn() }));
jest.mock("file-saver", () => ({ saveAs: jest.fn() }));
let currentContext;
let initialProducts;
beforeEach(() => {
  // jsdom의 가짜 상품 저장소만 검사마다 분리합니다. 실제 Chrome 저장소에는 접근하지 않습니다.
  localStorage.removeItem("erp_products");
  saveAs.mockReset();
  jest.spyOn(window, "confirm").mockReturnValue(true);
  initialProducts = [
    { id: 1, productName: "텀블러", productPrice: 8000, productStatus: "판매 중", productCreatedAt: "2026-09-01", productUpdatedAt: "" },
    { id: 2, productName: "스티커", productPrice: 900, productStatus: "판매중지", productCreatedAt: "2026-09-02", productUpdatedAt: "" },
  ];
  useERP.mockImplementation(function useTestProducts() {
    currentContext = useProductData(initialProducts);
    return currentContext;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.removeItem("erp_products");
});

test("판매 중지·등록·수정 결과는 재진입 후에도 저장된 상품 정보로 복구된다", () => {
  const view = renderHook(() => useProductData(initialProducts));
  act(() => {
    view.result.current.updateProduct({ id: 1, productStatus: "판매중지" });
    view.result.current.addProduct({ productName: "[테스트] 저장 유지", productPrice: 12345, productStatus: "판매 중" });
    view.result.current.updateProduct({ id: 3, productName: "[테스트] 저장 수정", productPrice: 0 });
  });
  const saved = JSON.stringify(view.result.current.products);
  expect(localStorage.getItem("erp_products")).toBe(saved);
  view.unmount();
  const { result } = renderHook(() => useProductData(initialProducts));
  expect(JSON.stringify(result.current.products)).toBe(saved);
  expect(result.current.products[0].productStatus).toBe("판매중지");
  expect(result.current.products[2]).toMatchObject({ id: 3, productName: "[테스트] 저장 수정", productPrice: 0 });
  expect(result.current.productStorageError).toBe("");
});

test("저장된 빈 목록을 초기 상품으로 채우지 않으며 명시적 초기화는 상품 저장소만 갱신한다", () => {
  localStorage.setItem("erp_products", "[]");
  localStorage.setItem("[테스트] 다른 저장소", "유지");
  const { result } = renderHook(() => useProductData(initialProducts));
  expect(result.current.products).toEqual([]);
  act(() => result.current.resetProducts());
  expect(result.current.products).toEqual(initialProducts);
  expect(JSON.parse(localStorage.getItem("erp_products"))).toEqual(initialProducts);
  expect(localStorage.getItem("[테스트] 다른 저장소")).toBe("유지");
  localStorage.removeItem("[테스트] 다른 저장소");
});

test.each(["{broken", "{}", '[{"id":1}]'])("손상된 상품 저장값 %s는 덮어쓰지 않고 변경 저장을 차단한다", raw => {
  localStorage.setItem("erp_products", raw);
  const { result } = renderHook(() => useProductData(initialProducts));
  expect(result.current.productStorageError).toContain("읽지 못했습니다");
  const before = result.current.products;
  let outcome;
  act(() => { outcome = result.current.updateProduct({ id: 1, productStatus: "판매중지" }); });
  expect(outcome).toMatchObject({ ok: false, field: null });
  expect(result.current.products).toBe(before);
  expect(localStorage.getItem("erp_products")).toBe(raw);
});

test("상품 저장 실패는 성공으로 반환하지 않고 원본을 유지하며 재시도 성공 시 오류를 해제한다", () => {
  localStorage.setItem("erp_products", JSON.stringify(initialProducts));
  const { result } = renderHook(() => useProductData(initialProducts));
  const before = result.current.products;
  const originalSet = Storage.prototype.setItem;
  const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(function(key, value) {
    if (key === "erp_products") throw new Error("quota");
    return originalSet.call(this, key, value);
  });
  let outcome;
  act(() => { outcome = result.current.updateProduct({ id: 1, productStatus: "판매중지" }); });
  expect(outcome).toMatchObject({ ok: false, field: null });
  expect(result.current.productStorageError).toContain("저장하지 못했습니다");
  expect(result.current.products).toBe(before);
  expect(JSON.parse(localStorage.getItem("erp_products"))).toEqual(initialProducts);
  write.mockRestore();
  act(() => { outcome = result.current.updateProduct({ id: 1, productStatus: "판매중지" }); });
  expect(outcome).toMatchObject({ ok: true, changed: true });
  expect(result.current.productStorageError).toBe("");
  expect(JSON.parse(localStorage.getItem("erp_products"))[0].productStatus).toBe("판매중지");
});

test("화면에서 상품 저장이 실패하면 입력을 유지하고 재시도 때만 등록한다", () => {
  const originalSet = Storage.prototype.setItem;
  const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(function(key, value) {
    if (key === "erp_products") throw new Error("quota");
    return originalSet.call(this, key, value);
  });
  render(<ProductPage />);
  clickButton("+ 상품 등록");
  changeInput("상품명", "[테스트] 저장 재시도");
  changeInput("기본 단가 (원)", "1000");
  clickButton("등록 저장");
  expect(screen.getByLabelText("상품명")).toHaveValue("[테스트] 저장 재시도");
  expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  expect(screen.queryByRole("status", { name: "상품 처리 결과" })).not.toBeInTheDocument();
  expect(currentContext.products).toHaveLength(2);
  write.mockRestore();
  clickButton("등록 저장");
  expect(currentContext.products).toHaveLength(3);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("erp_products"))).toHaveLength(3);
});

test("단가만 해제하면 다른 조회 조건을 유지하고 첫 페이지로 돌아가며 잘못된 범위도 해제된다", () => {
  initialProducts = makeProducts(23);
  render(<ProductPage />);
  const before = JSON.stringify(currentContext.products);
  changeInput("상품명·번호 검색", "상품");
  changeInput("판매 상태", "판매 중");
  changeInput("정렬", "priceAsc");
  fireEvent.click(screen.getByText("추가 검색 조건"));
  changeInput("최소 단가 (원)", "100");
  changeInput("최대 단가 (원)", "2300");
  clickButton("다음");
  clickButton("단가 조건 해제");
  expect(screen.getByLabelText("최소 단가 (원)")).toHaveValue(null);
  expect(screen.getByLabelText("최대 단가 (원)")).toHaveValue(null);
  expect(screen.getByLabelText("최소 단가 (원)")).toHaveFocus();
  expect(screen.getByRole("button", { name: "단가 조건 해제" })).toBeDisabled();
  expect(screen.getByLabelText("현재 상품 페이지")).toHaveTextContent("1 / 2 페이지");
  changeInput("최소 단가 (원)", "1000");
  changeInput("최대 단가 (원)", "500");
  expect(screen.getByRole("alert")).toBeInTheDocument();
  clickButton("단가 조건 해제");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByLabelText("상품명·번호 검색")).toHaveValue("상품");
  expect(screen.getByLabelText("판매 상태")).toHaveValue("판매 중");
  expect(screen.getByLabelText("정렬")).toHaveValue("priceAsc");
  expect(screen.getByRole("status", { name: "상품 조회 결과" })).toHaveTextContent("조회 12건");
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test("번호 검색은 전체 번호로 비교하고 이름 부분 검색과 상태·단가 조건도 함께 적용한다", async () => {
  initialProducts = [
    { ...initialProducts[0], id: 12, productName: "에코백", productPrice: 5000 },
    { ...initialProducts[0], id: 123, productName: "머그컵", productPrice: 6000 },
    { ...initialProducts[1], id: 30, productName: "행사12 상품", productPrice: 7000 },
  ];
  render(<ProductPage />);
  const before = JSON.stringify(currentContext.products);
  changeInput("상품명·번호 검색", " 12 ");
  expect(screen.getByRole("button", { name: "에코백 수정" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "행사12 상품 수정" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "머그컵 수정" })).not.toBeInTheDocument();
  changeInput("판매 상태", "판매 중");
  changeInput("최소 단가 (원)", "6000");
  expect(screen.getByRole("status", { name: "상품 조회 결과" })).toHaveTextContent("조회 0건");
  changeInput("최소 단가 (원)", "5000");
  expect(screen.getByRole("status", { name: "상품 조회 결과" })).toHaveTextContent("조회 1건");
  clickButton("CSV 내보내기");
  const [blob] = saveAs.mock.calls[0];
  const text = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });
  expect(text).toContain('"12","에코백"');
  expect(text).not.toContain('"123","머그컵"');
  expect(text).not.toContain("행사12 상품");
  changeInput("상품명·번호 검색", "에코");
  expect(screen.getByRole("button", { name: "에코백 수정" })).toBeInTheDocument();
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test("상세의 판매 상태 변경은 취소 시 유지하고 승인 시 상세·목록·수정일에 함께 반영된다", () => {
  render(<ProductPage />);
  const before = JSON.stringify(currentContext.products);
  clickButton("텀블러 상세 보기");
  const detail = screen.getByRole("region", { name: "상품 상세" });
  window.confirm.mockReturnValue(false);
  clickButton("텀블러 판매 중지");
  expect(window.confirm).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(currentContext.products)).toBe(before);
  window.confirm.mockReturnValue(true);
  clickButton("텀블러 판매 중지");
  expect(within(detail).getByText("판매 중지")).toBeInTheDocument();
  expect(screen.getByRole("status", { name: "상품 처리 결과" })).toHaveTextContent("판매 상태를 판매 중지로 변경했습니다.");
  expect(within(detail).getByRole("button", { name: "텀블러 판매 재개" })).toBeInTheDocument();
  expect(currentContext.products[0].productUpdatedAt).not.toBe("");
  expect(currentContext.products[1]).toEqual(initialProducts[1]);
  clickButton("목록으로");
  expect(screen.getByRole("button", { name: "텀블러 판매 재개" })).toBeInTheDocument();
  changeInput("판매 상태", "판매중지");
  clickButton("텀블러 상세 보기");
  clickButton("텀블러 판매 재개");
  expect(screen.getByRole("region", { name: "상품 상세" })).toBeInTheDocument();
  expect(currentContext.products[0].productStatus).toBe("판매 중");
  expect(screen.getByRole("status", { name: "상품 처리 결과" })).toHaveTextContent("판매 상태를 판매 중으로 변경했습니다.");
  clickButton("목록으로");
  expect(screen.getByLabelText("판매 상태")).toHaveValue("판매중지");
  expect(screen.queryByRole("button", { name: "텀블러 상세 보기" })).not.toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "상품 목록" })).toHaveFocus();
});

test("상세 상태 변경 실패는 성공 안내 없이 현재 정보를 유지한다", () => {
  useERP.mockImplementation(function useFailedUpdate() {
    currentContext = useProductData(initialProducts);
    return { ...currentContext, updateProduct: () => ({ ok: false, field: null, message: "[테스트] 변경 실패" }) };
  });
  render(<ProductPage />);
  const before = JSON.stringify(currentContext.products);
  clickButton("텀블러 상세 보기");
  clickButton("텀블러 판매 중지");
  expect(screen.getByRole("status", { name: "상품 처리 결과" })).toHaveTextContent("[테스트] 변경 실패");
  expect(screen.getByRole("button", { name: "텀블러 판매 중지" })).toBeInTheDocument();
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test.each([
  [{ productName: "   " }, "productName"],
  [{ productName: "가".repeat(101) }, "productName"],
  [{ productName: " 텀블러 " }, "productName"],
  [{ productPrice: "" }, "productPrice"],
  [{ productPrice: "   " }, "productPrice"],
  [{ productPrice: null }, "productPrice"],
  [{ productPrice: true }, "productPrice"],
  [{ productPrice: -1 }, "productPrice"],
  [{ productPrice: 1.5 }, "productPrice"],
  [{ productPrice: Number.MAX_SAFE_INTEGER + 1 }, "productPrice"],
  [{ productStatus: "알 수 없음" }, "productStatus"],
])("화면 밖에서 등록해도 잘못된 상품을 차단한다: %j", (changes, field) => {
  const { result } = renderHook(() => useProductData(initialProducts));
  const before = result.current.products;
  let outcome;
  act(() => {
    outcome = result.current.addProduct({ productName: "[테스트] 공통 검증", productPrice: 1000, productStatus: "판매 중", ...changes });
  });
  expect(outcome).toMatchObject({ ok: false, field, message: expect.any(String) });
  expect(result.current.products).toBe(before);
});

test("부분 수정도 중복·값을 검증하고 실패 시 수정일과 원본을 유지한다", () => {
  const { result } = renderHook(() => useProductData(initialProducts));
  const before = result.current.products;
  for (const [changes, field] of [
    [{ productName: "스티커" }, "productName"],
    [{ productPrice: "bad" }, "productPrice"],
    [{ productStatus: "bad" }, "productStatus"],
  ]) {
    let outcome;
    act(() => { outcome = result.current.updateProduct({ id: 1, ...changes }); });
    expect(outcome).toMatchObject({ ok: false, field });
    expect(result.current.products).toBe(before);
  }
  let missing;
  act(() => { missing = result.current.updateProduct({ id: 99, productPrice: 1000 }); });
  expect(missing).toMatchObject({ ok: false, field: null, message: expect.stringContaining("찾을 수 없습니다") });
});

test("공통 검증은 연속 호출에서도 중복을 막고 정리된 값과 성공·변경 여부를 반환한다", () => {
  const { result } = renderHook(() => useProductData(initialProducts));
  const add = result.current.addProduct;
  let first, duplicate;
  act(() => {
    first = add({ productName: "  [테스트] Batch  ", productPrice: "12000", productStatus: "판매 중" });
    duplicate = add({ productName: "[테스트] BATCH", productPrice: 1000, productStatus: "판매 중" });
  });
  expect(first).toMatchObject({ ok: true, changed: true, product: { id: 3, productName: "[테스트] Batch", productPrice: 12000 } });
  expect(duplicate).toMatchObject({ ok: false, field: "productName" });
  expect(result.current.products).toHaveLength(3);
  const saved = result.current.products;
  let unchanged;
  act(() => { unchanged = result.current.updateProduct({ id: 3, productName: " [테스트] Batch ", productPrice: "12000" }); });
  expect(unchanged).toMatchObject({ ok: true, changed: false, product: saved[2] });
  expect(result.current.products).toBe(saved);
  const update = result.current.updateProduct;
  let conflict;
  act(() => {
    update({ id: 1, productName: "[테스트] 연속 수정" });
    conflict = update({ id: 2, productName: " [테스트] 연속 수정 " });
  });
  expect(conflict).toMatchObject({ ok: false, field: "productName" });
  expect(result.current.products[1]).toEqual(initialProducts[1]);
});

test("단가 범위는 양 끝을 포함하고 페이지·조회·상태 조건에 함께 적용되며 초기화된다", () => {
  initialProducts = makeProducts(23);
  render(<ProductPage />);
  const before = JSON.stringify(currentContext.products);
  changeInput("정렬", "priceAsc");
  clickButton("다음");
  const details = screen.getByRole("group", { name: "단가 범위 검색" });
  const toggle = within(details).getByText("추가 검색 조건");
  fireEvent.click(toggle);
  changeInput("최소 단가 (원)", "300");
  changeInput("최대 단가 (원)", "1500");
  expect(screen.getByLabelText("현재 상품 페이지")).toHaveTextContent("1 / 2 페이지");
  const table = screen.getByRole("region", { name: "상품 목록 표" });
  expect(within(table).getByRole("button", { name: "상품03 수정" })).toBeInTheDocument();
  expect(within(table).queryByRole("button", { name: "상품02 수정" })).not.toBeInTheDocument();
  clickButton("다음");
  expect(within(table).getByRole("button", { name: "상품15 수정" })).toBeInTheDocument();
  expect(within(table).queryByRole("button", { name: "상품16 수정" })).not.toBeInTheDocument();
  expect(screen.getByRole("status", { name: "상품 조회 결과" })).toHaveTextContent("단가 300원부터 1,500원까지, 조회 13건");
  fireEvent.click(toggle);
  expect(details).not.toHaveAttribute("open");
  changeInput("판매 상태", "판매 중");
  expect(screen.getByRole("status", { name: "상품 조회 결과" })).toHaveTextContent("조회 7건");
  expect(currentContext.products).toEqual(initialProducts);
  clickButton("초기화");
  expect(screen.getByLabelText("최소 단가 (원)")).toHaveValue(null);
  expect(screen.getByLabelText("최대 단가 (원)")).toHaveValue(null);
  expect(screen.getByRole("status", { name: "상품 조회 결과" })).toHaveTextContent("조회 23건");
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test.each([
  ["1000", "500", "최소 단가는 최대 단가 이하여야 합니다."],
  ["-1", "", "단가는 0 이상의 정수로 입력해 주세요."],
  ["", "1.5", "단가는 0 이상의 정수로 입력해 주세요."],
  ["9007199254740992", "", "단가는 0 이상의 정수로 입력해 주세요."],
])("잘못된 단가 범위 %s~%s는 안내하고 CSV를 차단하며 조건 초기화로 복구된다", (min, max, message) => {
  render(<ProductPage />);
  changeInput("최소 단가 (원)", min);
  changeInput("최대 단가 (원)", max);
  expect(screen.getByRole("alert")).toHaveTextContent(message);
  expect(screen.getByRole("button", { name: "CSV 내보내기" })).toBeDisabled();
  clickButton("검색 조건 초기화");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "CSV 내보내기" })).toBeEnabled();
  expect(currentContext.products).toEqual(initialProducts);
});

test("0원과 한쪽 경계·같은 경계를 처리하고 신규 등록 시 단가 조건을 해제한다", () => {
  initialProducts[0].productPrice = 0;
  render(<ProductPage />);
  changeInput("최대 단가 (원)", "0");
  expect(screen.getByRole("status", { name: "상품 조회 결과" })).toHaveTextContent("조회 1건");
  changeInput("최소 단가 (원)", "0");
  expect(screen.getByRole("button", { name: "텀블러 수정" })).toBeInTheDocument();
  changeInput("최대 단가 (원)", "");
  expect(screen.getByRole("status", { name: "상품 조회 결과" })).toHaveTextContent("조회 2건");
  changeInput("최소 단가 (원)", "900");
  expect(screen.queryByRole("button", { name: "텀블러 수정" })).not.toBeInTheDocument();
  clickButton("스티커 수정");
  clickButton("취소");
  expect(screen.getByLabelText("최소 단가 (원)")).toHaveValue(900);
  clickButton("+ 상품 등록");
  changeInput("상품명", "[테스트] 범위 밖 신규");
  changeInput("기본 단가 (원)", "100");
  clickButton("등록 저장");
  expect(screen.getByLabelText("최소 단가 (원)")).toHaveValue(null);
  expect(screen.getByRole("button", { name: "[테스트] 범위 밖 신규 수정" })).toBeInTheDocument();
});

test("CSV는 단가 범위와 정렬이 적용된 결과만 내보낸다", async () => {
  initialProducts = makeProducts(23);
  render(<ProductPage />);
  changeInput("최소 단가 (원)", "300");
  changeInput("최대 단가 (원)", "500");
  changeInput("정렬", "priceDesc");
  clickButton("CSV 내보내기");
  const [blob] = saveAs.mock.calls[0];
  const text = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });
  expect(text.trim().split("\r\n")).toHaveLength(4);
  expect(text.indexOf("상품05")).toBeLessThan(text.indexOf("상품03"));
  expect(text).not.toContain("상품02");
  expect(text).not.toContain("상품06");
  expect(currentContext.products).toEqual(initialProducts);
});

test("최근 수정순은 실제 시각을 비교하고 빈 날짜·잘못된 날짜는 뒤에서 ID순으로 표시한다", () => {
  initialProducts = makeProducts(5).map((product, index) => ({
    ...product, productUpdatedAt: ["", "2026-11-03T16:00:00Z", "2026-11-04T00:30:00+09:00", "invalid", "2026-11-03T16:00:00Z"][index],
  }));
  render(<ProductPage />);
  changeInput("정렬", "updated");
  const table = screen.getByRole("region", { name: "상품 목록 표" });
  const rows = within(table).getAllByRole("row").slice(1);
  ["상품02", "상품05", "상품03", "상품01", "상품04"].forEach((name, index) => {
    expect(within(rows[index]).getByRole("button", { name: `${name} 수정` })).toBeInTheDocument();
  });
  expect(currentContext.products).toEqual(initialProducts);
});

test("현황 카드와 상태 선택은 동기화되고 검색·정렬은 유지한 채 첫 페이지로 이동한다", () => {
  initialProducts = makeProducts(23);
  render(<ProductPage />);
  const before = JSON.stringify(currentContext.products);
  const cards = screen.getByRole("region", { name: "상품 현황" });
  const selling = within(cards).getByRole("button", { name: /^판매 중 12\s*개$/ });
  const stopped = within(cards).getByRole("button", { name: /^판매 중지 11\s*개$/ });
  const all = within(cards).getByRole("button", { name: /^전체 상품 23\s*개$/ });
  changeInput("상품명·번호 검색", "상품");
  changeInput("정렬", "priceAsc");
  clickButton("다음");
  fireEvent.click(selling);
  expect(screen.getByLabelText("현재 상품 페이지")).toHaveTextContent("1 / 2 페이지");
  expect(screen.getByLabelText("판매 상태")).toHaveValue("판매 중");
  expect(selling).toHaveAttribute("aria-pressed", "true");
  changeInput("판매 상태", "판매중지");
  expect(stopped).toHaveAttribute("aria-pressed", "true");
  expect(selling).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(all);
  expect(all).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByLabelText("상품명·번호 검색")).toHaveValue("상품");
  expect(screen.getByLabelText("정렬")).toHaveValue("priceAsc");
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test("금액 미리보기는 유효한 정수만 표시하고 입력·저장은 숫자 형식을 유지한다", () => {
  render(<ProductPage />);
  clickButton("+ 상품 등록");
  const price = screen.getByLabelText("기본 단가 (원)");
  expect(screen.queryByText(/^입력 금액:/)).not.toBeInTheDocument();
  for (const value of ["-1", "1.5", "9007199254740992"]) {
    fireEvent.change(price, { target: { value } });
    expect(screen.queryByText(/^입력 금액:/)).not.toBeInTheDocument();
  }
  fireEvent.change(price, { target: { value: "0" } });
  expect(screen.getByText("입력 금액: 0원")).toBeInTheDocument();
  fireEvent.change(price, { target: { value: "12000" } });
  expect(screen.getByText("입력 금액: 12,000원")).toBeInTheDocument();
  expect(price).toHaveValue(12000);
  expect(currentContext.products).toHaveLength(2);
  changeInput("상품명", "[테스트] 금액");
  clickButton("등록 저장");
  expect(currentContext.products.find(product => product.productName === "[테스트] 금액").productPrice).toBe(12000);
});

test("조회 안내는 결과 건수가 같아도 검색어와 판매 상태 변경을 포함한다", () => {
  render(<ProductPage />);
  const result = screen.getByRole("status", { name: "상품 조회 결과" });
  expect(result).toHaveAttribute("aria-live", "polite");
  expect(result).toHaveAttribute("aria-atomic", "true");
  changeInput("상품명·번호 검색", "텀블러");
  expect(result).toHaveTextContent("검색어 텀블러, 전체 상태, 조회 1건");
  changeInput("상품명·번호 검색", "스티커");
  expect(result).toHaveTextContent("검색어 스티커, 전체 상태, 조회 1건");
  changeInput("판매 상태", "판매 중");
  expect(result).toHaveTextContent("검색어 스티커, 판매 중, 조회 0건");
});

test.each([
  ["등록", "작성 중인 새 상품을 저장하지 않고 등록을 취소할까요?"],
  ["수정", "상품 수정 내용을 저장하지 않고 취소할까요?"],
  ["복사", "복사한 상품의 작성 내용을 저장하지 않고 취소할까요?"],
])("%s 상황에 맞는 취소 확인을 표시하고 거절하면 입력을 유지한다", (mode, message) => {
  render(<ProductPage />);
  const before = JSON.stringify(currentContext.products);
  if (mode === "등록") clickButton("+ 상품 등록");
  else if (mode === "수정") clickButton("텀블러 수정");
  else {
    clickButton("텀블러 상세 보기");
    fireEvent.click(screen.getByRole("button", { name: "상품 복사", exact: true }));
  }
  changeInput("기본 단가 (원)", "5000");
  window.confirm.mockReturnValue(false);
  clickButton("취소");
  expect(window.confirm).toHaveBeenCalledWith(message);
  expect(screen.getByLabelText("기본 단가 (원)")).toHaveValue(5000);
  window.confirm.mockReturnValue(true);
  clickButton("취소");
  expect(screen.queryByRole("form")).not.toBeInTheDocument();
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test("CSV 내보내기는 현재 페이지가 아닌 필터 결과 전체를 정렬순으로 내려받는다", async () => {
  initialProducts = makeProducts(23);
  render(<ProductPage />);
  changeInput("상품명·번호 검색", "상품");
  changeInput("판매 상태", "판매 중");
  changeInput("정렬", "priceAsc");
  fireEvent.click(screen.getByRole("button", { name: "다음", exact: true }));
  const before = JSON.stringify(currentContext.products);
  clickButton("CSV 내보내기");
  expect(saveAs).toHaveBeenCalledTimes(1);
  const [blob, filename] = saveAs.mock.calls[0];
  expect(filename).toMatch(/^상품목록_\d{4}-\d{2}-\d{2}\.csv$/);
  const text = await new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });
  expect(text.trim().split("\r\n")).toHaveLength(13);
  expect(text.indexOf("상품01")).toBeLessThan(text.indexOf("상품23"));
  expect(text).not.toContain("상품02");
  expect(screen.getByRole("status", { name: "현재 상품 페이지" })).toHaveTextContent("2 / 2 페이지");
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test("CSV는 한글·따옴표·줄바꿈과 계산식처럼 보이는 상품명을 문자로 보존한다", () => {
  const csv = createProductCsv([
    { ...initialProducts[0], productName: '이름, "따옴표"\n다음줄' },
    { ...initialProducts[1], productName: "=1+1" },
  ]);
  expect(csv.charCodeAt(0)).toBe(0xFEFF);
  expect(csv).toContain('"이름, ""따옴표""\n다음줄"');
  expect(csv).toContain('"\'=1+1"');
  expect(csv).toContain('"8000"');
});

test("빈 결과에서는 내보내기를 막고 다운로드 실패 시 목록을 유지한다", () => {
  render(<ProductPage />);
  changeInput("상품명·번호 검색", "없음");
  expect(screen.getByRole("button", { name: "CSV 내보내기" })).toBeDisabled();
  clickButton("초기화");
  saveAs.mockImplementation(() => { throw new Error("download failed"); });
  clickButton("CSV 내보내기");
  expect(screen.getByRole("status", { name: "상품 처리 결과" })).toHaveTextContent("다운로드를 시작하지 못했습니다");
  expect(currentContext.products).toHaveLength(2);
});

test("상품 복사는 저장 전에는 목록을 변경하지 않고 새 이름·ID·등록일로만 생성한다", () => {
  render(<ProductPage />);
  const original = JSON.stringify(currentContext.products);
  clickButton("텀블러 상세 보기");
  fireEvent.click(screen.getByRole("button", { name: "상품 복사", exact: true }));
  expect(screen.getByLabelText("상품명")).toHaveValue("텀블러");
  expect(screen.getByLabelText("기본 단가 (원)")).toHaveValue(8000);
  expect(JSON.stringify(currentContext.products)).toBe(original);
  clickButton("등록 저장");
  expect(screen.getByRole("alert")).toHaveTextContent("이미 등록된 상품명");
  changeInput("상품명", "[테스트] 복사 상품");
  clickButton("등록 저장");
  expect(currentContext.products).toHaveLength(3);
  expect(JSON.stringify(currentContext.products.slice(0, 2))).toBe(original);
  expect(currentContext.products[2]).toMatchObject({ id: 3, productName: "[테스트] 복사 상품", productPrice: 8000, productStatus: "판매 중", productUpdatedAt: "" });
  expect(currentContext.products[2].productCreatedAt).not.toBe(initialProducts[0].productCreatedAt);
  expect(screen.getByRole("button", { name: "[테스트] 복사 상품 상세 보기" })).toBeInTheDocument();
  // 복사본만 수정해도 원본의 이름과 단가는 그대로 유지됩니다.
  clickButton("[테스트] 복사 상품 수정");
  changeInput("기본 단가 (원)", "9000");
  clickButton("수정 저장");
  expect(currentContext.products[0]).toEqual(initialProducts[0]);
  expect(currentContext.products[2].productPrice).toBe(9000);
});

test("복사 취소는 원본 상세의 복사 버튼으로 돌아가고 판매중지 상태도 입력값으로 유지한다", () => {
  render(<ProductPage />);
  const original = JSON.stringify(currentContext.products);
  clickButton("스티커 상세 보기");
  fireEvent.click(screen.getByRole("button", { name: "상품 복사", exact: true }));
  expect(screen.getByRole("heading", { name: "상품 복사 등록" })).toBeInTheDocument();
  expect(screen.getByRole("form", { name: "상품 복사 등록" })).toBeInTheDocument();
  expect(screen.getByLabelText("판매 상태")).toHaveValue("판매중지");
  changeInput("상품명", "복사 작성 중");
  window.confirm.mockReturnValue(false);
  clickButton("취소");
  expect(screen.getByLabelText("상품명")).toHaveValue("복사 작성 중");
  window.confirm.mockReturnValue(true);
  clickButton("취소");
  expect(screen.getByRole("button", { name: "상품 복사", exact: true })).toHaveFocus();
  expect(JSON.stringify(currentContext.products)).toBe(original);
});

test.each([
  ["Tumbler", "  TUMBLER  "],
  ["텀블러", "텀블러".normalize("NFD")],
  ["텀블러".normalize("NFD"), "텀블러"],
])("상품 검색도 공백·대소문자·한글 표기를 동일하게 비교한다: %s", (productName, query) => {
  initialProducts = [{ ...initialProducts[0], productName }];
  render(<ProductPage />);
  const before = JSON.stringify(currentContext.products);
  fireEvent.change(screen.getByLabelText("상품명·번호 검색"), { target: { value: query } });
  expect(screen.getByRole("button", { name: `${productName} 수정` })).toBeInTheDocument();
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test("상품을 검색하고 판매 상태로 필터링한 뒤 초기화한다", () => {
  render(<ProductPage />);
  changeInput("상품명·번호 검색", "텀블러");
  expect(screen.getByRole("button", { name: "텀블러 수정" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "스티커 수정" })).not.toBeInTheDocument();
  changeInput("판매 상태", "판매중지");
  expect(screen.getByText(/조건에 맞는 상품이 없습니다/)).toBeInTheDocument();
  clickButton("초기화");
  expect(screen.getByRole("button", { name: "스티커 수정" })).toBeInTheDocument();
  expect(currentContext.products).toHaveLength(2);
});

test("빈 결과의 조건 초기화는 정렬·상품을 유지하고 검색칸으로 초점을 옮긴다", () => {
  render(<ProductPage />);
  const before = JSON.stringify(currentContext.products);
  changeInput("정렬", "oldest");
  changeInput("판매 상태", "판매중지");
  changeInput("상품명·번호 검색", "결과 없음");
  clickButton("검색 조건 초기화");
  expect(screen.getByLabelText("상품명·번호 검색")).toHaveValue("");
  expect(screen.getByLabelText("상품명·번호 검색")).toHaveFocus();
  expect(screen.getByLabelText("판매 상태")).toHaveValue("all");
  expect(screen.getByLabelText("정렬")).toHaveValue("oldest");
  expect(screen.getByRole("button", { name: "텀블러 수정" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "스티커 수정" })).toBeInTheDocument();
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test("상품이 원래 없으면 등록 안내를 표시하고 조건 초기화는 표시하지 않는다", () => {
  initialProducts = [];
  render(<ProductPage />);
  expect(screen.getByText(/등록된 상품이 없습니다/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "검색 조건 초기화" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "+ 상품 등록" })).toBeInTheDocument();
});

test.each([
  ["newest", ["B", "C", "A", "D", "E"]],
  ["oldest", ["A", "C", "B", "D", "E"]],
])("%s 정렬은 날짜·UTC·시차 표기를 실제 한국 시각으로 비교하고 잘못된 날짜는 마지막에 둔다", (sort, names) => {
  const dates = ["2026-11-04", "2026-11-03T16:00:00Z", "2026-11-04T00:30:00+09:00", "", "2026-02-30"];
  initialProducts = dates.map((productCreatedAt, index) => ({
    ...initialProducts[0], id: index + 1, productName: String.fromCharCode(65 + index), productCreatedAt,
  }));
  const before = JSON.stringify(initialProducts);
  render(<ProductPage />);
  fireEvent.change(screen.getByLabelText("정렬"), { target: { value: sort } });
  const rows = within(screen.getByRole("region", { name: "상품 목록 표" })).getAllByRole("row");
  names.forEach((name, index) => expect(within(rows[index + 1]).getByRole("button", { name: `${name} 수정` })).toBeInTheDocument());
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test("등록 저장 시 공백을 정리하고 ID와 등록일을 자동 생성한다", () => {
  render(<ProductPage />);
  clickButton("+ 상품 등록");
  changeInput("상품명", " 에코백 ");
  changeInput("기본 단가 (원)", "5000");
  clickButton("등록 저장");
  expect(currentContext.products[2]).toMatchObject({ id: 3, productName: "에코백", productPrice: 5000, productStatus: "판매 중", productUpdatedAt: "" });
  expect(Number.isNaN(Date.parse(currentContext.products[2].productCreatedAt))).toBe(false);
  expect(screen.getByRole("status", { name: "상품 처리 결과" })).toHaveTextContent("상품을 등록했습니다");
});

test("수정은 ID와 등록일을 유지하고 상태·단가·수정일을 갱신한다", () => {
  render(<ProductPage />);
  clickButton("텀블러 수정");
  changeInput("기본 단가 (원)", "8500");
  changeInput("판매 상태", "판매중지");
  clickButton("수정 저장");
  expect(currentContext.products[0]).toMatchObject({ id: 1, productCreatedAt: "2026-09-01", productPrice: 8500, productStatus: "판매중지" });
  expect(currentContext.products[0].productUpdatedAt).not.toBe("");
  expect(within(screen.getByRole("region", { name: "상품 목록 표" })).getAllByText("판매 중지")).toHaveLength(2);
});

test("취소하거나 잘못된 값을 제출하면 상품 목록을 변경하지 않는다", () => {
  render(<ProductPage />);
  const before = JSON.stringify(currentContext.products);
  clickButton("+ 상품 등록");
  changeInput("상품명", "   ");
  changeInput("기본 단가 (원)", "100");
  clickButton("등록 저장");
  expect(screen.getByRole("alert")).toHaveTextContent("상품명을 입력");
  changeInput("상품명", "입력 중");
  changeInput("기본 단가 (원)", "-1");
  fireEvent.submit(screen.getByRole("form", { name: "상품 등록" }));
  expect(screen.getByRole("alert")).toHaveTextContent("0 이상의 정수");
  clickButton("취소");
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test("중복 상품명 등록·수정은 차단하고 자기 이름의 변경 없는 저장은 수정일을 유지한다", () => {
  render(<ProductPage />);
  const original = JSON.stringify(currentContext.products);
  clickButton("+ 상품 등록");
  changeInput("상품명", " 텀블러 ");
  changeInput("기본 단가 (원)", "8000");
  clickButton("등록 저장");
  expect(screen.getByRole("alert")).toHaveTextContent("이미 등록된 상품명");
  clickButton("취소");
  clickButton("텀블러 수정");
  changeInput("상품명", "스티커");
  clickButton("수정 저장");
  expect(screen.getByRole("alert")).toHaveTextContent("이미 등록된 상품명");
  changeInput("상품명", "텀블러");
  clickButton("수정 저장");
  expect(JSON.stringify(currentContext.products)).toBe(original);
  expect(screen.getByRole("status", { name: "상품 처리 결과" })).toHaveTextContent("변경된 내용이 없습니다");
});

test("변경 없는 취소는 바로 닫고 작성 중 취소는 확인 결과를 따른다", () => {
  render(<ProductPage />);
  clickButton("+ 상품 등록");
  clickButton("취소");
  expect(window.confirm).not.toHaveBeenCalled();
  clickButton("+ 상품 등록");
  changeInput("상품명", "작성 중");
  window.confirm.mockReturnValue(false);
  clickButton("취소");
  expect(screen.getByLabelText("상품명")).toHaveValue("작성 중");
  window.confirm.mockReturnValue(true);
  clickButton("취소");
  expect(screen.queryByRole("form")).not.toBeInTheDocument();
  expect(currentContext.products).toHaveLength(2);
});

test.each([
  ["Tumbler", " tumbler "],
  ["텀블러", "텀블러".normalize("NFD")],
])("대소문자·유니코드 표기만 다른 상품명도 중복으로 처리한다: %s", (originalName, enteredName) => {
  initialProducts = [{ ...initialProducts[0], productName: originalName }];
  render(<ProductPage />);
  clickButton("+ 상품 등록");
  fireEvent.change(screen.getByLabelText("상품명"), { target: { value: enteredName } });
  changeInput("기본 단가 (원)", "1000");
  clickButton("등록 저장");
  expect(screen.getByRole("alert")).toHaveTextContent("이미 등록된 상품명");
  expect(currentContext.products).toHaveLength(1);
});

test.each([
  ["newest", "스티커 수정"], ["oldest", "텀블러 수정"], ["name", "스티커 수정"],
  ["priceAsc", "스티커 수정"], ["priceDesc", "텀블러 수정"],
])("%s 정렬이 화면에 반영되고 원본 상품 순서는 바뀌지 않는다", (sort, expected) => {
  render(<ProductPage />);
  const original = JSON.stringify(currentContext.products);
  fireEvent.change(screen.getByLabelText("정렬"), { target: { value: sort } });
  const table = screen.getByRole("region", { name: "상품 목록 표" });
  expect(within(within(table).getAllByRole("row")[1]).getByRole("button", { name: expected })).toBeInTheDocument();
  expect(JSON.stringify(currentContext.products)).toBe(original);
});

function makeProducts(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1, productName: `상품${String(index + 1).padStart(2, "0")}`, productPrice: (index + 1) * 100,
    productStatus: index % 2 ? "판매중지" : "판매 중", productCreatedAt: `2026-10-${String(index + 1).padStart(2, "0")}`, productUpdatedAt: "",
  }));
}

test("23개 상품을 10개씩 표시하고 검색·상태·정렬 변경 시 첫 페이지로 돌아간다", () => {
  initialProducts = makeProducts(23);
  render(<ProductPage />);
  const table = screen.getByRole("region", { name: "상품 목록 표" });
  const next = () => fireEvent.click(screen.getByRole("button", { name: "다음", exact: true }));
  expect(within(table).getAllByRole("row")).toHaveLength(11);
  expect(screen.getByRole("button", { name: "이전", exact: true })).toBeDisabled();
  next(); next();
  expect(screen.getByRole("status", { name: "현재 상품 페이지" })).toHaveTextContent("3 / 3 페이지");
  expect(within(table).getAllByRole("row")).toHaveLength(4);
  expect(screen.getByRole("button", { name: "다음", exact: true })).toBeDisabled();
  changeInput("상품명·번호 검색", "상품01");
  expect(screen.getByRole("button", { name: "상품01 수정" })).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "상품 목록 페이지" })).not.toBeInTheDocument();
  clickButton("초기화");
  next();
  changeInput("판매 상태", "판매 중");
  expect(screen.getByRole("status", { name: "현재 상품 페이지" })).toHaveTextContent("1 / 2 페이지");
  clickButton("초기화");
  next();
  changeInput("정렬", "priceAsc");
  expect(screen.getByRole("status", { name: "현재 상품 페이지" })).toHaveTextContent("1 / 3 페이지");
  expect(within(within(table).getAllByRole("row")[1]).getByRole("button", { name: "상품01 수정" })).toBeInTheDocument();
  expect(currentContext.products).toHaveLength(23);
});

test("마지막 페이지에서 외부 상품 목록이 줄어도 빈 페이지가 남지 않는다", () => {
  initialProducts = makeProducts(23);
  render(<ProductPage />);
  fireEvent.click(screen.getByRole("button", { name: "다음", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "다음", exact: true }));
  act(() => currentContext.setProducts(products => products.slice(0, 2)));
  expect(screen.getByRole("button", { name: "상품01 수정" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "상품02 수정" })).toBeInTheDocument();
  expect(screen.queryByRole("navigation", { name: "상품 목록 페이지" })).not.toBeInTheDocument();
});

test("상품 상세에서 최신 정보를 확인하고 수정·취소 후 같은 상세와 목록 조건으로 돌아간다", () => {
  initialProducts = makeProducts(23);
  render(<ProductPage />);
  changeInput("정렬", "priceAsc");
  fireEvent.click(screen.getByRole("button", { name: "다음", exact: true }));
  clickButton("상품11 상세 보기");
  const details = screen.getByRole("region", { name: "상품 상세" });
  expect(within(details).getByText("상품11")).toBeInTheDocument();
  expect(within(details).getByText("1,100원")).toBeInTheDocument();
  act(() => currentContext.setProducts(products => products.map(product => product.id === 11 ? { ...product, productPrice: 1500 } : product)));
  expect(within(details).getByText("1,500원")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "상품 수정", exact: true }));
  expect(screen.getByLabelText("기본 단가 (원)")).toHaveValue(1500);
  clickButton("취소");
  expect(screen.getByRole("region", { name: "상품 상세" })).toBeInTheDocument();
  clickButton("목록으로");
  expect(screen.getByLabelText("정렬")).toHaveValue("priceAsc");
  expect(screen.getByRole("status", { name: "현재 상품 페이지" })).toHaveTextContent("2 / 3 페이지");
});

test("상세에서 저장한 수정 결과를 표시하고 외부 삭제 시 목록 복귀를 안내한다", () => {
  render(<ProductPage />);
  clickButton("텀블러 상세 보기");
  fireEvent.click(screen.getByRole("button", { name: "상품 수정", exact: true }));
  changeInput("상품명", "새 텀블러");
  clickButton("수정 저장");
  expect(within(screen.getByRole("region", { name: "상품 상세" })).getByText("새 텀블러")).toBeInTheDocument();
  act(() => currentContext.setProducts(products => products.filter(product => product.id !== 1)));
  expect(screen.getByText(/상품을 찾을 수 없습니다/)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "상품 수정", exact: true })).not.toBeInTheDocument();
  clickButton("목록으로");
  expect(screen.getByRole("button", { name: "스티커 수정" })).toBeInTheDocument();
});

test("목록의 판매 상태 변경은 확인 후 해당 상품만 갱신하고 필터를 유지한다", () => {
  render(<ProductPage />);
  const original = JSON.stringify(currentContext.products);
  window.confirm.mockReturnValue(false);
  clickButton("텀블러 판매 중지");
  expect(JSON.stringify(currentContext.products)).toBe(original);
  window.confirm.mockReturnValue(true);
  changeInput("판매 상태", "판매 중");
  clickButton("텀블러 판매 중지");
  expect(screen.getByLabelText("판매 상태")).toHaveValue("판매 중");
  expect(screen.getByText(/조건에 맞는 상품이 없습니다/)).toBeInTheDocument();
  expect(currentContext.products[0]).toMatchObject({ id: 1, productName: "텀블러", productPrice: 8000, productCreatedAt: "2026-09-01", productStatus: "판매중지" });
  expect(currentContext.products[0].productUpdatedAt).not.toBe("");
  expect(currentContext.products[1]).toEqual(initialProducts[1]);
  clickButton("초기화");
  clickButton("텀블러 판매 재개");
  expect(currentContext.products[0].productStatus).toBe("판매 중");
});

test("입력 오류를 해당 칸에 연결하고 첫 오류로 초점을 옮긴다", () => {
  render(<ProductPage />);
  clickButton("+ 상품 등록");
  clickButton("등록 저장");
  const name = screen.getByLabelText("상품명");
  const price = screen.getByLabelText("기본 단가 (원)");
  expect(name).toHaveFocus();
  expect(name).toHaveAttribute("aria-invalid", "true");
  expect(name).toHaveAccessibleDescription("최대 100자 · 앞뒤 공백은 저장 시 제거됩니다. 0 / 100자 상품명을 입력해 주세요.");
  fireEvent.change(price, { target: { value: "1000" } });
  expect(name).toHaveAttribute("aria-invalid", "true");
  fireEvent.change(name, { target: { value: "신규 상품" } });
  expect(name).not.toHaveAttribute("aria-invalid");
  fireEvent.change(price, { target: { value: "-1" } });
  clickButton("등록 저장");
  expect(price).toHaveFocus();
  expect(price).toHaveAccessibleDescription("원 단위로 0 이상의 정수를 입력해 주세요. 기본 단가는 0 이상의 정수로 입력해 주세요.");
  fireEvent.change(price, { target: { value: "1000" } });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test.each(["productName", "productPrice", "productStatus", "productUpdatedAt"])("편집 중 같은 상품의 %s 변경은 입력을 보존한 채 저장을 차단한다", field => {
  render(<ProductPage />);
  clickButton("텀블러 수정");
  changeInput("상품명", "내 입력");
  const changed = { productName: "외부 이름", productPrice: 12000, productStatus: "판매중지", productUpdatedAt: "2026-11-04T01:00:00Z" };
  act(() => currentContext.setProducts(products => products.map(product => product.id === 1 ? { ...product, [field]: changed[field] } : product)));
  const before = JSON.stringify(currentContext.products);
  clickButton("수정 저장");
  expect(screen.getByRole("alert")).toHaveTextContent("다른 화면에서 변경");
  expect(screen.getByLabelText("상품명")).toHaveValue("내 입력");
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test("다른 상품의 외부 변경은 유지하면서 현재 상품을 수정한다", () => {
  render(<ProductPage />);
  clickButton("텀블러 수정");
  changeInput("기본 단가 (원)", "8500");
  act(() => currentContext.setProducts(products => products.map(product => product.id === 2 ? { ...product, productPrice: 1000 } : product)));
  clickButton("수정 저장");
  expect(screen.queryByRole("form")).not.toBeInTheDocument();
  expect(currentContext.products.map(product => product.productPrice)).toEqual([8500, 1000]);
});

test("편집 중 삭제된 상품은 재생성하지 않고 오류를 안내한다", () => {
  render(<ProductPage />);
  clickButton("텀블러 수정");
  act(() => currentContext.setProducts(products => products.filter(product => product.id !== 1)));
  clickButton("수정 저장");
  expect(screen.getByRole("alert")).toHaveTextContent("수정할 상품을 찾을 수 없습니다");
  expect(currentContext.products).toHaveLength(1);
});

test("상세·수정에서 돌아오면 ID로 기억한 원래 버튼에 초점을 복원한다", () => {
  render(<ProductPage />);
  clickButton("텀블러 상세 보기");
  expect(screen.getByRole("heading", { name: "상품 상세" })).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "상품 수정", exact: true }));
  clickButton("취소");
  expect(screen.getByRole("button", { name: "상품 수정", exact: true })).toHaveFocus();
  clickButton("목록으로");
  expect(screen.getByRole("button", { name: "텀블러 상세 보기" })).toHaveFocus();
  clickButton("텀블러 수정");
  changeInput("상품명", "이름 변경");
  clickButton("수정 저장");
  expect(screen.getByRole("button", { name: "이름 변경 수정" })).toHaveFocus();
});

test("복귀할 상품이 필터에서 사라지면 목록 제목으로 초점을 옮긴다", () => {
  render(<ProductPage />);
  changeInput("상품명·번호 검색", "텀블러");
  clickButton("텀블러 수정");
  changeInput("상품명", "새 이름");
  clickButton("수정 저장");
  expect(screen.getByLabelText("상품명·번호 검색")).toHaveValue("텀블러");
  expect(screen.getByRole("heading", { name: "상품 목록" })).toHaveFocus();
});

test("신규 등록 취소 후에는 등록 버튼으로 초점을 복원한다", () => {
  render(<ProductPage />);
  clickButton("+ 상품 등록");
  clickButton("취소");
  expect(screen.getByRole("button", { name: "+ 상품 등록" })).toHaveFocus();
});

test("UTC 시각은 한국 날짜로 표시하고 상세에서는 초 단위 시각까지 보여준다", () => {
  initialProducts = [{ ...initialProducts[0], productCreatedAt: "2026-11-03T16:30:00.000Z", productUpdatedAt: "2026-11-03T18:15:20.000Z" }];
  const before = JSON.stringify(initialProducts);
  render(<ProductPage />);
  const table = screen.getByRole("region", { name: "상품 목록 표" });
  expect(within(table).getAllByText("2026-11-04")).toHaveLength(2);
  clickButton("텀블러 상세 보기");
  const details = screen.getByRole("region", { name: "상품 상세" });
  expect(within(details).getByText("2026-11-04 01:30:00")).toBeInTheDocument();
  expect(within(details).getByText("2026-11-04 03:15:20")).toBeInTheDocument();
  expect(JSON.stringify(currentContext.products)).toBe(before);
});

test("날짜만 있던 상품은 시각을 붙이지 않고 빈 수정일·잘못된 날짜는 대시로 표시한다", () => {
  render(<ProductPage />);
  clickButton("텀블러 상세 보기");
  const details = screen.getByRole("region", { name: "상품 상세" });
  expect(within(details).getByText("2026-09-01")).toBeInTheDocument();
  expect(within(details).queryByText(/00:00:00/)).not.toBeInTheDocument();
  expect(within(details).getByText("—")).toBeInTheDocument();
  act(() => currentContext.setProducts(products => products.map(product => product.id === 1
    ? { ...product, productCreatedAt: "2026-02-30", productUpdatedAt: "invalid" } : product)));
  expect(within(details).getAllByText("—")).toHaveLength(2);
});
