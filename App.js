import React, { useState, useEffect } from "react";
import "./styles.css";
import { useLocalStorage } from "./useLocalStorage";
import AbsenceCalculator from "./AbsenceCalculator";
import CourseList from "./CourseList";
import { FaTelegramPlane } from "react-icons/fa";

export default function App() {
  const [courses, setCourses] = useLocalStorage("courses", []);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleAddOrUpdateCourse = (course) => {
    const existingIndex = courses.findIndex((c) => c.id === course.id);

    if (existingIndex > -1) {
      const updatedCourses = [...courses];
      updatedCourses[existingIndex] = course;
      setCourses(updatedCourses);
    } else {
      setCourses([...courses, course]);
    }
    setSelectedCourse(null);
  };

  const handleDeleteCourse = (courseId) => {
    setCourses(courses.filter((c) => c.id !== courseId));
    if (selectedCourse && selectedCourse.id === courseId) {
      setSelectedCourse(null);
    }
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearForm = () => {
    setSelectedCourse(null);
  };

  return (
    <div className={`app ${isInitialLoad ? "loading" : "loaded"}`}>
      <div className="aurora-bg">
        <div className="aurora-dot aurora-dot-1"></div>
        <div className="aurora-dot aurora-dot-2"></div>
      </div>

      <div className="container">
        <header className="header">
          <h1 className="title">حاسبة الغياب </h1>
          <p className="subtitle">راقب غيابك بأسلوب لم تره من قبل</p>
        </header>

        <AbsenceCalculator
          key={selectedCourse ? selectedCourse.id : "new"}
          onSave={handleAddOrUpdateCourse}
          selectedCourse={selectedCourse}
          onClear={handleClearForm}
        />

        {courses.length > 0 && (
          <CourseList
            courses={courses}
            onSelect={handleSelectCourse}
            onDelete={handleDeleteCourse}
          />
        )}

        <footer className="footer">
          <span>© 2025 | تصميم وتطوير ظلام</span>
          <a
            href="https://t.me/zalam_0"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaTelegramPlane />
          </a>
        </footer>
      </div>
    </div>
  );
}
