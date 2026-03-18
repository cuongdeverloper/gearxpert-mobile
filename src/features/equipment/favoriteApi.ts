import axios from 'axios';

const BASE_URL = 'https://gearxpert-production.up.railway.app/api';

export const ApiToggleFavorite = async (token: string, deviceId: string) => {
    try {
        const response = await axios.post(`${BASE_URL}/favorites/toggle`, { deviceId }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error: any) {
        return error.response ? error.response.data : { errorCode: -1, message: error.message };
    }
};

export const ApiGetUserFavorites = async (token: string, params: any = {}) => {
    try {
        const response = await axios.get(`${BASE_URL}/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
            params
        });
        return response.data;
    } catch (error: any) {
        return error.response ? error.response.data : { errorCode: -1, message: error.message };
    }
};

export const ApiGetFavoriteDeviceIds = async (token: string) => {
    try {
        const response = await axios.get(`${BASE_URL}/favorites/list`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    } catch (error: any) {
        return error.response ? error.response.data : { errorCode: -1, message: error.message };
    }
};
