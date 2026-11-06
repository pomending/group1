import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import { compareSchedules, dateKey, expandSchedules, getScheduleTime } from "../5_schedule/scheduleData";
import { loadSchedules } from "../5_schedule/scheduleStorage";
import { createProjectMilestones } from "../5_schedule/ScheduleProjectBridge";
import { useScheduleHolidays } from "../5_schedule/scheduleHooks";
import "./Today.css";

// 일정 관리에서 저장한 데이터를 읽습니다. 이 화면에서는 수정하지 않습니다.
function getSavedSchedules() {
    const result = loadSchedules();
    return result.readError ? [] : result.items;
}

function DashboardToday() {
    const { projects } = useERP();
    const [now, setNow] = useState(() => new Date());

    // 날짜가 바뀌거나 다른 탭에서 일정을 고치면 화면을 다시 계산합니다.
    useEffect(() => {
        const refresh = () => setNow(new Date());
        const checkStorage = event => {
            if (event.key === "made-mate-schedules" || event.key === null) refresh();
        };
        const checkVisible = () => {
            if (!document.hidden) refresh();
        };

        window.addEventListener("focus", refresh);
        window.addEventListener("storage", checkStorage);
        document.addEventListener("visibilitychange", checkVisible);
        const timer = setInterval(refresh, 60000);

        return () => {
            window.removeEventListener("focus", refresh);
            window.removeEventListener("storage", checkStorage);
            document.removeEventListener("visibilitychange", checkVisible);
            clearInterval(timer);
        };
    }, []);

    const year = now.getFullYear();
    const month = now.getMonth();
    const today = dateKey(now);
    const firstDate = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0);
    const firstDay = dateKey(firstDate);
    const lastDay = dateKey(lastDate);

    // 이번 달에 해당하는 일정과 프로젝트 시작·마감일을 함께 표시합니다.
    const holidayInfo = useScheduleHolidays(year);
    const holidays = holidayInfo.year === year ? holidayInfo.dates : {};
    const monthlySchedules = expandSchedules(getSavedSchedules(), firstDay, lastDay, holidays);
    const projectSchedules = createProjectMilestones(Array.isArray(projects) ? projects : [])
        .filter(item => item.date >= firstDay && item.date <= lastDay);
    const schedules = [...monthlySchedules, ...projectSchedules].sort(compareSchedules);
    const todaySchedules = schedules.filter(item => item.date === today);

    // 날짜별 일정을 묶어 달력에 표시할 항목을 찾습니다.
    const scheduleByDate = {};
    for (const item of schedules) {
        if (!scheduleByDate[item.date]) scheduleByDate[item.date] = [];
        scheduleByDate[item.date].push(item);
    }

    // 달력 첫째 주의 빈칸을 채우고 1일부터 말일까지 날짜를 추가합니다.
    const days = [];
    for (let i = 0; i < firstDate.getDay(); i++) days.push(null);
    for (let day = 1; day <= lastDate.getDate(); day++) days.push(day);

    return (
        <div className="today-box">
            <div className="today-month">{year}년 {month + 1}월</div>

            <div className="today-weekdays">
                {["일", "월", "화", "수", "목", "금", "토"].map(name => (
                    <span key={name}>{name}</span>
                ))}
            </div>

            {/* 이번 달 달력 */}
            <div className="today-days">
                {days.map((day, index) => {
                    if (day === null) {
                        return <div className="today-blank" key={`blank-${index}`} />;
                    }

                    const currentDate = dateKey(new Date(year, month, day));
                    const daySchedules = scheduleByDate[currentDate] || [];
                    const firstSchedule = daySchedules.find(item => !item.isProjectMilestone)
                        || daySchedules[0];
                    const label = firstSchedule
                        ? (firstSchedule.project || firstSchedule.title)
                        : "";

                    return (
                        <div
                            key={currentDate}
                            className={currentDate === today ? "today-day today-current" : "today-day"}>
                            <span className="today-date">{day}</span>
                            {firstSchedule && (
                                <span className="today-project" title={label}>
                                    {label}
                                </span>
                            )}
                            {daySchedules.length > 1 && (
                                <span className="today-more">+{daySchedules.length - 1}건</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* 오늘 등록된 일정 목록 */}
            <div className="today-title">오늘 등록된 일정 ({todaySchedules.length})</div>
            {todaySchedules.length === 0 ? (
                <p className="today-empty">오늘 등록된 일정이 없습니다.</p>
            ) : (
                <div className="today-list">
                    {todaySchedules.map((item, index) => (
                        <Link
                            to="/schedule"
                            className="today-item"
                            key={`${item.id}-${item.date}-${index}`}>
                            <span className="today-time">{getScheduleTime(item)}</span>
                            {item.project && !item.isProjectMilestone && (
                                <span className="today-name">{item.project}</span>
                            )}
                            <span className="today-detail">{item.title}</span>
                            {item.status === "completed" && (
                                <span className="today-done">완료</span>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DashboardToday;
