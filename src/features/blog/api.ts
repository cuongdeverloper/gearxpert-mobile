import axios from 'axios';

const BASE_URL = 'https://gearxpert-production.up.railway.app/api';

export const ApiGetBlogs = async (params: any = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/blogs`, { params });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};

export const ApiGetFeaturedBlogs = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/blogs/featured`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};

export const ApiGetBlogDetail = async (id: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/blogs/${id}`);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};

export const ApiToggleSaveBlog = async (id: string, userName: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/blogs/${id}/save`, { userName });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Network error" };
  }
};
