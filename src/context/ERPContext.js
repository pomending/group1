import React, { createContext, useContext, useEffect, useState } from "react";
import { initialProjects } from "../data/mockData";

const ERPContext = createContext(null)

const STORAGE_KEY = 'erp_projects'

export function ERPProvider({ children }) {

    // 프로젝트의 상태를 localStorage에서 관리 > useState의 초기화 함수
    const [projects, setProjects] = useState(()=>{

        try{
            // localStorage에서 STORAGE_KEY로 등록된 문자열을 가져옴
            const savedProjects = localStorage.getItem(STORAGE_KEY)

            if( savedProjects !== null ){
                // 문자열을 JSON.parse를 통해 json 형태로 바꿈
                const parsedProjects = JSON.parse(savedProjects)
                // projects는 배열 형태이므로 배열인지 체크
                if(Array.isArray(parsedProjects)){
                    return parsedProjects
                }

            }

        }catch(error){
            console.error('프로젝트 데이터 불러오기 실패', error)
        }
        // 에러가 났거나, if문을 통과 못했다면 initialProjects를 가져온다
        return initialProjects
    })

    useEffect(()=>{
        // localStorage에 projects를 문자열로 변환해서 저장
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
        // [projects] : projects가 변경될 경우마다
    }, [projects])

    const addProject = (newProject) => {
        setProjects(prev => [
            ...prev, {
                ...newProject,
                id: Math.max(0, ...prev.map(p => Number(p.id) || 0)) + 1
            }
        ])
    }

    const updateProject = (updatedProject) => {
        setProjects(prev => prev.map (project =>
            project.id === updatedProject.id
                ? { ...project, ...updatedProject }
                : project
        ))
    }

    const deleteProject = (id) => {
        setProjects(prev => prev.filter(project => project.id !== id))
    }

    const resetProjects = () =>{
        setProjects(initialProjects)
    }

    return (
        <ERPContext.Provider value={{
            projects,
            setProjects,
            addProject,
            updateProject,
            deleteProject,
            resetProjects
        }}>
            {children}
        </ERPContext.Provider>
    )

}

export const useERP = () => useContext(ERPContext)


