import axios from 'axios';

const BASE_URL = 'https://gearxpert-production.up.railway.app/api';

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