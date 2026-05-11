import apiClient from "../utils/axios";

const unwrap = (response) => response?.data?.data;

export const fundApi = {
  async getFunds(params = {}) {
    const response = await apiClient.get("/funds", { params });
    return unwrap(response);
  },

  async getFundDetail(id) {
    const response = await apiClient.get(`/funds/${id}`);
    return unwrap(response);
  },

  async getFundStatuses() {
    const response = await apiClient.get("/fund-statuses");
    return unwrap(response) ?? [];
  },

  async getFundStatistics() {
    const response = await apiClient.get("/funds/statistics");
    return unwrap(response);
  },

  async getActiveFundReceivingInfos() {
    const response = await apiClient.get("/funds/receiving-infos/active");
    return unwrap(response) ?? [];
  },

  async getFundDonationsByFundId(fundId, params = {}) {
    const response = await apiClient.get(`/fund-donations/${fundId}`, { params });
    return unwrap(response);
  },

  async createFundDonation(payload) {
    const response = await apiClient.post("/fund-donations", payload);
    return unwrap(response);
  },

  async createFund(payload) {
    const response = await apiClient.post("/funds", payload);
    return unwrap(response);
  },

  async updateFund(fundId, payload) {
    const response = await apiClient.put(`/funds/${fundId}`, payload);
    return unwrap(response);
  },

  async closeFund(fundId) {
    const response = await apiClient.put(`/funds/${fundId}/close`);
    return unwrap(response);
  },
};
