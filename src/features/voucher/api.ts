import axios from 'axios';
import { BASE_URL } from '../auth/api';
import { getAuthHeaders } from '../wallet/api';

export const ApiGetVouchers = async () => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/vouchers`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiValidateVoucher = async (data: any) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/vouchers/apply`, data, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};

export const ApiGetAvailableVouchersForCart = async (cartType = "RENTAL") => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/vouchers/available-for-cart?cartType=${cartType}`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};

export const ApiAutoApplyBestVoucher = async (cartType = "RENTAL") => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/vouchers/auto-apply`, { cartType }, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};
