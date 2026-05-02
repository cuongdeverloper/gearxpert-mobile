import axios from 'axios';
import { BASE_URL } from '../auth/api';
import { getToken } from '../../shared/utils/storage';

export const getAuthHeaders = async () => {
  const token = await getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const ApiGetMyWallet = async () => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/wallets/me`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiTopUpWallet = async (amount: number) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/wallets/topup`, { amount }, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiGetTransactions = async () => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/wallets/transactions`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiRequestWithdraw = async (data: { amount: number; bankName: string; bankAccountName: string; bankAccountNumber: string }) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/wallets/withdraw`, data, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiGetWithdrawRequests = async () => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/wallets/withdraw-requests`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};
