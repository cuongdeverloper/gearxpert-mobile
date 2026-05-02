import axios from 'axios';
import { BASE_URL } from '../auth/api';
import { getAuthHeaders } from '../wallet/api';

/**
 * Checkout
 */
export const ApiCheckout = async (data: any) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/rentals/checkout`, data, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Lấy chi tiết rental
 */
export const ApiGetRentalById = async (rentalId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/rentals/${rentalId}`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Preview contract with data
 */
export const ApiPreviewContractWithData = async (rentalData: any) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/contracts/preview-data`, rentalData, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Verify payment
 */
export const ApiVerifyPayment = async (rentalId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/rentals/verify-payment`, { rentalId }, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};
