import React, { useState, useEffect } from "react";

export default function DonutChart({ percentage, status }) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    const animation = requestAnimationFrame(() =>
      setAnimatedPercentage(percentage)
    );
    return () => cancelAnimationFrame(animation);
  }, [percentage]);

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  return (
    <svg className="donut-chart" viewBox="0 0 100 100">
      <circle className="donut-chart-bg" cx="50" cy="50" r="45" />
      <circle
        className={`donut-chart-fg ${status}`}
        cx="50"
        cy="50"
        r="45"
        strokeDasharray={circumference}
        strokeDashoffset={Math.max(0, offset)}
      />
    </svg>
  );
}
