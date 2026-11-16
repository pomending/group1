import { useEffect, useState } from "react";
import { claims as initialClaims } from "../data/mockData";
import { validateClaim } from "../utils/claimUtils";

function useClaimData() {

    const STORAGE_KEY = "erp_claims";
    const NEXT_ID_KEY = "erp_claim_next_id";

    const [claims, setClaims] = useState(() => {

        try {
            const savedClaims = localStorage.getItem(STORAGE_KEY);

            if (savedClaims !== null) {

                const parsedClaims = JSON.parse(savedClaims);

                if (Array.isArray(parsedClaims)) {
                    return parsedClaims;
                }
            }

        } catch (error) {
            console.error("클레임 데이터 불러오기 실패", error);
        }

        return initialClaims;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    }, [claims]);


    // 클레임 등록
    const addClaim = (newClaim) => {

        const result = validateClaim({
            ...newClaim,
            status: "접수"
        });
        
        if (!result.ok) {
            return result;
        }

        const savedNextId = Number(
            localStorage.getItem(NEXT_ID_KEY)
        );

        const maxId = Math.max(
            0, ...claims.map(c => Number(c.id) || 0)
        );

        const newId = Math.max(
            maxId + 1,
            Number.isSafeInteger(savedNextId) && savedNextId > 0
                ? savedNextId
                : 1
        );

        localStorage.setItem(
            NEXT_ID_KEY,
            String(newId + 1)
        );

        setClaims(prev => [
            ...prev,
            {
                ...newClaim,
                id: newId,
                status: "접수",
                createdAt: new Date().toLocaleDateString("sv-SE")
            }
        ]);

        return { ok: true, id: newId };
    };


    // 클레임 수정
    const updateClaim = (updatedClaim) => {

        if (
            !updatedClaim ||
            typeof updatedClaim !== "object" ||
            !Number.isSafeInteger(updatedClaim.id) ||
            updatedClaim.id <= 0
        ) {
            return {
                ok: false,
                message: "올바르지 않은 클레임 정보입니다."
            };
        }

        const original = claims.find(
            c => c.id === updatedClaim.id
        );

        if (!original) {
            return {
                ok: false,
                message: "수정할 클레임이 존재하지 않습니다."
            };
        }

        const mergedClaim = {
            ...original,
            ...updatedClaim
        };

        if (original.consultationId !== mergedClaim.consultationId) {
            return {
                ok: false,
                message: "클레임의 주문번호는 변경할 수 없습니다."
            };
        }
        
        if (original.companyName !== mergedClaim.companyName) {
            return {
                ok: false,
                message: "클레임의 업체명은 변경할 수 없습니다."
            };
        }
        
        const result = validateClaim(mergedClaim);
        
        if (!result.ok) {
            return result;
        }

        setClaims(prev =>
            prev.map(c =>
                c.id === updatedClaim.id
                    ? { ...c, ...updatedClaim }
                    : c
            )
        );

        return { ok: true };
    };


    // 클레임 삭제
    const deleteClaim = (id) => {

        if (!claims.some(c => c.id === id)) {
            return {
                ok: false,
                message: "삭제할 클레임이 존재하지 않습니다."
            };
        }

        setClaims(prev =>
            prev.filter(c => c.id !== id)
        );

        return { ok: true };
    };


    // 클레임 전체 초기화
    const resetClaim = () => {

        const nextId = Math.max(
            0, ...initialClaims.map(c => Number(c.id) || 0)
        ) + 1;

        localStorage.setItem(
            NEXT_ID_KEY,
            String(nextId)
        );

        setClaims([...initialClaims]);
    };


    return {
        claims,
        addClaim,
        updateClaim,
        deleteClaim,
        resetClaim
    };
}

export default useClaimData;