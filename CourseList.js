import React from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

const DENIAL_PERCENTAGE = 0.25;
const SEMESTER_WEEKS = 17;

export default function CourseList({ courses, onSelect, onDelete }) {
  return (
    <div className="course-list-card">
      <h2>المواد المحفوظة</h2>
      <div className="course-list">
        {courses.map((course) => {
          const total = SEMESTER_WEEKS * course.lectureHours;
          const denial = Math.floor(total * DENIAL_PERCENTAGE) + 1;

          let effectiveAbsenceHours = course.absenceHours;
          const basePercentage =
            total > 0 ? (course.absenceHours / total) * 100 : 0;
          if (course.isEngineering && basePercentage <= 5) {
            effectiveAbsenceHours = Math.max(0, course.absenceHours - 2);
          }

          const percentage =
            total > 0 ? (effectiveAbsenceHours / total) * 100 : 0;
          const isDenied = effectiveAbsenceHours >= denial;

          return (
            <div
              key={course.id}
              className={`course-item ${isDenied ? "denied" : ""}`}
            >
              <div className="course-info">
                <h3>{course.name}</h3>
                <p>
                  الغياب: {course.absenceHours} / {denial - 1} ساعة
                  {course.isEngineering && " (هندسة)"}
                </p>
              </div>
              <div className="course-progress">
                <div
                  className="course-progress-bar"
                  style={{
                    width: `${Math.min(100, (percentage / 25) * 100)}%`,
                  }}
                ></div>
              </div>
              <div className="course-actions">
                <button onClick={() => onSelect(course)} title="تعديل">
                  <FiEdit2 />
                </button>
                <button onClick={() => onDelete(course.id)} title="حذف">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
