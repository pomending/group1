import { useState, useEffect } from "react";
import { consultations as initialConsultations } from "../data/mockData";

export default function useConsultationData() {

    const NEXT_ID_KEY = "erp_consultation_next_id";
    const STORAGE_KEY = "erp_consultations";

    const [consultations, setConsultations] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved !== null) {
                const parsed = JSON.parse(saved);

                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
        } catch (error) {
            console.error("상담 데이터 불러오기 실패", error);
        }

        return initialConsultations;
    });

    useEffect(() => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(consultations)
        );
    
        const savedNextId = Number(
            localStorage.getItem(NEXT_ID_KEY)
        );
    
        const maxId = Math.max(
            0,
            ...consultations.map(c => c.id),
            ...initialConsultations.map(c => c.id)
        );
    
        if (
            !Number.isSafeInteger(savedNextId) ||
            savedNextId <= maxId
        ) {
            localStorage.setItem(
                NEXT_ID_KEY,
                String(maxId + 1)
            );
        }
    
    }, [consultations]);

    // function addConsultation(editData) {

    //     const newId = Math.max(
    //         0,
    //         ...consultations.map((item) => item.id)) + 1;

    //     const newConsultation = {
    //         ...editData,
    //         id: newId,
    //         status: editData.status || "문의 접수"
    //     };

    //     setConsultations(prev => [
    //         newConsultation,
    //         ...prev
    //     ]);
    // }

    function addConsultation(editData) {

        const savedNextId = Number(
            localStorage.getItem(NEXT_ID_KEY)
        );

        const maxId = Math.max(
            0,
            ...consultations.map(c => Number(c.id) || 0)
        );

        const newId = Math.max(
            maxId + 1,
            Number.isSafeInteger(savedNextId) && savedNextId > 0
                ? savedNextId
                : 1
        );

        localStorage.setItem(NEXT_ID_KEY, String(newId + 1));

        const newConsultation = {
            ...editData,
            id: newId,
            status: editData.status || "문의 접수"
        };

        setConsultations(prev => [
            newConsultation,
            ...prev
        ]);
    }

    function updateConsultation(editData) {

        const original = consultations.find(
            c => c.id === editData.id
        );
    
        if (!original) {
            return {
                ok: false,
                message: "존재하지 않는 상담입니다."
            };
        }
    
        if (
            original.status === "견적 요청" &&
            editData.status !== "견적 요청"
        ) {
            return {
                ok: false,
                message: "견적 요청된 상담의 상태는 변경할 수 없습니다."
            };
        }

        if (
            original.status === "견적 요청" &&
            original.customerId !== editData.customerId
        ) {
            return {
                ok: false,
                message: "견적 요청된 상담의 고객은 변경할 수 없습니다."
            };
        }
    
        setConsultations(prev =>
            prev.map(item =>
                item.id === editData.id ? editData : item
            )
        );
    
        return { ok: true };
    }

    function deleteConsultations(checkIds) {

        setConsultations(prev =>
            prev.filter(item =>
                !checkIds.includes(item.id)
            )
        );
    
        return { ok: true };
    }

    // 전체 초기화 시 고객 목록과 다음 고객 ID도 원래 상태로 되돌린다.
    function resetConsultations() {
        setConsultations([...initialConsultations]);
    }

    return {
        consultations,
        addConsultation,
        updateConsultation,
        deleteConsultations,
        resetConsultations
    }
}