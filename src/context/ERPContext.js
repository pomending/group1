import React, { createContext, useContext, useEffect, useState } from "react";
import {
    initialProjects,
    customers as initialCustomers,
    initialEmployees
} from "../data/mockData";

const ERPContext = createContext(null)

const STORAGE_KEY = 'erp_projects'
const NEXT_ID_KEY = 'erp_project_next_id'
const NEXT_PH_ID_KEY = 'erp_project_history_next_id'
const PH_KEY = 'erp_project_history'

export function ERPProvider({ children }) {

    

    const [employees, setEmployees] = useState(initialEmployees)

    // localStorage에서 저장된 프로젝트를 불러와 useState의 초기값으로 설정
    const [projects, setProjects] = useState(() => {

        try {
            // localStorage에서 STORAGE_KEY로 등록된 문자열을 가져옴
            const savedProjects = localStorage.getItem(STORAGE_KEY)

            if (savedProjects !== null) {
                // JSON 문자열을 JavaScript 배열로 변환
                const parsedProjects = JSON.parse(savedProjects)
                // projects는 배열 형태이므로 배열인지 체크
                if (Array.isArray(parsedProjects)) {
                    return parsedProjects
                }

            }

        } catch (error) {
            console.error('프로젝트 데이터 불러오기 실패', error)
        }
        // 에러가 났거나, if문을 통과 못했다면 initialProjects를 가져온다
        return initialProjects

    })

    const [projectHistory, setProjectHistory] = useState(() => {

        try {

            const savedHistory = localStorage.getItem(PH_KEY)

            if (savedHistory !== null) {

                const parsedHistory = JSON.parse(savedHistory)

                if (Array.isArray(parsedHistory)) {
                    return parsedHistory
                }

            }

        } catch (error) {
            console.error('project history 불러오기 실패', error)
        }

        return []

    })

    const [customers, setCustomers] = useState(()=>{
        const savedCustomers = localStorage.getItem("erp_customers")

        return savedCustomers
        ? JSON.parse(savedCustomers) :initialCustomers;
    })

    useEffect(() => {
        // localStorage에 projects를 문자열로 변환해서 저장
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
        // [projects] : projects가 변경될 경우마다
    }, [projects])

    useEffect(() => {
        localStorage.setItem(PH_KEY, JSON.stringify(projectHistory))
    }, [projectHistory])
    //추가
    useEffect(() => {
        localStorage.setItem("erp_customers", JSON.stringify(customers));
    }, [customers])


    const addProject = (newProject) => {

        const savedNextId = Number(localStorage.getItem(NEXT_ID_KEY))

        const maxId = Math.max(
            0, ...projects.map(p => Number(p.id) || 0)
        )

        const newId = Math.max(
            maxId + 1,
            Number.isSafeInteger(savedNextId) && savedNextId > 0 ?
                savedNextId : 1
        )

        localStorage.setItem(NEXT_ID_KEY, String(newId + 1))

        setProjects(prev => [
            ...prev, {
                ...newProject,
                id: newId
            }
        ])

    }

    const updateProject = (updatedProject) => {

        const original = projects.find(p => p.id === updatedProject.id)

        if (!original) {
            return
        }

        const changes = Object.keys(updatedProject)
            .filter(key =>
                key !== 'id' &&
                original[key] !== updatedProject[key]
            ).map(key => ({
                field: key,
                oldValue: original[key],
                newValue: updatedProject[key]
            }))

        if (changes.length === 0) {
            return
        }

        const nextId = Number(localStorage.getItem(NEXT_PH_ID_KEY)) || 1

        const maxId = Math.max(
            0, ...projectHistory.map(ph => Number(ph.id) || 0)
        )

        const newId = Math.max(
            maxId + 1,
            Number.isSafeInteger(nextId) && nextId > 0 ?
                nextId : 1
        )

        setProjects(prev => prev.map(project =>
            project.id === updatedProject.id
                ? { ...project, ...updatedProject }
                : project
        ))

        setProjectHistory(prev =>
            [...prev, {
                id: newId,
                projectId: original.id,
                changedAt: new Date().toISOString(),
                changes: changes
            }])

        localStorage.setItem(NEXT_PH_ID_KEY, String(newId + 1))

    }

    const deleteProject = (id) => {
        setProjects(prev =>
            prev.filter(project => project.id !== id))

        setProjectHistory(prev =>
            prev.filter(history => history.projectId !== id))
    }

    const resetProjects = () => {

        const nextId = Math.max(
            0,
            ...initialProjects.map(p => Number(p.id) || 0)
        ) + 1

        localStorage.setItem(NEXT_ID_KEY, String(nextId))

        setProjects(initialProjects)

        setProjectHistory([])

        localStorage.removeItem(NEXT_PH_ID_KEY)

    }

    /////////////////
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

    function deleteCustomers(ids){
        const remainingCustomers = customers.filter((customer) =>
            !ids.includes(customer.id)
        );
        setCustomers(remainingCustomers);        
    }



    return (
        <ERPContext.Provider value={{
            projects,
            setProjects,
            addProject,
            updateProject,
            deleteProject,
            resetProjects,
            projectHistory,
            employees,
            setEmployees,
            customers,
            setCustomers,
            addCustomer,
            saveEditedCustomer,
            deleteCustomers

        }}>
            {children}
        </ERPContext.Provider>
    )


}



export const useERP = () => useContext(ERPContext)


