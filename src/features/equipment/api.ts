import axios from 'axios';

const BASE_URL = 'https://gearxpert-production.up.railway.app/api';

export const ApiGetTrendingDevices = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/devices`, {
      params: { limit: 5, sort: 'popular' }
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    } else {
      console.error("Lỗi Network:", error.message);
      return {
        errorCode: -1,
        message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!",
      };
    }
  }
};

export const ApiGetDevices = async (paramsObj?: any) => {
  try {
    const response = await axios.get(`${BASE_URL}/devices`, {
      params: paramsObj || { limit: 100 }
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return error.response.data;
    } else {
      console.error("Lỗi Network:", error.message);
      return {
        errorCode: -1,
        message: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!",
      };
    }
  }
};

export const ApiGetDeviceDetail = async (id: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/devices/${id}`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};

export const ApiGetDeviceAddons = async (id: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/devices/${id}/addons`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};

export const ApiGetRelatedDevices = async (id: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/devices/${id}/related`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};

export const ApiGetSmartGearSuggestion = async (prompt: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/smartgear/suggest`, { prompt });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};