import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TaskPage.css";
import { useERP } from "../context/ERPContext";
import { getAvailableEmployees, TASK_TYPES } from "../utils/taskUtils";

function TaskDetail() {
    const navigate = useNavigate();

    const { projects,
        customers,
        employees,
        quotations,
        products,
        tasks,
        addTask,
        updateTask,
        deleteTask } = useERP();


    // 선택한 프로젝트 번호
    const [selectedProjectId, setSelectedProjectId] = useState("");

    // 선택한 프로젝트 찾기
    const selectedProject = projects.find(
        (project) => project.id === Number(selectedProjectId)
    );

    // 프로젝트와 연결된 정보 찾기
    const selectedCustomer = customers.find(
        (customer) => customer.id === selectedProject?.customerId
    );

    const selectedManager = employees.find(
        (employee) => employee.id === selectedProject?.managerId
    );

    const selectedQuotation = quotations.find(
        (quotation) => quotation.id === selectedProject?.quotationId
    );

    const selectedProduct = products.find(
        (product) => product.id === selectedQuotation?.productId
    );

    const selectedTasks = tasks.filter(
        (task) => task.projectId === Number(selectedProjectId)
    )

    //작업 진행상태
    const [taskType, setTaskType] = useState("");

    //담당자
    const [employeeId, setEmployeeId] = useState("");

    //작업마감일
    const [taskDeadline, setTaskDeadline] = useState("");

    // 진행 상태
    const [progress, setProgress] = useState("대기중");

    // 수정 중인 작업 ID
    const [editingTaskId, setEditingTaskId] = useState(null);

    // 수정 팝업 열림/닫힘
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const availableEmployees = getAvailableEmployees(employees, taskType)

    const closeModal = () => {
        setIsEditModalOpen(false)
        resetTaskForm()
    }

    const resetTaskForm = () => {
        setEditingTaskId(null);
        setTaskType("");
        setEmployeeId("");
        setTaskDeadline("");
        setProgress("대기중");
    };

    const editingTask = tasks.find(t => t.id === editingTaskId)

    const pastEmployee = employees.find(e => e.id === editingTask?.employeeId)

    const keepPastEmployee =
        editingTask?.progress === "완료" &&
        progress === "완료" &&
        pastEmployee &&
        editingTask.taskType === taskType &&
        Number(editingTask.projectId) === Number(selectedProjectId) &&
        !availableEmployees.some(e => e.id === pastEmployee.id);

    // 작업 등록 및 수정 함수
    const handleSubmit = () => {

        const taskData = {
            projectId: Number(selectedProjectId),
            taskType,
            employeeId: Number(employeeId),
            taskDeadline,
            progress
        };

        const result = editingTaskId !== null
            ? updateTask({ id: editingTaskId, ...taskData })
            : addTask({ ...taskData, progress: "대기중" });

        if (!result.ok) {
            alert(result.message);
            return;
        }

        alert(editingTaskId !== null
            ? "작업이 수정되었습니다."
            : "작업이 저장되었습니다.");

        closeModal();
    };


    // 작업 삭제 함수
    const handleDeleteTask = (taskId) => {

        if (!window.confirm("작업을 삭제하시겠습니까?")) {
            return;
        }

        const result = deleteTask(taskId);

        if (!result.ok) {
            alert(result.message);
            return;
        }

        alert("작업이 삭제되었습니다.");

    };

    // 작업 수정 팝업 열기
    const handleUpdateTask = (taskId) => {

        // 수정할 작업 찾기
        const targetTask = tasks.find(
            (item) => item.id === taskId
        );

        if (!targetTask) return;

        // 기존 작업 정보 불러오기
        setTaskType(targetTask.taskType);
        setEmployeeId(String(targetTask.employeeId));
        setTaskDeadline(targetTask.taskDeadline);
        setProgress(targetTask.progress || "대기중");

        // 수정할 작업 ID 저장
        setEditingTaskId(taskId);

        // 팝업 열기
        setIsEditModalOpen(true);
    };

    return (
        <div className="task-detail-page">

            {/* 상단 제목 */}
            <div className="td-header">
                <div>
                    <p className="td-eyebrow">
                        PROJECT MANAGEMENT / DETAIL
                    </p>
                    <h2>프로젝트 상세 관리</h2>
                    <p>등록된 프로젝트를 선택하여 상세정보를 확인합니다.</p>
                </div>

                <button
                    className="td-back-btn"
                    onClick={() => navigate("/tasks")}
                >
                    ← 작업 목록으로
                </button>
            </div>

            {/* 프로젝트 선택 */}
            <div className="td-select-box">
                <label htmlFor="projectSelect">프로젝트 선택</label>

                <select
                    id="projectSelect"
                    value={selectedProjectId}
                    onChange={(e) => {
                        setSelectedProjectId(e.target.value);
                        resetTaskForm();
                    }}
                >
                    <option value="">프로젝트를 선택하세요</option>

                    {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                            {project.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* 프로젝트 선택 전 */}
            {!selectedProject && (
                <div className="td-empty">
                    <h3>프로젝트를 선택해 주세요.</h3>
                    <p>선택한 프로젝트의 상세정보가 여기에 표시됩니다.</p>
                </div>
            )}

            {/* 프로젝트 선택 후 게시판 */}
            {selectedProject && (
                <div className="td-board">

                    <div className="td-board-header">
                        <div>
                            <span>PROJECT #{selectedProject.id}</span>
                            <h3>{selectedProject.name}</h3>
                        </div>

                        <span className={`td-status ${selectedProject.status === "진행 중"
                            ? "status-progress"
                            : "status-waiting"
                            }`}>
                            {selectedProject.status}
                        </span>
                    </div>

                    <div className="td-board-content">
                        <h4>프로젝트 기본 정보</h4>

                        <table className="td-table">
                            <tbody>
                                <tr>
                                    <th>프로젝트명</th>
                                    <td>{selectedProject.name}</td>
                                    <th>프로젝트 번호</th>
                                    <td>{selectedProject.id}</td>
                                </tr>

                                <tr>
                                    <th>고객사</th>
                                    <td>{selectedCustomer?.companyName || "-"}</td>
                                    <th>담당자</th>
                                    <td>{selectedManager?.name || "-"}</td>
                                </tr>

                                <tr>
                                    <th>제품명</th>
                                    <td>{selectedProduct?.productName || "-"}</td>
                                    <th>프로젝트 상태</th>
                                    <td>{selectedProject.status}</td>
                                </tr>

                                <tr>
                                    <th>시작일</th>
                                    <td>{selectedProject.startDate || "-"}</td>
                                    <th>완료 예정일</th>
                                    <td>{selectedProject.dueDate || "-"}</td>
                                </tr>

                                <tr>
                                    <th>완료일</th>
                                    <td>{selectedProject.completedDate || "-"}</td>
                                    <th>견적 번호</th>
                                    <td>{selectedProject.quotationId}</td>
                                </tr>

                                <tr>
                                    <th>프로젝트 설명</th>
                                    <td colSpan="3">
                                        {selectedProject.description || "-"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>


                    <div className="td-board-content">
                        <h4>프로젝트 상세 정보</h4>
                        <div className="project-detail">

                            {/* 작업 진행상태 */}
                            <div>
                                <p>작업 진행상태</p>
                                <select value={taskType}
                                    onChange={(e) => {
                                        setTaskType(e.target.value)
                                        setEmployeeId("");
                                    }}>
                                    <option value="">작업을 선택해주세요.</option>
                                    {TASK_TYPES.map(task => (
                                        <option key={task} value={task}>{task}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 담당자 */}
                            <div>
                                <p>담당자</p>
                                <select
                                    value={employeeId}
                                    onChange={(e) => {
                                        setEmployeeId(e.target.value);
                                    }}
                                >
                                    <option value="">담당자를 선택하세요</option>
                                    {keepPastEmployee && (
                                        <option key={pastEmployee.id} value={pastEmployee.id}>{pastEmployee.name} ({pastEmployee.status} · 기존 담당자)</option>
                                    )}
                                    {availableEmployees.map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 작업 마감일 */}
                            <div>
                                <p>작업 마감일</p>
                                <input type="date" value={taskDeadline}
                                    onChange={(e) => setTaskDeadline(e.target.value)} />
                            </div>
                        </div>
                        <button className="save-btn" onClick={handleSubmit}>저장</button>



                        {/* 작업 목록: 저장 후 표시 */}
                        {selectedTasks.length > 0
                            && (

                                <div className="td-task-list">

                                    <div className="td-task-list-header">
                                        <h4>등록된 작업 목록</h4>
                                        <span>
                                            총 {
                                                selectedTasks.length
                                            } 건
                                        </span>
                                    </div>

                                    <table className="td-task-table">

                                        <thead>
                                            <tr>
                                                <th>번호</th>
                                                <th>작업 단계</th>
                                                <th>담당자</th>
                                                <th>작업 마감일</th>
                                                <th>진행 상태</th>
                                                <th>관리</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {selectedTasks.map((task) => {

                                                // 작업에 등록된 담당자 찾기
                                                const employee = employees.find(
                                                    (emp) => Number(emp.id) === Number(task.employeeId)
                                                );

                                                return (
                                                    <tr key={task.id}>
                                                        <td>{task.id}</td>

                                                        <td>{task.taskType}</td>

                                                        {/* 담당자 이름만 표시 */}
                                                        <td>{employee?.name || "-"}</td>

                                                        <td>{task.taskDeadline}</td>

                                                        <td>
                                                            <span className="td-task-status">
                                                                {task.progress}
                                                            </span>
                                                        </td>

                                                        <td>
                                                            <button
                                                                className="td-modify-btn"
                                                                onClick={() => handleUpdateTask(task.id)}
                                                            >
                                                                수정
                                                            </button>

                                                            <button
                                                                className="td-delete-btn"
                                                                onClick={() => handleDeleteTask(task.id)}
                                                            >
                                                                삭제
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>

                                    </table>

                                </div>

                            )}

                    </div>

                </div>
            )}

            {/* 작업 수정 팝업 */}
            {isEditModalOpen && (
                <div className="td-modal-overlay">

                    <div className="td-edit-modal">

                        {/* 팝업 제목 */}
                        <div className="td-modal-header">
                            <h3>작업 수정</h3>

                            <button
                                className="td-modal-close"
                                onClick={closeModal}
                            >
                                ×
                            </button>
                        </div>

                        {/* 수정 입력 영역 */}
                        <div className="td-modal-body">



                            <div className="td-modal-field">
                                <label>담당자</label>

                                <select
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                >
                                    <option value="">담당자를 선택하세요.</option>

                                    {availableEmployees.map((employee) => (
                                        <option
                                            key={employee.id}
                                            value={employee.id}
                                        >
                                            {employee.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="td-modal-field">
                                <label>작업 마감일</label>

                                <input
                                    type="date"
                                    value={taskDeadline}
                                    onChange={(e) => setTaskDeadline(e.target.value)}
                                />
                            </div>

                            <div className="td-modal-field">
                                <label>진행 상태</label>

                                <select
                                    value={progress}
                                    onChange={(e) => setProgress(e.target.value)}
                                >
                                    <option value="대기중">대기중</option>
                                    <option value="작업중">작업중</option>
                                    <option value="완료">완료</option>
                                </select>
                            </div>

                        </div>

                        {/* 팝업 하단 버튼 */}
                        <div className="td-modal-footer">

                            <button
                                className="td-modal-cancel"
                                onClick={closeModal}
                            >
                                취소
                            </button>

                            <button
                                className="td-modal-save"
                                onClick={handleSubmit}
                            >
                                수정 저장
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>

    );
}

export default TaskDetail;