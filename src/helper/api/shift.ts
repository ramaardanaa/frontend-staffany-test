import { getAxiosInstance } from ".";

export const getShifts = async (weekId: Date, page: number, limit: number) => {
  const api = getAxiosInstance()
  const skip = (page - 1) * limit
  const { data } = await api.get(`/shifts?weekId=${weekId}&take=${limit}&skip=${skip}`);
  return data;
};

export const getShiftById = async (id: string) => {
  const api = getAxiosInstance()
  const { data } = await api.get(`/shifts/${id}`);
  return data;
};

export const createShifts = async (payload: any) => {
  const api = getAxiosInstance()
  const { data } = await api.post("/shifts", payload);
  return data;
};

export const updateShiftById = async (id: string, payload: any) => {
  const api = getAxiosInstance()
  const { data } = await api.patch(`/shifts/${id}`, payload);
  return data;
};

export const deleteShiftById = async (id: string) => {
  const api = getAxiosInstance()
  const { data } = await api.delete(`/shifts/${id}`);
  return data;
};

export const publishShift = async (payload: any) => {
  const api = getAxiosInstance()
  const { data } = await api.patch(`/shifts`, payload);
  return data;
};