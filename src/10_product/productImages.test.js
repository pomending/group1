import { collectProductImages } from "./productImages";

test("기존 파일 ID를 유지하면서 알려진 상품을 한글 이름으로 표시한다", () => {
  const images = collectProductImages(imageContext(["./11-wireless-mouse.jpg", "./15-baseball-cap.jpg"]));
  expect(images.map(item => [item.id, item.name])).toEqual([
    ["11-wireless-mouse.jpg", "무선 마우스"], ["15-baseball-cap.jpg", "볼캡"],
  ]);
});

function imageContext(files) {
  const context = file => "/static/media/" + file.slice(2);
  context.keys = () => files;
  return context;
}

test("새 이미지와 한글 파일명을 수집하고 모음 원본과 다른 파일은 제외한다", () => {
  const images = collectProductImages(imageContext([
    "./product-catalog.png", "./새 상품.PNG", "./02-bag.webp", "./01-mug.jpg", "./note.txt",
  ]));
  expect(images.map(item => item.id)).toEqual(["01-mug.jpg", "02-bag.webp", "새 상품.PNG"]);
  expect(images[2]).toEqual({ id: "새 상품.PNG", name: "새 상품", src: "/static/media/새 상품.PNG" });
});

test("파일 추가와 정렬 변경에도 기존 파일 ID와 주소 연결이 유지된다", () => {
  const before = collectProductImages(imageContext(["./02-bag.jpg"]));
  const after = collectProductImages(imageContext(["./02-bag.jpg", "./01-new.jpg"]));
  expect(after.find(item => item.id === before[0].id)).toEqual(before[0]);
});

test("같은 이름의 다른 확장자는 별개 파일로 처리하고 빈 폴더도 허용한다", () => {
  const images = collectProductImages(imageContext(["./상품.jpg", "./상품.png"]));
  expect(new Set(images.map(item => item.id)).size).toBe(2);
  expect(collectProductImages(imageContext([]))).toEqual([]);
});
