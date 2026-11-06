export const isProjectDelayed = (project) => {

    if (!project.dueDate || project.status === '완료') {
        return false
    }

    return project.dueDate < new Date().toLocaleDateString('sv-SE')

}

export const getProjectStatus = (project) => {
    if (isProjectDelayed(project)) {
        return '지연'
    } else {
        return project.status
    }
}

export const getDeadlineStatus = (project) => {

    if (project.status === '완료'){
        return '완료'
    }

    if (!project.dueDate) {
        return '알 수 없음'
    }

    const today = new Date().toLocaleDateString('sv-SE')

    const daysLeft = (new Date(project.dueDate) - new Date(today)) / (60 * 60 * 24 * 1000)

    if (!Number.isFinite(daysLeft)) {
        return '정보 확인 불가'
    }

    if (daysLeft > 3) {
        return '정상'
    } else if (daysLeft > 0) {
        return `D - ${daysLeft}`
    } else if (daysLeft === 0) {
        return 'D-Day'
    } else {
        return `D + ${Math.abs(daysLeft)} (지연됨)`
    }

}

export const getProjectProgress = (project, tasks) => {

    const taskStatus = ["제작 관리", "검수 관리", "포장 관리", "배송 관리"]

    const completedCount = tasks.filter(t =>
        t.projectId === project.id &&
        t.progress === '완료'
    ).length

    return completedCount / taskStatus.length * 100

}