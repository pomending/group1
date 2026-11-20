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

        return { ok: true };
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

        // 종료·인계 완료된 상담은 모든 수정 금지
        if (["문의 종료", "인계 완료"].includes(original.status)) {
            return {
                ok: false,
                message: `${original.status} 상태의 상담은 수정할 수 없습니다.`
            };
        }

        const isLocked = original.status === "견적 요청";

        // 상태 및 고객 변경 제한
        if (isLocked) {

            if (original.status !== editData.status) {
                return {
                    ok: false,
                    message: `${original.status} 상태의 상담은 상태를 변경할 수 없습니다.`
                };
            }

            if (
                original.customerId !== editData.customerId ||
                original.companyName !== editData.companyName
            ) {
                return {
                    ok: false,
                    message: `${original.status} 상태의 상담은 고객을 변경할 수 없습니다.`
                };
            }
        }

        if (
            original.status !== "인계 완료" &&
            editData.status === "인계 완료"
        ) {
            return {
                ok: false,
                message: "견적이 정식 등록되면 자동으로 인계 완료됩니다."
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

        const hasLockedConsultation = consultations.some(c =>
            checkIds.includes(c.id) &&
            ["견적 요청", "문의 종료", "인계 완료"].includes(c.status)
        );

        if (hasLockedConsultation) {
            return {
                ok: false,
                message: "견적 요청, 문의 종료 또는 인계 완료된 상담은 삭제할 수 없습니다."
            };
        }

        setConsultations(prev =>
            prev.filter(item =>
                !checkIds.includes(item.id)
            )
        );

        return { ok: true };
    }

    function completeConsultationTransfer(id) {

        const original = consultations.find(c => c.id === id)

        if (!original) {
            return {
                ok: false,
                message: "존재하지 않는 상담입니다."
            };
        }

        if (
            original.status !== "견적 요청"
        ) {
            return {
                ok: false,
                message: "견적 요청이 되지 않은 상담은 인계될 수 없습니다."
            };
        }

        setConsultations(prev =>
            prev.map(c =>
                c.id === original.id ? {
                    ...c, status: "인계 완료"
                } : c
            )
        )

        return { ok: true };

    }

    function checkConsultationTransfer(id) {

        const original = consultations.find(c => c.id === id);

        if (!original) {
            return {
                ok: false,
                message: "존재하지 않는 상담입니다."
            };
        }

        if (original.status !== "견적 요청") {
            return {
                ok: false,
                message: "견적 요청이 되지 않은 상담은 인계될 수 없습니다."
            };
        }

        return { ok: true };
    }


    function resetConsultations() {
        setConsultations([...initialConsultations]);
    }

    return {
        consultations,
        addConsultation,
        updateConsultation,
        deleteConsultations,
        completeConsultationTransfer,
        checkConsultationTransfer,
        resetConsultations
    }
}