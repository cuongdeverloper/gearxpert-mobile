import axios from 'axios';

const BASE_URL = 'https://gearxpert-production.up.railway.app/api';

export const ApiGetPublicSuppliers = async (params: any = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/suppliers/public`, { params });
    return response.data;
  } catch (error: any) {
    console.error('Error in ApiGetPublicSuppliers:', error);
    return error.response?.data || { success: false, message: "Network error" };
  }
};

export const ApiGetSupplierStorefront = async (supplierId: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/suppliers/${supplierId}/storefront`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

export const ApiGetSupplierStorefrontDevices = async (supplierId: string, params: any = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/suppliers/${supplierId}/storefront/devices`, { params });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

export const ApiGetSupplierStorefrontVouchers = async (supplierId: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/suppliers/${supplierId}/storefront/vouchers`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

export const ApiToggleFollowStore = async (supplierId: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/suppliers/${supplierId}/follow`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

export const ApiGetFollowStatus = async (supplierId: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/suppliers/${supplierId}/follow-status`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};
