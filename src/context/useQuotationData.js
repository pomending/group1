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

    // 견적 등록
    const addQuotation = (newQuotation) => {
        const newId = getNextQuotationId();

        localStorage.setItem(NEXT_ID_KEY, String(newId + 1));

        setQuotations(prev => [
            ...prev,
            { ...newQuotation, id: newId }
        ]);

        return newId;
    };

    // 견적 조회
    const getQuotation = (id) => {
        return quotations.find(q => q.id === Number(id));
    };

    // 견적 수정 및 승인 상태 변경
    const updateQuotation = (updatedQuotation) => {
        setQuotations(prev =>
            prev.map(q =>
                q.id === Number(updatedQuotation.id)
                    ? { ...q, ...updatedQuotation }
                    : q
            )
        );
    };

    // 견적 삭제
    const deleteQuotation = (id) => {
        setQuotations(prev =>
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
