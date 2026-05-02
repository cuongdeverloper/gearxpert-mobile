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
/**
 * Lấy danh sách đơn thuê của tôi
 */
export const ApiGetMyRentals = async () => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/rentals/my-rentals`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Hủy đơn thuê
 */
export const ApiCancelRental = async (rentalId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/rentals/${rentalId}/cancel`, {}, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Xác nhận đã nhận hàng
 */
export const ApiConfirmReceived = async (rentalId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/rentals/${rentalId}/confirm`, {}, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};
/**
 * Thanh toán lại đơn thuê
 */
export const ApiRepaySingleRental = async (rentalId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/rentals/${rentalId}/singlerepay`, {}, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Kiểm tra xem đã review đơn thuê chưa
 */
export const ApiHasReviewedRental = async (rentalId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/rentals/${rentalId}/has-reviewed`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Gửi đánh giá đơn thuê
 */
export const ApiSubmitReview = async (rentalId: string, data: any) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/rentals/${rentalId}/review`, data, {
      ...config,
      headers: { 
        ...config.headers,
        "Content-Type": "multipart/form-data" 
      }
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Gia hạn đơn thuê
 */
export const ApiExtendRental = async (rentalId: string, data: any) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/rentals/${rentalId}/extend`, data, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};
