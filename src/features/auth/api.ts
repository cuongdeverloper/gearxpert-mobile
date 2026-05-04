import axios from 'axios';

export const BASE_URL = 'https://gearxpert-production.up.railway.app/api';

export const ApiLogin = async (email: string, password: string) => {
  try {
    const response = await axios.post(`${BASE_URL}/auths/login`, {
      email: email,
      password: password,
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

export const ApiGetCurrentUser = async (token: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/auths/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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

export const ApiUpdateProfile = async (token: string, formData: FormData) => {
  try {
    const response = await axios.put(`${BASE_URL}/auths/update-profile`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
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