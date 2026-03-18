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