import React, { useState } from "react";
import { useERP } from "../context/ERPContext";
import "./ProjectDetailPage.css";

function ProjectDetailPage() {
  // ERPContext에서 필요한 데이터와 함수 가져오기
  const { projects, updateProject, deleteProject } = useERP();

  // 선택한 프로젝트 ID
  const [selectedId, setSelectedId] = useState("");

  // 수정할 프로젝트 정보
  const [detail, setDetail] = useState(null);

  // 프로젝트 선택
  const handleSelectProject = (e) => {
    const id = Number(e.target.value);

    setSelectedId(id);

    // 선택한 ID와 같은 프로젝트 찾기
    const selectedProject = projects.find(
      (project) => project.id === id
    );

    // 원본 데이터를 직접 수정하지 않도록 복사
    setDetail(selectedProject ? { ...selectedProject } : null);
  };

  // 입력값 변경
  const handleChange = (e) => {
    const { name, value } = e.target;

    setDetail((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // 수정 저장
  const handleSave = () => {
    if (!detail) return;

    updateProject(detail);

    alert("프로젝트 정보가 수정되었습니다.");
  };

  // 프로젝트 삭제
  const handleDelete = () => {
    if (!detail) return;

    const confirmDelete = window.confirm(
      "정말 이 프로젝트를 삭제하시겠습니까?"
    );

    if (confirmDelete) {
      deleteProject(detail.id);

      setSelectedId("");
      setDetail(null);

      alert("프로젝트가 삭제되었습니다.");
    }
  };

  return (
    <div className="project-detail-page">
      <h2>프로젝트 상세사항 관리</h2>

      {/* 프로젝트 선택 */}
      <div className="project-select-box">
        <label>프로젝트 선택</label>

        <select
          value={selectedId}
          onChange={handleSelectProject}
        >
          <option value="">프로젝트를 선택하세요</option>

          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
            >
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {/* 선택한 프로젝트 상세정보 */}
      {detail && (
        <div className="detail-container">

          <div className="detail-header">
            <h3>{detail.name}</h3>

            <span className={`status ${detail.status}`}>
              {detail.status}
            </span>
          </div>

          <div className="detail-form">

            <div className="form-group">
              <label>프로젝트명</label>

              <input
                type="text"
                name="name"
                value={detail.name || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>진행 상태</label>

              <select
                name="status"
                value={detail.status || ""}
                onChange={handleChange}
              >
                <option value="제작중">제작중</option>
                <option value="검수대기">검수대기</option>
                <option value="포장중">포장중</option>
                <option value="등록완료">등록완료</option>
              </select>
            </div>

            <div className="form-group">
              <label>시작일</label>

              <input
                type="date"
                name="startDate"
                value={detail.startDate || ""}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>마감일</label>

              <input
                type="date"
                name="endDate"
                value={detail.endDate || ""}
                onChange={handleChange}
              />
            </div>

          </div>

          <div className="button-box">
            <button
              className="save-button"
              onClick={handleSave}
            >
              수정 저장
            </button>

            <button
              className="delete-button"
              onClick={handleDelete}
            >
              프로젝트 삭제
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default ProjectDetailPage;