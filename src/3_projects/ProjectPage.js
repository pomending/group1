
import React, { useState } from "react";
import './projects.css';
import ProjectList from "./ProjectList";
import ProjectForm from "./ProjectForm";
import ProjectDetail from "./ProjectDetail";

function ProjectPage() {

    const [projects, setProjects] = useState([
        {
            id: 1,
            name: "ABC대학교 텀블러 제작",
            quotationId: 1,
            customerId: 1,
            managerId: 1,
            startDate: "2026-10-21",
            dueDate: "2026-11-20",
            completedDate: null,
            status: "진행 중",
            description: "창립기념 텀블러 300개 제작"
        },
        {
            id: 2,
            name: "미래전자 에코백 제작",
            quotationId: 2,
            customerId: 2,
            managerId: 2,
            startDate: "2026-10-25",
            dueDate: "2026-11-15",
            completedDate: null,
            status: "대기",
            description: "홍보용 에코백 500개 제작"
        }
    ])

    // 검색어 변수
    const [search, setSearch] = useState('');
    // select 상태 변수
    const [searchstat, setSearchStat] = useState('');
    // 화면 전환을 위한 변수
    const [page, setPage] = useState('list')

    return (
        <div>
            {/* 기본 상태일때는 프로젝트 리스트 확인 */}
            {page === 'list' &&
                <ProjectList projects={projects} page={page} setPage={setPage}
                    search={search} setSearch={setSearch}
                    searchstat={searchstat} setSearchStat={setSearchStat} />
            }
            {/* 새 프로젝트를 누르면 새 프로젝트 등록화면으로 전환 */}
            {page === 'newproject' &&
                <ProjectForm page={page} setPage={setPage} 
                             projects={projects} setProjects={setProjects}/>
            }
            {page === 'detail' && 
                <ProjectDetail />
            }
        </div>
    );
}

export default ProjectPage;
