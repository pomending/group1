import { act, renderHook } from "@testing-library/react";
import { useProductData } from "../context/useProductData";

// 가짜 브라우저 저장소만 사용합니다. 실제 사용자 상품·이미지는 변경하지 않습니다.
const seed = [{ id: 1, productName: "원본", productPrice: 100, productStatus: "판매 중" }];
const values = name => ({ productName: name, productPrice: 200, productStatus: "판매 중" });
beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test.each([null, {}, [{ ...seed[0], productPrice: -1 }], [seed[0], seed[0]]])(
  "공용 목록 갱신도 잘못된 형식과 중복 번호를 거절한다: %#", next => {
    const raw = JSON.stringify(seed);
    localStorage.setItem("erp_products", raw);
    const { result } = renderHook(() => useProductData(seed));
    let response;
    act(() => { response = result.current.setProducts(next); });
    expect(response.ok).toBe(false);
    expect(result.current.products).toEqual(seed);
    expect(localStorage.getItem("erp_products")).toBe(raw);
  }
);

test.each([
  [{ productName: null }, "productName"], [{ productName: 5 }, "productName"],
  [{ productName: " \t\n" }, "productName"], [{ productName: "가".repeat(101) }, "productName"],
  [{ productPrice: null }, "productPrice"], [{ productPrice: false }, "productPrice"],
  [{ productPrice: [] }, "productPrice"], [{ productPrice: {} }, "productPrice"],
  [{ productPrice: "   " }, "productPrice"], [{ productPrice: NaN }, "productPrice"],
  [{ productPrice: Infinity }, "productPrice"], [{ productPrice: -1 }, "productPrice"],
  [{ productPrice: 0.5 }, "productPrice"], [{ productPrice: Number.MAX_SAFE_INTEGER + 1 }, "productPrice"],
  [{ productStatus: null }, "productStatus"], [{ productStatus: "판매" }, "productStatus"],
])("등록·부분 수정의 잘못된 입력은 예외 없이 거절하고 원본과 수정일을 유지한다: %#", (changes, field) => {
  const raw = JSON.stringify(seed);
  localStorage.setItem("erp_products", raw);
  const { result } = renderHook(() => useProductData(seed));
  let added;
  let updated;
  act(() => {
    added = result.current.addProduct({ ...values("추가 상품"), ...changes });
    updated = result.current.updateProduct({ id: 1, ...changes });
  });
  expect(added).toMatchObject({ ok: false, field });
  expect(updated).toMatchObject({ ok: false, field });
  expect(result.current.products).toEqual(seed);
  expect(localStorage.getItem("erp_products")).toBe(raw);
});

test.each([0, Number.MAX_SAFE_INTEGER])("단가 허용 경계 %s는 저장 후 다시 읽어도 유지한다", price => {
  const first = renderHook(() => useProductData(seed));
  act(() => first.result.current.addProduct({ ...values("경계 상품"), productPrice: price }));
  first.unmount();
  const second = renderHook(() => useProductData(seed));
  expect(second.result.current.products.find(item => item.productName === "경계 상품").productPrice).toBe(price);
  expect(second.result.current.productStorageError).toBe("");
});

test.each(["", "   ", 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])("잘못된 저장 상품 번호 %s는 원본을 보호하고 변경 저장을 막는다", id => {
  const raw = JSON.stringify([{ ...seed[0], id }]);
  localStorage.setItem("erp_products", raw);
  const { result } = renderHook(() => useProductData(seed));
  expect(result.current.productStorageError).toContain("읽지 못했습니다");
  let response;
  act(() => { response = result.current.addProduct(values("추가 상품")); });
  expect(response.ok).toBe(false);
  expect(localStorage.getItem("erp_products")).toBe(raw);
});

test("상품 번호가 안전한 정수 한계이면 신규 저장을 막고 기존 목록을 유지한다", () => {
  const raw = JSON.stringify([{ ...seed[0], id: Number.MAX_SAFE_INTEGER }]);
  localStorage.setItem("erp_products", raw);
  const { result } = renderHook(() => useProductData(seed));
  let response;
  act(() => { response = result.current.addProduct(values("추가 상품")); });
  expect(response).toMatchObject({ ok: false, field: null });
  expect(response.message).toContain("상품 번호");
  expect(localStorage.getItem("erp_products")).toBe(raw);
});

test("상품 초기화는 재사용할 번호의 이미지 연결도 지우고 다른 저장소는 유지한다", () => {
  const { result } = renderHook(() => useProductData(seed));
  act(() => result.current.addProduct(values("이전 상품")));
  localStorage.setItem("erp_product_image:2", "catalog:11-wireless-mouse.jpg");
  localStorage.setItem("unrelated", "유지");
  act(() => result.current.resetProducts());
  act(() => result.current.addProduct(values("새 상품")));
  expect(result.current.products[1].id).toBe(2);
  expect(localStorage.getItem("erp_product_image:2")).toBeNull();
  expect(localStorage.getItem("unrelated")).toBe("유지");
});

test("초기화의 상품 저장이 실패하면 기존 이미지 연결과 상품을 복원한다", () => {
  const { result } = renderHook(() => useProductData(seed));
  localStorage.setItem("erp_product_image:1", "catalog:01-stainless-tumbler.jpg");
  const originalSet = Storage.prototype.setItem;
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(function(key, value) {
    if (key === "erp_products") throw new Error("quota");
    return originalSet.call(this, key, value);
  });
  let response;
  act(() => { response = result.current.resetProducts(); });
  expect(response.ok).toBe(false);
  expect(result.current.products).toEqual(seed);
  expect(localStorage.getItem("erp_product_image:1")).toBe("catalog:01-stainless-tumbler.jpg");
});

test("다른 탭이 먼저 등록한 상품을 오래된 목록으로 덮어쓰지 않고 재진입 후 저장한다", () => {
  const first = renderHook(() => useProductData(seed));
  const second = renderHook(() => useProductData(seed));
  act(() => first.result.current.addProduct(values("첫 탭 상품")));
  let response;
  act(() => { response = second.result.current.addProduct(values("둘째 탭 상품")); });
  expect(response).toMatchObject({ ok: false, field: null });
  expect(response.message).toContain("다른 탭");
  expect(JSON.parse(localStorage.getItem("erp_products")).map(item => item.productName)).toEqual(["원본", "첫 탭 상품"]);
  second.unmount();
  const reloaded = renderHook(() => useProductData(seed));
  act(() => { response = reloaded.result.current.addProduct(values("둘째 탭 상품")); });
  expect(response.ok).toBe(true);
  expect(reloaded.result.current.products.map(item => item.id)).toEqual([1, 2, 3]);
});
