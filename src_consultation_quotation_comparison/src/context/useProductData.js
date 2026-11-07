import { useRef, useState } from "react";
import { products as initialProducts } from "../data/mockData";

const inputFields = ["productName", "productPrice", "productStatus"];
const STORAGE_KEY = "erp_products";
export const PRODUCT_STATUS = { SELLING: "판매 중", STOPPED: "판매중지" };
export const normalizeProductName = value => value.trim().normalize().toLocaleLowerCase("ko-KR");

// 입력 필드만 선택합니다. 부분 수정에서는 전달하지 않은 필드를 유지합니다.
function getChanges(values) {
    return Object.fromEntries(inputFields
        .filter(key => values != null && Object.prototype.hasOwnProperty.call(values, key))
        .map(key => [key, values[key]]));
}

const failure = (field, message) => ({ ok: false, field, message });

// 모든 등록·수정 호출이 같은 검증 순서를 거칩니다. 화면은 반환된 필드에 오류를 표시합니다.
function validateProduct(values, products, id) {
    const name = values.productName;
    if (typeof name !== "string" || !name.trim()) return failure("productName", "상품명을 입력해 주세요.");
    if (name.length > 100) return failure("productName", "상품명은 100자 이내로 입력해 주세요.");
    const price = values.productPrice;
    if (!["number", "string"].includes(typeof price) || (typeof price === "string" && !price.trim())) {
        return failure("productPrice", "기본 단가는 0 이상의 정수로 입력해 주세요.");
    }
    const amount = Number(price);
    if (!Number.isSafeInteger(amount) || amount < 0) return failure("productPrice", "기본 단가는 0 이상의 정수로 입력해 주세요.");
    if (products.some(product => product.id !== id && typeof product.productName === "string"
        && normalizeProductName(product.productName) === normalizeProductName(name))) {
        return failure("productName", "이미 등록된 상품명입니다. 다른 이름을 입력해 주세요.");
    }
    if (!Object.values(PRODUCT_STATUS).includes(values.productStatus)) return failure("productStatus", "판매 상태를 선택해 주세요.");
    return { ok: true, values: { productName: name.trim(), productPrice: amount, productStatus: values.productStatus } };
}

// 저장된 목록은 통째로 확인합니다. 손상된 항목을 조용히 버리거나 원본을 덮어쓰지 않습니다.
function isStoredProductList(value) {
    if (!Array.isArray(value)) return false;
    const ids = new Set();
    return value.every(product => {
        if (!product || !["number", "string"].includes(typeof product.id)
            || ids.has(String(product.id)) || typeof product.productName !== "string"
            || !product.productName.trim() || product.productName.length > 100
            || !Number.isSafeInteger(product.productPrice) || product.productPrice < 0
            || !Object.values(PRODUCT_STATUS).includes(product.productStatus)) return false;
        ids.add(String(product.id));
        return true;
    });
}

// ERPProvider가 한 번 생성하는 상품 상태입니다. 기본 초기값은 mockData이며
// 화면은 이 Hook을 직접 호출하지 않고 Context로 제공된 같은 상태를 사용합니다.
// 초기 목록을 객체 단위로 복사해 편집·초기화가 입력 원본을 바꾸지 않게 합니다.
export function useProductData(seedProducts = initialProducts) {
    const createInitialProducts = () => seedProducts.map(product => ({ ...product }));
    const readFailed = useRef(false);
    const [products, setProductState] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw === null) return createInitialProducts();
            const saved = JSON.parse(raw);
            if (!isStoredProductList(saved)) throw new Error("Invalid product data");
            return saved;
        } catch {
            readFailed.current = true;
            return createInitialProducts();
        }
    });
    const [productStorageError, setProductStorageError] = useState(readFailed.current
        ? "저장된 상품을 읽지 못했습니다. 원본 보호를 위해 상품 변경 저장을 중지했습니다." : "");
    const latestProducts = useRef(products);

    // 저장 성공 뒤에만 공통 상태와 성공 결과를 갱신해 즉시 새로고침과 저장 실패에도 대응합니다.
    // 초기 읽기 실패는 명시적인 상품 초기화 외에는 손상된 저장값을 덮어쓰지 않습니다.
    function commitProducts(next, reset = false) {
        if (readFailed.current && !reset) {
            return failure(null, "저장된 상품을 읽지 못해 변경을 저장할 수 없습니다. 기존 저장 자료를 확인해 주세요.");
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
            const message = "상품을 저장하지 못했습니다. 브라우저 저장 공간·접근 설정을 확인한 뒤 다시 시도해 주세요.";
            setProductStorageError(message);
            return failure(null, message);
        }
        readFailed.current = false;
        latestProducts.current = next;
        setProductState(next);
        setProductStorageError("");
        return { ok: true };
    }

    // React 재렌더 전 연속 호출도 최신 목록을 사용합니다. 기존 함수형 갱신 계약을 유지합니다.
    const setProducts = (value) => commitProducts(typeof value === "function" ? value(latestProducts.current) : value);

    const addProduct = (newProduct) => {
        const current = latestProducts.current;
        const result = validateProduct(getChanges(newProduct), current);
        if (!result.ok) return result;
        const now = new Date().toISOString();
        const product = {
            ...result.values,
            id: Math.max(0, ...current.map(product => Number(product.id) || 0)) + 1,
            productCreatedAt: now,
            productUpdatedAt: "",
        };
        const saved = setProducts([...current, product]);
        if (!saved.ok) return saved;
        return { ok: true, changed: true, product };
    };

    // ID·등록일·기타 필드와 다른 상품을 유지하며 실제 변경에만 수정일을 기록합니다.
    // 판매 상태 변경도 updateProduct({ id, productStatus })로 같은 규칙을 사용합니다.
    const updateProduct = (updatedProduct) => {
        const current = latestProducts.current;
        const original = current.find(product => product.id === updatedProduct?.id);
        if (!original) return failure(null, "수정할 상품을 찾을 수 없습니다. 취소한 뒤 목록을 확인해 주세요.");
        const changes = getChanges(updatedProduct);
        const result = validateProduct({ ...original, ...changes }, current, original.id);
        if (!result.ok) return result;
        // 정리한 값도 요청에 포함된 필드만 반영해 상태 변경이 이름·단가를 덮어쓰지 않게 합니다.
        const input = Object.fromEntries(Object.keys(changes).map(key => [key, result.values[key]]));
        if (Object.keys(input).every(key => original[key] === input[key])) {
            return { ok: true, changed: false, product: original };
        }
        const product = { ...original, ...input, productUpdatedAt: new Date().toISOString() };
        const saved = setProducts(current.map(item => item.id === original.id ? product : item));
        if (!saved.ok) return saved;
        return { ok: true, changed: true, product };
    };

    const resetProducts = () => {
        return commitProducts(createInitialProducts(), true);
    };

    // setProducts는 기존 Context 소비자의 호환용이며 10번 화면에는 직접 노출하지 않습니다.
    return {
        products,
        setProducts,
        addProduct,
        updateProduct,
        resetProducts,
        productStorageError,
    };
}

export default useProductData;
