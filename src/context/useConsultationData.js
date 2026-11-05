import React, { useState, useEffect } from "react";
import { consultations as initialConsultations } from "../data/mockData";



export default function useConsultationData() {


    const savedConsultations = localStorage.getItem("erp_consultations")

    const parsedConsultations = JSON.parse(savedConsultations)

    const [consultations, setConsultations] = useState(

        parsedConsultations === null ? initialConsultations : parsedConsultations)

    useEffect(() => {
        localStorage.setItem("erp_consultations", JSON.stringify(consultations))
    }, [consultations]);



    function addConsultation(editData) {

        const newId = Math.max(
            0,
            ...consultations.map((item) => item.id)) + 1;

        const newConsultation = {
            ...editData, id: newId, status: editData.status || "문의 접수"
        }

        setConsultations([...consultations, newConsultation])
    }



    function updateConsultation(editData) {

        setConsultations(
            consultations.map((item) =>
                item.id === editData.id ? editData : item
            )
        )
    }



    function deleteConsultations(checkIds){

        setConsultations(consultations.filter((item) =>
            !checkIds.includes(item.id))
        )

    }

    return {
        consultations,
        setConsultations,
        addConsultation,
        updateConsultation,
        deleteConsultations
    }
}