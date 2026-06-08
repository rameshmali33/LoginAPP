import API from "../services/api";

const useLeave = () => {
  const getLeaveTypes = async () => {
    const res = await API.get("/leaves/types");
    return res.data;
  };

  const getLeaveBalances = async () => {
    const res = await API.get("/leaves/balances");
    return res.data;
  };

  const applyLeave = async (leaveData) => {
    const res = await API.post("/leaves/apply", leaveData);
    return res.data;
  };

  const getLeaveHistory = async () => {
    const res = await API.get("/leaves/history");
    return res.data;
  };

  const getPendingForManager = async () => {
    const res = await API.get("/leaves/pending-manager");
    return res.data;
  };

  const reviewByManager = async (id, status, remarks) => {
    const res = await API.put(`/leaves/review-manager/${id}`, { status, remarks });
    return res.data;
  };

  const getPendingForHR = async () => {
    const res = await API.get("/leaves/pending-hr");
    return res.data;
  };

  const reviewByHR = async (id, status, remarks) => {
    const res = await API.put(`/leaves/review-hr/${id}`, { status, remarks });
    return res.data;
  };

  const getLeaveReports = async () => {
    const res = await API.get("/leaves/reports");
    return res.data;
  };

  return {
    getLeaveTypes,
    getLeaveBalances,
    applyLeave,
    getLeaveHistory,
    getPendingForManager,
    reviewByManager,
    getPendingForHR,
    reviewByHR,
    getLeaveReports,
  };
};

export default useLeave;
