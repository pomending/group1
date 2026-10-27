import React, { useState } from "react";
import './projects.css';
import ProjectList from "./ProjectList";
import ProjectForm from "./ProjectForm";
import ProjectDetail from "./ProjectDetail";
import { quotations, customers, employees } from "../data/mockData";
import ProjectEdit from "./ProjectEdit";
import NotFoundPage from "../components/NotFoundPage";
import { Route, Routes } from "react-router-dom";
import { useERP } from "../context/ERPContext";

function ProjectPage() {

    const { projects, setProjects } = useERP()

    // 검색어 변수
    const [search, setSearch] = useState('');
    // select 상태 변수
    const [searchstat, setSearchStat] = useState('');
    // 화면 전환을 위한 변수
    const [page, setPage] = useState('list');
    // 상세 보기를 하려는 프로젝트의 ID
    const [selectedProjectId, setSelectedProjectId] = useState('');

    return (

        <Routes>
            <Route index element={
                <div>
                    {/* 기본 상태일 때는 프로젝트 리스트 확인 */}
                    {page === 'list' &&
                        <ProjectList projects={projects} page={page} setPage={setPage}
                            search={search} setSearch={setSearch}
                            searchstat={searchstat} setSearchStat={setSearchStat}
                            selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} />
                    }
                    {/* 새 프로젝트 등록 화면 */}
                    {page === 'newproject' &&
                        <ProjectForm page={page} setPage={setPage}
                            projects={projects} setProjects={setProjects}
                            quotations={quotations} customers={customers} employees={employees} />
                    }
                    {/* 프로젝트 상세 화면 */}
                    {page === 'detail' &&
                        <ProjectDetail setPage={setPage} projects={projects} selectedProjectId={selectedProjectId}
                            quotations={quotations} customers={customers} employees={employees} />
                    }
                    {/* 프로젝트 수정 화면 */}
                    {page === 'edit' &&
                        <ProjectEdit setPage={setPage}
                            projects={projects} selectedProjectId={selectedProjectId}
                            customers={customers} employees={employees}/>}
                </div>} />
            <Route path='*' element={<NotFoundPage />} />
        </Routes>
    );
}

export default ProjectPage;
