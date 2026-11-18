// CRA(Webpack)가 빌드 시 폴더의 이미지 파일을 자동으로 수집합니다.
// 새 파일은 개발 서버 재컴파일 또는 배포 빌드 이후 선택창에 반영됩니다.
// Jest에는 Webpack의 파일 수집 기능이 없으므로 수집 규칙은 별도 테스트에서 검사합니다.
const imageFiles = process.env.NODE_ENV === "test" ? null
  : require.context("./images", false, /\.(jpe?g|png|webp|gif)$/i);

export function collectProductImages(context) {
  if (!context) return [];
  const files = [];
  for (const file of context.keys()) {
    // 정규식은 파일 끝이 이미지 확장자인지 검사합니다. i는 대소문자를 구분하지 않는다는 뜻입니다.
    if (!/\.(jpe?g|png|webp|gif)$/i.test(file)) continue;
    // 모음 원본은 보관용이므로 선택 목록에서 제외합니다.
    if (file === "./product-catalog.png") continue;
    files.push(file);
  }
  files.sort((a, b) => a.localeCompare(b, "ko", { numeric: true }));

  const images = [];
  for (const file of files) {
    const source = context(file);
    const id = file.slice(2); // 앞의 ./를 뺀 파일명을 고유 번호로 사용합니다.
    images.push({
      id,
      src: source.default || source,
    });
  }
  return images;
}

// 순번 대신 파일명 전체를 저장하므로 중간에 파일을 추가해도 기존 선택이 달라지지 않습니다.
export const productImages = collectProductImages(imageFiles);

// 자동 수집 전 저장한 선택을 복원하기 위한 이전 ID → 원래 파일명 대응표입니다.
const previousImageFiles = {
  tumbler: "01-stainless-tumbler.jpg", ecobag: "02-canvas-ecobag.jpg",
  mug: "03-ceramic-mug.jpg", keyring: "04-acrylic-keyring.jpg",
  tshirt: "05-group-tshirt.jpg", pen: "06-logo-pen.jpg", pouch: "07-fabric-pouch.jpg",
  badge: "08-metal-badge.jpg", notebook: "09-promotional-notebook.jpg", sticker: "10-logo-sticker.jpg",
};

export function findProductImage(value) {
  if (typeof value !== "string") return undefined;
  let id = value;
  if (value.startsWith("catalog:")) {
    id = value.slice("catalog:".length);
    // 이전 선택 이름만 파일명으로 바꿉니다. 기본 이미지 파일명은 그대로 찾습니다.
    id = previousImageFiles[id] || id;
  }
  return productImages.find(item => item.id === id);
}
