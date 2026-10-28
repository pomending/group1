export const projectKey = "moduProjects"

//기존 프로젝트 관리에 있던 기본 프로젝트
export function loadProjects(){
    try{
        //브라우저에 저장된 프로젝트 목록 가져오기
        const saved = localStorage.getItem(projectKey)

        //등록된 프로젝트가 없으면 빈 배열 사용
        if(!saved){
            return[]
        }

        //저장된 문자열을 배열로 변경
        const data =JSON.parse(saved)

        //올바른 배열이라면 그대로 사용
        if(Array.isArray(data)){
            return data
        }
        return[]
    }catch{
        //저장된 데이터를 읽을 수 없으면 빈 배열 사용
        return[]
    }
}