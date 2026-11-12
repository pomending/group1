// 3_project 관련 공통 함수

import { useEffect, useState } from "react"
import { initialProjects } from "../data/mockData"
import { validateProject } from "../utils/projectUtils"

export function useProjectData() {

    const STORAGE_KEY = 'erp_projects'
    const NEXT_ID_KEY = 'erp_project_next_id'
    const NEXT_PH_ID_KEY = 'erp_project_history_next_id'
    const PH_KEY = 'erp_project_history'

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

    useEffect(() => {
        // localStorage에 projects를 문자열로 변환해서 저장
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
        // [projects] : projects가 변경될 경우마다
    }, [projects])

    useEffect(() => {
        localStorage.setItem(PH_KEY, JSON.stringify(projectHistory))
    }, [projectHistory])

    const addProject = (newProject) => {

        const error = validateProject(newProject)

        if (error) {
            return { ok: false, message: error };
        }

        // 견적 중복 사용 검증
        const alreadyUsed = projects.some(
            p => p.quotationId === newProject.quotationId
        );

        if (alreadyUsed) {
            return {
                ok: false,
                message: "이미 다른 프로젝트에서 사용 중인 견적입니다."
            };
        }

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

        return { ok: true };

    }

    const updateProject = (updatedProject) => {

        if (!Number.isSafeInteger(updatedProject.id) || updatedProject.id <= 0) {
            return {
                ok: false,
                message: "올바르지 않은 프로젝트 ID입니다."
            };
        }

        const original = projects.find(p => p.id === updatedProject.id)

        if (!original) {
            return {
                ok: false,
                message: "수정할 프로젝트를 찾을 수 없습니다."
            };
        }

        // 완료된 프로젝트 수정 금지
        if (original.status === "완료") {
            return {
                ok: false,
                message: "완료된 프로젝트는 수정할 수 없습니다."
            };
        }

        // 일반 수정으로 프로젝트 완료 처리 금지
        if (updatedProject.status === "완료") {
            return {
                ok: false,
                message: "프로젝트는 배송 완료 시 자동으로 완료 처리됩니다."
            };
        }

        const error = validateProject({
            ...original,
            ...updatedProject
        });

        if (error !== null) {
            return { ok: false, message: error };
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
            return { ok: false, message: "변경사항이 없습니다" };
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

        return { ok: true };

    }

    const deleteProject = (id) => {

        if (!Number.isSafeInteger(id) || id <= 0) {
            return {
                ok: false,
                message: "올바르지 않은 프로젝트 ID입니다."
            };
        }

        const project = projects.find(p => p.id === id)

        if (!project) {
            return {
                ok: false,
                message: "삭제할 프로젝트를 찾을 수 없습니다."
            };
        }

        if (project.status === "완료") {
            return {
                ok: false,
                message: "완료된 프로젝트는 삭제할 수 없습니다."
            };
        }

        setProjects(prev =>
            prev.filter(project => project.id !== id))

        setProjectHistory(prev =>
            prev.filter(history => history.projectId !== id))

        return { ok: true };

    }

    const completeProject = (projectId) => {

        if (!Number.isSafeInteger(projectId) || projectId <= 0) {
            return {
                ok: false,
                message: "올바르지 않은 프로젝트 ID입니다."
            };
        }

        const original = projects.find(p => p.id === projectId);

        if (!original) {
            return {
                ok: false,
                message: "프로젝트를 찾을 수 없습니다."
            };
        }

        if (original.status === "완료") {
            return {
                ok: false,
                message: "이미 완료된 프로젝트입니다."
            };
        }

        const completedDate = new Date().toLocaleDateString("sv-SE");

        setProjects(prev => prev.map(project =>
            project.id === projectId
                ? {
                    ...project,
                    status: "완료",
                    completedDate
                }
                : project
        ));

        const nextId = Number(localStorage.getItem(NEXT_PH_ID_KEY)) || 1

        const maxId = Math.max(
            0, ...projectHistory.map(ph => Number(ph.id) || 0)
        )

        const newId = Math.max(
            maxId + 1,
            Number.isSafeInteger(nextId) && nextId > 0 ?
                nextId : 1
        )

        setProjectHistory(prev =>
            [...prev, {
                id: newId,
                projectId,
                changedAt: new Date().toISOString(),
                changes: [{
                    field: "status",
                    oldValue: original.status,
                    newValue: "완료"
                }, {
                    field: "completedDate",
                    oldValue: original.completedDate,
                    newValue: completedDate
                }]
            }])

        localStorage.setItem(NEXT_PH_ID_KEY, String(newId + 1))

        return { ok: true };

    };

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

    return {
        projects,
        projectHistory,
        addProject,
        updateProject,
        deleteProject,
        completeProject,
        resetProjects
    }

}

export default useProjectData