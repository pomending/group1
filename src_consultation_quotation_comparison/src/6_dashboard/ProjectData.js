export const projectKey = "moduProjects"

// 프로젝트 저장 키
export function loadProjects(){
    try{
        // 프로젝트 불러오기
        const saved = localStorage.getItem(projectKey)

        // 빈 데이터 처리
        if(!saved){
            return[]
        }

        // JSON 변환
        const data =JSON.parse(saved)

        // 배열 확인
        if(Array.isArray(data)){
            return data
        }
        return[]
    }catch{
        // 읽기 오류 처리
        return[]
    }
}
