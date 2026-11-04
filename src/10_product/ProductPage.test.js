import React, { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import ProductPage from "./ProductPage";
import { useERP } from "../context/ERPContext";

// 새 화면만 검사합니다. 실제 Context·브라우저 저장소·기존 상품에는 쓰지 않습니다.
jest.mock("../context/ERPContext", () => ({ useERP: jest.fn() }));
let currentContext;
beforeEach(() => {
  useERP.mockImplementation(function useTestProducts() {
    const [products, setProducts] = useState([
      { id: 1, productName: "텀블러", productPrice: 8000, productStatus: "판매 중", productCreatedAt: "2026-09-01", productUpdatedAt: "" },
      { id: 2, productName: "스티커", productPrice: 900, productStatus: "판매중지", productCreatedAt: "2026-09-02", productUpdatedAt: "" },
    ]);
    currentContext = { products, setProducts };
    return currentContext;
  });
});

test("상품을 검색하고 판매 상태로 필터링한 뒤 초기화한다", () => {
  render(<ProductPage />);
  fireEvent.change(screen.getByLabelText("상품명 검색"), { target: { value: "텀블러" } });
  expect(screen.getByRole("button", { name: "텀블러 수정" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "스티커 수정" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("판매 상태"), { target: { value: "판매중지" } });
  expect(screen.getByText(/조건에 맞는 상품이 없습니다/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "초기화" }));
  expect(screen.getByRole("button", { name: "스티커 수정" })).toBeInTheDocument();
  expect(currentContext.products).toHaveLength(2);
});

test("상품 저장 시 공백을 정리하고 ID와 등록일을 자동 생성한다", () => {
  render(<ProductPage />);
  fireEvent.click(screen.getByRole("button", { name: "+ 상품 등록" }));
  fireEvent.change(screen.getByLabelText("상품명"), { target: { value: " 에코백 " } });
  fireEvent.change(screen.getByLabelText("기본 단가 (원)"), { target: { value: "5000" } });
  fireEvent.click(screen.getByRole("button", { name: "상품 저장" }));
  expect(currentContext.products[2]).toMatchObject({ id: 3, productName: "에코백", productPrice: 5000, productStatus: "판매 중", productUpdatedAt: "" });
  expect(Number.isNaN(Date.parse(currentContext.products[2].productCreatedAt))).toBe(false);
  expect(screen.getByRole("status")).toHaveTextContent("상품을 등록했습니다");
});

test("수정은 ID와 등록일을 유지하고 상태·단가·수정일을 갱신한다", () => {
  render(<ProductPage />);
  fireEvent.click(screen.getByRole("button", { name: "텀블러 수정" }));
  fireEvent.change(screen.getByLabelText("기본 단가 (원)"), { target: { value: "8500" } });
  fireEvent.change(screen.getByLabelText("판매 상태"), { target: { value: "판매중지" } });
  fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));
  expect(currentContext.products[0]).toMatchObject({ id: 1, productCreatedAt: "2026-09-01", productPrice: 8500, productStatus: "판매중지" });
  expect(currentContext.products[0].productUpdatedAt).not.toBe("");
  expect(within(screen.getByRole("region", { name: "상품 목록 표" })).getAllByText("판매 중지")).toHaveLength(2);
});

test("취소하거나 잘못된 값을 제출하면 상품 목록을 변경하지 않는다", () => {
  render(<ProductPage />);
  const before = JSON.stringify(currentContext.products);
  fireEvent.click(screen.getByRole("button", { name: "+ 상품 등록" }));
  fireEvent.change(screen.getByLabelText("상품명"), { target: { value: "   " } });
  fireEvent.change(screen.getByLabelText("기본 단가 (원)"), { target: { value: "100" } });
  fireEvent.click(screen.getByRole("button", { name: "상품 저장" }));
  expect(screen.getByRole("alert")).toHaveTextContent("상품명을 입력");
  fireEvent.change(screen.getByLabelText("상품명"), { target: { value: "입력 중" } });
  fireEvent.change(screen.getByLabelText("기본 단가 (원)"), { target: { value: "-1" } });
  fireEvent.submit(screen.getByRole("form", { name: "상품 등록" }));
  expect(screen.getByRole("alert")).toHaveTextContent("0 이상의 정수");
  fireEvent.click(screen.getByRole("button", { name: "취소" }));
  expect(JSON.stringify(currentContext.products)).toBe(before);
});
