// CRA(Webpack)가 빌드 시 폴더의 이미지 파일을 자동으로 수집합니다.
// 새 파일은 개발 서버 재컴파일 또는 배포 빌드 이후 선택창에 반영됩니다.
// Jest에는 Webpack의 파일 수집 기능이 없으므로 수집 규칙은 별도 테스트에서 검사합니다.
const imageFiles = process.env.NODE_ENV === "test" ? null
  : require.context("./images", false, /\.(jpe?g|png|webp|gif)$/i);

// 파일 ID는 그대로 두고 화면 이름만 바꾸므로 기존 상품의 이미지 연결을 유지합니다.
const imageNames = {
  "01-stainless-tumbler": "스테인리스 텀블러", "02-canvas-ecobag": "캔버스 에코백",
  "03-ceramic-mug": "도자기 머그컵", "04-acrylic-keyring": "아크릴 키링",
  "05-group-tshirt": "단체 티셔츠", "06-logo-pen": "로고 볼펜",
  "07-fabric-pouch": "패브릭 파우치", "08-metal-badge": "금속 배지",
  "09-promotional-notebook": "홍보용 노트", "10-logo-sticker": "로고 스티커",
  "11-wireless-mouse": "무선 마우스", "12-power-bank": "보조배터리",
  "13-wireless-charger": "무선 충전기", "14-sports-bottle": "스포츠 물병",
  "15-baseball-cap": "볼캡",
};

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
    const filename = id.replace(/\.[^.]+$/, ""); // 표시 이름에는 확장자를 빼 줍니다.
    images.push({
      id,
      name: imageNames[filename] || filename,
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
  const savedId = value.startsWith("catalog:") ? value.slice("catalog:".length) : value;
  const id = value.startsWith("catalog:") ? (previousImageFiles[savedId] || savedId) : savedId;
  return productImages.find(item => item.id === id);
}
