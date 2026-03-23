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
