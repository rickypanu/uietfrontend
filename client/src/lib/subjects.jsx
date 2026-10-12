import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "./api";

const SubjectsContext = createContext(null);

/** Curriculum comes from the server (GET /subjects) so there is a single source of truth. */
export function SubjectsProvider({ children }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    api.get("/subjects").then((res) => setData(res.data)).catch(() => setError(true));
  }, []);

  useEffect(() => { load(); }, [load]);

  const value = useMemo(() => {
    const courses = data ? Object.keys(data) : [];
    return {
      ready: Boolean(data),
      error,
      reload: load,
      courses,
      branches: (course) => Object.keys(data?.[String(course).toUpperCase()] || {}),
      semesters: (course, branch) => Object.keys(data?.[String(course).toUpperCase()]?.[String(branch).toUpperCase()] || {}).map(Number),
      subjectsFor: (course, branch, semester) =>
        data?.[String(course).toUpperCase()]?.[String(branch).toUpperCase()]?.[String(semester)] || [],
    };
  }, [data, error, load]);

  return <SubjectsContext.Provider value={value}>{children}</SubjectsContext.Provider>;
}

export function useSubjects() {
  const ctx = useContext(SubjectsContext);
  if (!ctx) throw new Error("useSubjects must be used inside <SubjectsProvider>");
  return ctx;
}

export const COURSE_LABELS = { BE: "Bachelor of Engineering (B.E.)", ME: "Master of Engineering (M.E.)" };
export const BRANCH_LABELS = {
  CSE: "Computer Science & Engineering", IT: "Information Technology", ECE: "Electronics & Communication",
  EEE: "Electrical & Electronics", MECH: "Mechanical Engineering", BIOTECH: "Biotechnology",
};
