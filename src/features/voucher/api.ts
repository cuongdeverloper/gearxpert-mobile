import axios from 'axios';

const BASE_URL = 'https://gearxpert-production.up.railway.app/api';

export const ApiGetVouchers = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/vouchers`);
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

export const ApiValidateVoucher = async (data: any) => {
  try {
    const response = await axios.post(`${BASE_URL}/vouchers/apply`, data);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};
