import React, { useState } from "react";
import './projects.css';
import ProjectList from "./ProjectList";
import ProjectForm from "./ProjectForm";
import ProjectDetail from "./ProjectDetail";
import { quotations } from "../data/mockData";
import ProjectEdit from "./ProjectEdit";
import NotFoundPage from "../components/NotFoundPage";
import { Route, Routes } from "react-router-dom";

function ProjectPage() {

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
                        <ProjectList setPage={setPage} search={search} setSearch={setSearch}
                            searchstat={searchstat} setSearchStat={setSearchStat}
                            setSelectedProjectId={setSelectedProjectId} />
                    }
                    {/* 새 프로젝트 등록 화면 */}
                    {page === 'newproject' &&
                        <ProjectForm setPage={setPage} quotations={quotations} />
                    }
                    {/* 프로젝트 상세 화면 */}
                    {page === 'detail' &&
                        <ProjectDetail setPage={setPage} selectedProjectId={selectedProjectId}
                            quotations={quotations} />
                    }
                    {/* 프로젝트 수정 화면 */}
                    {page === 'edit' &&
                        <ProjectEdit setPage={setPage} selectedProjectId={selectedProjectId} />}
                </div>} />
            <Route path='*' element={<NotFoundPage />} />
        </Routes>
    );
}

export default ProjectPage;
