import { useState, useEffect } from "react";
import { consultations as initialConsultations } from "../data/mockData";



export default function useConsultationData() {

    const [consultations, setConsultations] = useState(() => {
        try {
            const saved = localStorage.getItem("erp_consultations");

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
            "erp_consultations",
            JSON.stringify(consultations)
        );
    }, [consultations]);

    function addConsultation(editData) {

        const newId = Math.max(
            0,
            ...consultations.map((item) => item.id)) + 1;

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

        setConsultations(
            consultations.map((item) =>
                item.id === editData.id ? editData : item
            )
        )
    }

    function deleteConsultations(checkIds) {

        setConsultations(prev =>
            prev.filter(item =>
                !checkIds.includes(item.id)
            )
        );

    }

    // 전체 초기화 시 고객 목록과 다음 고객 ID도 원래 상태로 되돌린다.
    function resetConsultations() {
        setConsultations([...initialConsultations]);
    }

    return {
        consultations,
        setConsultations,
        addConsultation,
        updateConsultation,
        deleteConsultations,
        resetConsultations
    }
}