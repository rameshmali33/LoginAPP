import { useCallback, useMemo } from "react";
import API from "../services/api";

const useLeave = () => {
  const getLeaveTypes = useCallback(async () => {
    const res = await API.get("/leaves/types");
    return res.data;
  }, []);

  const getLeaveBalances = useCallback(async () => {
    const res = await API.get("/leaves/balances");
    return res.data;
  }, []);

  const applyLeave = useCallback(async (leaveData) => {
    const res = await API.post("/leaves/apply", leaveData);
    return res.data;
  }, []);

  const getLeaveHistory = useCallback(async () => {
    const res = await API.get("/leaves/history");
    return res.data;
  }, []);

  const getPendingForManager = useCallback(async () => {
    const res = await API.get("/leaves/pending-manager");
    return res.data;
  }, []);

  const reviewByManager = useCallback(async (id, status, remarks) => {
    const res = await API.put(`/leaves/review-manager/${id}`, { status, remarks });
    return res.data;
  }, []);

  const getPendingForHR = useCallback(async () => {
    const res = await API.get("/leaves/pending-hr");
    return res.data;
  }, []);

  const reviewByHR = useCallback(async (id, status, remarks) => {
    const res = await API.put(`/leaves/review-hr/${id}`, { status, remarks });
    return res.data;
  }, []);

  const getLeaveReports = useCallback(async () => {
    const res = await API.get("/leaves/reports");
    return res.data;
  }, []);

  return useMemo(
    () => ({
      getLeaveTypes,
      getLeaveBalances,
      applyLeave,
      getLeaveHistory,
      getPendingForManager,
      reviewByManager,
      getPendingForHR,
      reviewByHR,
      getLeaveReports,
    }),
    [
      getLeaveTypes,
      getLeaveBalances,
      applyLeave,
      getLeaveHistory,
      getPendingForManager,
      reviewByManager,
      getPendingForHR,
      reviewByHR,
      getLeaveReports,
    ]
  );
};

export default useLeave;
