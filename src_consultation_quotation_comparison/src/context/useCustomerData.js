import { useEffect, useState } from "react";
import { customers as initialCustomers } from "../data/mockData";


export function useCustomerData() {

    //고객 데이터 상태관리
    const [customers, setCustomers] = useState(() => {
        const savedCustomers = localStorage.getItem("erp_customers")

        return savedCustomers
            ? JSON.parse(savedCustomers) : initialCustomers;
    })


    //고객 데이터 localstorage 저장
    useEffect(() => {
        localStorage.setItem("erp_customers", JSON.stringify(customers));
    }, [customers])



    //신규고객등록 및 목록추가
    function addCustomer(newCustomer) {
        // 저장된 다음 고객 ID 불러오기
        const savedNextId = Number(localStorage.getItem("crm_next_id"));
        // 현재 고객 목록에서 가장 큰 ID 찾기
        const maxId = Math.max(
            0,
            ...customers.map((customer) => Number(customer.id) || 0)
        );
        // 다음 발급 ID와 현재 최대 ID + 1 중 큰 값 선택
        const newId = Math.max(maxId + 1, savedNextId || 1);
        console.log("새 고객 ID:", newId);
        // 다음에 발급할 ID 저장
        localStorage.setItem("crm_next_id", String(newId + 1));

        const updatedCustomers = [
            { ...newCustomer, id: newId },
            ...customers
        ];
        // 전체고객목록에 추가
        setCustomers(updatedCustomers);
        return newId;

    }


    //수정한 고객정보 저장
    function saveEditedCustomer(updateCustomer) {
        const updateCustomers = customers.map((customer) =>
            customer.id === updateCustomer.id
                ? updateCustomer
                : customer
        );

        setCustomers(updateCustomers);
    }
    //고객삭제
    function deleteCustomers(ids) {
        const remainingCustomers = customers.filter((customer) =>
            !ids.includes(customer.id)
        );
        setCustomers(remainingCustomers);
    }



    // 전체 초기화 시 고객 목록과 다음 고객 ID도 원래 상태로 되돌린다.
    function resetCustomers() {
        localStorage.removeItem("crm_next_id");
        setCustomers([...initialCustomers]);
    }

    return {

        customers,
        setCustomers,
        addCustomer,
        saveEditedCustomer,
        deleteCustomers,
        resetCustomers



    };
}

export default useCustomerData
