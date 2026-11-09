import React from "react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import ProductImage from "./ProductImage";
import { productImages } from "./productImages";

// Jest에서는 Webpack의 폴더 수집을 실행하지 않으므로 선택창용 목록만 제공합니다.
beforeAll(() => productImages.push(
  { id: "10-logo-sticker.jpg", name: "10-logo-sticker", src: "/sticker.jpg" },
  { id: "02-canvas-ecobag.jpg", name: "02-canvas-ecobag", src: "/ecobag.jpg" },
));
afterAll(() => { productImages.length = 0; });

test("이미지를 제거하면 기본 주소도 숨기고 재진입 후에도 제거 상태를 유지한다", () => {
  const product = { id: 7100, productName: "제거 상품", productImageUrl: "/default.jpg" };
  const view = render(<ProductImage product={product} />);
  try {
    fireEvent.click(screen.getByRole("button", { name: "이미지 제거" }));
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(localStorage.getItem("erp_product_image:7100")).toBe("");
    view.unmount();
    render(<ProductImage product={product} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이미지 추가" })).toBeInTheDocument();
  } finally { localStorage.removeItem("erp_product_image:7100"); }
});

test("상품 초기화 알림을 받으면 화면에 남은 이전 이미지 선택도 해제한다", () => {
  localStorage.setItem("erp_product_image:7101", "catalog:10-logo-sticker.jpg");
  render(<ProductImage product={{ id: 7101, productName: "초기화 상품" }} />);
  localStorage.removeItem("erp_product_image:7101");
  act(() => window.dispatchEvent(new Event("erp-product-images-reset")));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

test("이미지 제거 저장에 실패하면 기존 이미지를 유지한다", () => {
  const view = render(<ProductImage product={{ id: 7102, productName: "저장 실패", productImageUrl: "/keep.jpg" }} />);
  const write = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
  try {
    fireEvent.click(screen.getByRole("button", { name: "이미지 제거" }));
    expect(screen.getByRole("img")).toHaveAttribute("src", "/keep.jpg");
    expect(screen.getByRole("status")).toHaveTextContent("제거를 저장하지 못했습니다");
  } finally { write.mockRestore(); view.unmount(); }
});

test("이미지를 선택하기 전에는 추가 버튼만 표시하고 빈 이미지 박스를 만들지 않는다", () => {
  render(<ProductImage product={{ productName: "텀블러" }} />);
  expect(screen.getByRole("button", { name: "이미지 추가" })).toBeInTheDocument();
  expect(screen.queryByText("이미지 없음")).not.toBeInTheDocument();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

test("주소 로딩 실패 시 안내하고 주소가 바뀌면 새 이미지를 표시한다", () => {
  const product = { productName: "텀블러", productImageUrl: "https://example.com/old.png" };
  const { rerender } = render(<ProductImage product={product} />);
  fireEvent.error(screen.getByRole("img", { name: "텀블러 상품 이미지" }));
  expect(screen.getByRole("alert")).toHaveTextContent("이미지를 불러오지 못했습니다.");
  rerender(<ProductImage product={{ ...product, productImageUrl: "/images/tumbler.png" }} />);
  expect(screen.getByRole("img", { name: "텀블러 상품 이미지" })).toHaveAttribute("src", "/images/tumbler.png");
});

test("로컬 PC 경로나 실행 주소를 이미지로 요청하지 않는다", () => {
  const { rerender } = render(<ProductImage product={{ productImageUrl: "C:\\images\\product.png" }} />);
  expect(screen.getByRole("alert")).toHaveTextContent("이미지를 불러오지 못했습니다.");
  rerender(<ProductImage product={{ productImageUrl: "javascript:alert(1)" }} />);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

test("선택창 적용 후 상품별 이미지를 저장하고 다시 열어도 표시한다", () => {
  const product = { id: 7001, productName: "[테스트] 이미지 상품" };
  const { unmount } = render(<ProductImage product={product} />);
  try {
    fireEvent.click(screen.getByRole("button", { name: "이미지 추가" }));
    const dialog = screen.getByRole("dialog", { name: "상품 이미지 선택" });
    expect(within(dialog).getByRole("button", { name: "적용" })).toBeDisabled();
    fireEvent.click(within(dialog).getByRole("button", { name: "10-logo-sticker" }));
    expect(within(dialog).getByRole("button", { name: "10-logo-sticker" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(dialog).getByRole("button", { name: "적용" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "[테스트] 이미지 상품 상품 이미지" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이미지 변경" })).toHaveFocus();
    expect(localStorage.getItem("erp_product_image:7001")).toBe("catalog:10-logo-sticker.jpg");
    unmount();
    render(<ProductImage product={product} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "이미지 변경" }));
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "10-logo-sticker" })).toHaveAttribute("aria-pressed", "true");
  } finally { localStorage.removeItem("erp_product_image:7001"); }
});

test("선택 후 취소하거나 Escape로 닫으면 이미지를 적용하지 않고 초점을 돌려준다", () => {
  render(<ProductImage product={{ productName: "상품" }} />);
  const trigger = screen.getByRole("button", { name: "이미지 추가" });
  fireEvent.click(trigger);
  let dialog = screen.getByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "02-canvas-ecobag" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "취소" }));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  dialog = screen.getByRole("dialog");
  expect(within(dialog).getByRole("button", { name: "적용" })).toBeDisabled();
  fireEvent.keyDown(dialog, { key: "Escape" });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test("선택창에서 Tab과 Shift+Tab으로 초점이 순환한다", () => {
  render(<ProductImage product={{ productName: "상품" }} />);
  fireEvent.click(screen.getByRole("button", { name: "이미지 추가" }));
  const dialog = screen.getByRole("dialog");
  const close = within(dialog).getByRole("button", { name: "닫기" });
  const cancel = within(dialog).getByRole("button", { name: "취소" });
  expect(close).toHaveFocus();
  fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
  expect(cancel).toHaveFocus();
  fireEvent.keyDown(cancel, { key: "Tab" });
  expect(close).toHaveFocus();
});


test("이전 이미지 ID로 저장한 선택도 원래 파일로 복원한다", () => {
  localStorage.setItem("erp_product_image:7002", "catalog:sticker");
  try {
    render(<ProductImage product={{ id: 7002, productName: "이전 상품" }} />);
    expect(screen.getByRole("img")).toHaveAttribute("src", "/sticker.jpg");
    fireEvent.click(screen.getByRole("button", { name: "이미지 변경" }));
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "10-logo-sticker" })).toHaveAttribute("aria-pressed", "true");
  } finally { localStorage.removeItem("erp_product_image:7002"); }
});

test("선택했던 파일이 없어져도 다른 상품 이미지로 바꾸지 않고 재선택 안내를 표시한다", () => {
  localStorage.setItem("erp_product_image:7003", "catalog:deleted.jpg");
  try {
    render(<ProductImage product={{ id: 7003, productName: "삭제 파일 상품" }} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("다른 이미지를 선택해 주세요.");
  } finally { localStorage.removeItem("erp_product_image:7003"); }
});
