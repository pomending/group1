// 2_quotations 관련 공통 함수들


import { useState, useEffect } from "react";
import { quotations as initialQuotations } from "../data/mockData";

export default function useQuotationData() {

    const STORAGE_KEY = "erp_quotations";
    const NEXT_ID_KEY = "erp_quotation_next_id";

    // 견적 데이터 불러오기
    const [quotations, setQuotations] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved !== null) {
                const parsed = JSON.parse(saved);

                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error("견적 데이터 불러오기 실패", error);
        }

        return [...initialQuotations];
    });

    // 견적 데이터 자동 저장
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quotations));
    }, [quotations]);

    // 다음 견적 ID 생성
    const getNextQuotationId = () => {
        const savedNextId = Number(localStorage.getItem(NEXT_ID_KEY));

        const maxId = Math.max(
            0,
            ...quotations.map(q => Number(q.id) || 0)
        );

        return Math.max(
            maxId + 1,
            Number.isSafeInteger(savedNextId) && savedNextId > 0
                ? savedNextId
                : 1
        );
    };

    //견적 데이터 유효성 검사
    const validateQuotation = (quotation) => {

        //임시 저장은 필수 입력 검사 제외
        if (quotation.status === "임시 저장") {
            return { ok: true };
        }

        if (!quotation.customerId) {
            return { ok: false, message: "거래처를 선택해주세요." }
        }

        if (!quotation.productId) {
            return { ok: false, message: "상품을 선택해주세요." }
        }

        if (!quotation.employeeId) {
            return { ok: false, message: "내부 담당자를 선택해주세요." };
        }

        if (!quotation.createdAt) {
            return { ok: false, message: "작성일을 입력해주세요." };
        }

        //Number.isFinite()은 정상적인 숫자인지 확인해준다.
        if(!Number.isFinite(Number(quotation.quantity)) ||
            Number(quotation.quantity) <= 0){
                return {ok: false, message: "수량은 0보다 커야 합니다."}
        }

        if(!Number.isFinite(Number(quotation.unitPrice)) ||
            Number(quotation.unitPrice) <= 0){
                return {ok: false, message: "단가는 0보다 커야 합니다."}
        }

        //결제 방법 유효성 검사
        if(!quotation.paymentMethod){
            return {ok: false, message: "결제 방법을 선택해주세요."}
        }

        //견적 유효기간 필수 입력 검사
        if(!quotation.validUntil){
            return {ok: false, message: "견적 유효기간을 입력해주세요."}
        }

        //견적 유효기간 날짜 검사
        if(quotation.validUntil < quotation.createdAt){
                return {ok: false, message: "견적 유효기간은 작성일 이후여야 합니다."}
        }

        //납품 예정일 필수 입력 검사
        if(!quotation.deliveryDate){
            return {ok: false, message: "납품 예정일을 입력해주세요."}
        }

        //납품 예정일 날짜 검사
        if (quotation.deliveryDate < quotation.createdAt) {
            return { ok: false, message: "납품 예정일은 작성일 이후여야 합니다." };
        }

        return { ok: true };

    }

    // 견적 등록
    const addQuotation = (newQuotation) => {

        const result = validateQuotation(newQuotation)

        if(!result.ok){
            return result;
        }

        const newId = getNextQuotationId();

        localStorage.setItem(NEXT_ID_KEY, String(newId + 1));

        setQuotations(prev => [
            ...prev,
            { ...newQuotation, id: newId }
        ]);

        return {ok: true, id: newId};
    };

    // 견적 조회
    const getQuotation = (id) => {
        return quotations.find(q => q.id === Number(id));
    };

    // 견적 수정 및 승인 상태 변경
    const updateQuotation = (updatedQuotation) => {

        const existing = quotations.find(
            q => Number(q.id) === Number(updatedQuotation.id)
        )

        if(!existing){
            return {ok: false, message: "견적서를 찾을 수 없습니다."}
        }


        const mergedQuotation = {
            ...existing,
            ...updatedQuotation
        }

        const result = validateQuotation(mergedQuotation)

        if(!result.ok){
            return result
        }

        setQuotations(prev =>
            prev.map(q =>
                Number(q.id) === Number(updatedQuotation.id)
                ? mergedQuotation
                : q
            )
        )

        return {ok: true}

    };

    // 견적 삭제
    const deleteQuotation = (id) => {
        setQuotations(prev =>
            // 기존 견적서 목록에서 삭제하려는 번호만 빼고 나머지는 전부 남겨라라는 뜻
            prev.filter(q => q.id !== Number(id))
        );
    };

    // 견적 초기화
    const resetQuotations = () => {
        const nextId = Math.max(
            0,
            ...initialQuotations.map(q => Number(q.id) || 0)
        ) + 1;

        localStorage.setItem(NEXT_ID_KEY, String(nextId));
        setQuotations([...initialQuotations]);
    };

    return {
        quotations,
        getNextQuotationId,
        addQuotation,
        getQuotation,
        updateQuotation,
        deleteQuotation,
        resetQuotations
    };
}
