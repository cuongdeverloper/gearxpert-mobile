import axios from 'axios';
import { BASE_URL } from '../auth/api';
import { getAuthHeaders } from '../wallet/api';

/**
 * Cart thường (Add to cart)
 */
export const ApiAddToCart = async (data: any) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/carts/items`, data, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Mua ngay (Instant checkout)
 */
export const ApiAddInstantToCart = async (data: any) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/carts/instant`, data, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Lấy cart
 * type = NORMAL | INSTANT
 */
export const ApiGetCart = async (type = "NORMAL") => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/carts?type=${type}`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Xóa item khỏi cart
 */
export const ApiRemoveCartItem = async (itemId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.delete(`${BASE_URL}/carts/items/${itemId}`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Cập nhật item trong cart
 */
export const ApiUpdateCartItem = async (itemId: string, data: any) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.put(`${BASE_URL}/carts/items/${itemId}`, data, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/**
 * Clear cart
 */
export const ApiClearCart = async (type = "NORMAL") => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.delete(`${BASE_URL}/carts/clear?type=${type}`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};
