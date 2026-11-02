import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useERP } from "../context/ERPContext";
import {
    compareSchedules,
    dateKey,
    expandSchedules,
    getScheduleTime
} from "../5_schedule/scheduleData";
import { loadSchedules } from "../5_schedule/scheduleStorage";
import { createProjectMilestones } from "../5_schedule/ScheduleProjectBridge";
import { useScheduleHolidays } from "../5_schedule/scheduleHooks";
import "./Today.css";

// 일정 관리 연동 · 조회 전용
function getSchedules() {
    const result = loadSchedules();
    return result.readError ? [] : result.items;
}

function DashboardToday() {
    // 프로젝트 일정 데이터
    const erp = useERP();
    const projects = Array.isArray(erp?.projects) ? erp.projects : [];

    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        // 날짜·화면 갱신
        const refresh = () => setNow(new Date());
        const onStorage = (event) => {
            if (event.key === "made-mate-schedules" || event.key === null) {
                refresh();
            }
        };
        const onVisible = () => {
            if (!document.hidden) refresh();
        };

        window.addEventListener("focus", refresh);
        window.addEventListener("storage", onStorage);
        document.addEventListener("visibilitychange", onVisible);
        const timer = setInterval(refresh, 60000);

        return () => {
            window.removeEventListener("focus", refresh);
            window.removeEventListener("storage", onStorage);
            document.removeEventListener("visibilitychange", onVisible);
            clearInterval(timer);
        };
    }, []);

    const year = now.getFullYear();
    const month = now.getMonth();
    const today = dateKey(now);
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const firstKey = dateKey(first);
    const lastKey = dateKey(last);

    // 공휴일 규칙
    const holidayInfo = useScheduleHolidays(year);
    const holidays = holidayInfo.year === year ? holidayInfo.dates : {};

    // 월간 일정 계산
    const schedules = getSchedules();
    const monthSchedules = expandSchedules(
        schedules,
        firstKey,
        lastKey,
        holidays
    );

    // 프로젝트 시작·마감일 · 조회 전용
    const projectDates = createProjectMilestones(projects).filter(
        (item) => item.date >= firstKey && item.date <= lastKey
    );

    const visibleSchedules = [...monthSchedules, ...projectDates]
        .sort(compareSchedules);
    const todaySchedules = visibleSchedules.filter(
        (item) => item.date === today
    );

    const scheduleByDate = {};
    for (const item of visibleSchedules) {
        if (!scheduleByDate[item.date]) {
            scheduleByDate[item.date] = [];
        }
        scheduleByDate[item.date].push(item);
    }

    const days = [];
    for (let i = 0; i < first.getDay(); i++) {
        days.push(null);
    }
    for (let number = 1; number <= last.getDate(); number++) {
        days.push(number);
    }

    return (
        <div className="today-box">

            {/* 연도·월 표시 */}
            <div className="today-month">
                {year}년 {month + 1}월
            </div>

            <div className="today-weekdays">
                {["일", "월", "화", "수", "목", "금", "토"].map((name) => (
                    <span key={name}>{name}</span>
                ))}
            </div>

            <div className="today-days">
                {days.map((number, index) => {
                    if (number === null) {
                        return (
                            <div
                                className="today-blank"
                                key={"blank-" + index}
                            />
                        );
                    }

                    const currentDate = dateKey(
                        new Date(year, month, number)
                    );
                    const daySchedules = scheduleByDate[currentDate] || [];

                    // 실제 일정 우선
                    const firstSchedule = daySchedules.find(
                        (item) => !item.isProjectMilestone
                    ) || daySchedules[0];

                    const label = firstSchedule
                        ? (firstSchedule.project || firstSchedule.title)
                        : "";

                    return (
                        <div
                            key={currentDate}
                            className={
                                currentDate === today
                                    ? "today-day today-current"
                                    : "today-day"
                            }
                        >
                            <span className="today-date">{number}</span>

                            {firstSchedule && (
                                <span className="today-project" title={label}>
                                    {label}
                                </span>
                            )}

                            {daySchedules.length > 1 && (
                                <span className="today-more">
                                    +{daySchedules.length - 1}건
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="today-title">
                오늘 등록된 일정 ({todaySchedules.length})
            </div>

            {todaySchedules.length === 0 ? (
                <p className="today-empty">
                    오늘 등록된 일정이 없습니다.
                </p>
            ) : (
                <div className="today-list">
                    {todaySchedules.map((item, index) => (
                        <Link
                            to="/schedule"
                            className="today-item"
                            key={String(item.id) + "-" + item.date + "-" + index}
                        >
                            {/* 일정 시간 */}
                            <span className="today-time">
                                {getScheduleTime(item)}
                            </span>

                            {/* 프로젝트 일정 제목 */}
                            {item.project && !item.isProjectMilestone && (
                                <span className="today-name">
                                    {item.project}
                                </span>
                            )}

                            <span className="today-detail">
                                {item.title}
                            </span>

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
