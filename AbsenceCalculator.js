import React, { useState, useMemo, useEffect } from "react";
import { FiPlus, FiEdit } from "react-icons/fi";
import { FaShieldAlt } from "react-icons/fa";
import DonutChart from "./DonutChart";

const SEMESTER_WEEKS = 17;
const DENIAL_PERCENTAGE = 0.25;

const formatHoursText = (hours) => {
  if (hours < 0) hours = 0;
  if (hours === 1) return "ساعة";
  if (hours === 2) return "ساعتين";
  if (hours >= 3 && hours <= 10) return `${hours} ساعات`;
  return `${hours} ساعة`;
};

export default function AbsenceCalculator({ onSave, selectedCourse, onClear }) {
  const [courseName, setCourseName] = useState("");
  const [lectureHours, setLectureHours] = useState(3);
  const [absenceHours, setAbsenceHours] = useState("");
  const [isEngineering, setIsEngineering] = useState(false);

  useEffect(() => {
    if (selectedCourse) {
      setCourseName(selectedCourse.name);
      setLectureHours(selectedCourse.lectureHours);
      setAbsenceHours(selectedCourse.absenceHours);
      setIsEngineering(selectedCourse.isEngineering || false);
    } else {
      setCourseName("");
      setLectureHours(3);
      setAbsenceHours("");
      setIsEngineering(false);
    }
  }, [selectedCourse]);

  const result = useMemo(() => {
    const absenceNum = parseInt(absenceHours, 10) || 0;
    if (absenceNum < 0) return null;

    const total = SEMESTER_WEEKS * lectureHours;
    const allowed = Math.floor(total * DENIAL_PERCENTAGE);
    const denial = allowed + 1;

    const basePercentage = total > 0 ? (absenceNum / total) * 100 : 0;
    const bonusIsActive = isEngineering && basePercentage <= 5;

    let effectiveAbsenceHours = absenceNum;
    if (bonusIsActive && absenceNum > 0) {
      effectiveAbsenceHours = Math.max(0, absenceNum - 2);
    }

    const percentageForDisplay = basePercentage;
    const isDenied = effectiveAbsenceHours >= denial;
    const isWarning = effectiveAbsenceHours >= allowed && !isDenied;

    let status = "safe";
    if (isDenied) status = "danger";
    else if (isWarning) status = "warning";

    const remainingUntilDenial = denial - absenceNum;
    let predictiveText = "";
    if (absenceNum >= denial) {
      predictiveText = "لقد تجاوزت الحد المسموح به للغياب.";
    } else if (remainingUntilDenial === 1) {
      predictiveText = "تحذير: غياب ساعة واحدة يؤدي إلى الحرمان!";
    } else if (remainingUntilDenial > 1) {
      predictiveText = `أنت على بعد ${formatHoursText(
        remainingUntilDenial
      )} من الحرمان.`;
    } else {
      predictiveText = "أنت في منطقة الأمان.";
    }

    let bonusTitle = "";
    let bonusSubtitle = "";
    if (bonusIsActive) {
      bonusTitle = " البونص  نشط";
      const maxHoursForBonus = Math.floor(total * 0.05);
      const hoursUntilLoss = maxHoursForBonus + 1 - absenceNum;

      if (hoursUntilLoss > 1) {
        bonusSubtitle = `ستفقده بعد غياب ${formatHoursText(hoursUntilLoss)}.`;
      } else {
        bonusSubtitle = "ستفقده عند الغياب القادم!";
      }
    }

    return {
      total,
      allowed,
      denial,
      percentage: percentageForDisplay,
      status,
      predictiveText,
      bonusTitle,
      bonusSubtitle,
    };
  }, [lectureHours, absenceHours, isEngineering]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!courseName) {
      alert("الرجاء إدخال اسم المادة.");
      return;
    }
    onSave({
      id: selectedCourse ? selectedCourse.id : Date.now(),
      name: courseName,
      lectureHours,
      absenceHours: parseInt(absenceHours, 10) || 0,
      isEngineering,
    });
  };

  return (
    <form
      className={`calculator-card ${result?.status}`}
      onSubmit={handleSubmit}
    >
      <div className="card-header">
        <h2>{selectedCourse ? "تعديل المادة" : "إضافة مادة جديدة"}</h2>
        {selectedCourse && (
          <button
            type="button"
            className="clear-button"
            onClick={onClear}
            title="العودة لوضع الإضافة"
          >
            <FiPlus />
          </button>
        )}
      </div>

      <div className="input-grid">
        <div className="input-group">
          <label>اسم المادة</label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="مثال: فيزياء 101"
            required
          />
        </div>
        <div className="input-group">
          <label>الساعات الأسبوعية</label>
          <div className="select-wrapper">
            <select
              value={lectureHours}
              onChange={(e) => setLectureHours(Number(e.target.value))}
            >
              {[...Array(12).keys()].map((n) => (
                <option key={n + 1} value={n + 1}>
                  {formatHoursText(n + 1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="input-group">
          <label>ساعات الغياب</label>
          <input
            type="number"
            value={absenceHours}
            onChange={(e) => setAbsenceHours(String(Number(e.target.value)))}
            placeholder="0"
            min="0"
          />
        </div>
      </div>

      <div className="bonus-toggle-container">
        <label className="toggle-label-wrapper">
          <input
            type="checkbox"
            checked={isEngineering}
            onChange={(e) => setIsEngineering(e.target.checked)}
          />
          <span className="toggle-switch"></span>
          <span className="toggle-text">مادة من كلية الهندسة</span>
        </label>
      </div>

      {result && absenceHours !== "" && (
        <div className="result-section">
          <div className="chart-container">
            <DonutChart percentage={result.percentage} status={result.status} />
            <div className="chart-info">
              <span>{Math.min(result.percentage, 100).toFixed(1)}%</span>
              <p>نسبة الغياب</p>
            </div>
          </div>
          <div className="result-details">
            <div className="detail-item">
              <span>الغياب المسموح</span>
              <strong>{formatHoursText(result.allowed)}</strong>
            </div>
            <div className="detail-item">
              <span>بداية الحرمان</span>
              <strong>{formatHoursText(result.denial)}</strong>
            </div>
            <p className="predictive-text">{result.predictiveText}</p>
            {result.bonusTitle && (
              <div className="bonus-box">
                <FaShieldAlt className="bonus-icon" />
                <div className="bonus-text-content">
                  <p className="bonus-title">{result.bonusTitle}</p>
                  <p className="bonus-subtitle">{result.bonusSubtitle}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button type="submit" className="save-button">
        {selectedCourse ? (
          <>
            <FiEdit /> تحديث المادة
          </>
        ) : (
          <>
            <FiPlus /> إضافة المادة
          </>
        )}
      </button>
    </form>
  );
}
