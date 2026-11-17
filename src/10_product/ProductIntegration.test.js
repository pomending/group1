/* 실제 ERPProvider와 견적 화면을 연결합니다. jsdom 저장소만 사용하므로 Chrome 자료는 바꾸지 않습니다. */
import React from "react";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { ERPProvider, useERP } from "../context/ERPContext";
import QuotationCreate from "../2_quotation/QuotationCreate";
import { validateQuotation } from "../utils/quotationUtils";

// 경로 이동만 대체하고 상품·견적 상태 및 검증 함수는 실제 코드를 사용합니다.
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null }),
}));

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
afterEach(() => { localStorage.clear(); sessionStorage.clear(); });

test("상품 이름·단가 변경은 새 견적 선택에 반영하고 기존 견적 원본은 유지한다", () => {
  let erp;
  function ContextProbe() { erp = useERP(); return null; }
  render(<ERPProvider><ContextProbe /><QuotationCreate /></ERPProvider>);
  const product = erp.products.find(item => item.productStatus === "판매 중");
  const oldQuotes = JSON.stringify(erp.quotations);
  let result;
  act(() => { result = erp.updateProduct({ id: product.id, productName: "연동 확인 텀블러", productPrice: 14500 }); });
  expect(result.ok).toBe(true);
  const search = screen.getByPlaceholderText("상품명을 입력하세요.");
  fireEvent.focus(search);
  fireEvent.change(search, { target: { value: "연동 확인 텀블러" } });
  fireEvent.click(screen.getByText("연동 확인 텀블러", { exact: true }));
  expect(screen.getByPlaceholderText("상품 선택 시 자동 입력")).toHaveValue(14500);
  expect(JSON.stringify(erp.quotations)).toBe(oldQuotes);
});

test("판매 중지 상품은 견적 선택 목록에서 빠지고 Context의 새 견적 연결도 차단한다", () => {
  let erp;
  function ContextProbe() { erp = useERP(); return null; }
  render(<ERPProvider><ContextProbe /><QuotationCreate /></ERPProvider>);
  const product = erp.products.find(item => item.productStatus === "판매 중");
  act(() => { expect(erp.updateProduct({ id: product.id, productStatus: "판매중지" }).ok).toBe(true); });
  const search = screen.getByPlaceholderText("상품명을 입력하세요.");
  fireEvent.focus(search);
  fireEvent.change(search, { target: { value: product.productName } });
  expect(screen.getByText("검색 결과가 없습니다.")).toBeInTheDocument();
  let result;
  act(() => { result = erp.addQuotation({ status: "임시 저장", productId: product.id, baseUnitPrice: product.productPrice }); });
  expect(result).toMatchObject({ ok: false, message: "판매 중인 상품만 선택할 수 있습니다." });
});

test("오래된 상품 단가는 새 견적에서 차단하고 최신 단가는 임시 견적으로 저장한다", () => {
  const { result } = renderHook(() => useERP(), { wrapper: ERPProvider });
  const product = result.current.products.find(item => item.productStatus === "판매 중");
  act(() => { expect(result.current.updateProduct({ id: product.id, productPrice: 14500 }).ok).toBe(true); });
  const draft = { status: "임시 저장", productId: product.id, baseUnitPrice: product.productPrice };
  let saved;
  act(() => { saved = result.current.addQuotation(draft); });
  expect(saved).toMatchObject({ ok: false, message: "상품의 기본 단가가 일치하지 않습니다." });
  act(() => { saved = result.current.addQuotation({ ...draft, baseUnitPrice: 14500 }); });
  expect(saved.ok).toBe(true);
  expect(result.current.quotations.find(item => item.id === saved.id).baseUnitPrice).toBe(14500);
});

test("현재 정책 차이: 상품은 0원을 허용하지만 정식 견적은 기본 단가 0원을 거절한다", () => {
  const { result } = renderHook(() => useERP(), { wrapper: ERPProvider });
  let added;
  act(() => { added = result.current.addProduct({ productName: "무료 연동 샘플", productPrice: 0, productStatus: "판매 중" }); });
  expect(added.ok).toBe(true);
  const product = result.current.products.find(item => item.productName === "무료 연동 샘플");
  expect(validateQuotation({ status: "승인 대기", customerId: 1, employeeId: 2,
    productId: product.id, createdAt: "2026-11-17", quantity: 1, baseUnitPrice: product.productPrice,
  })).toEqual({ ok: false, message: "기본 단가는 0보다 커야 합니다." });
});
