import axios from 'axios';
import { BASE_URL } from '../auth/api';
import { getAuthHeaders } from '../wallet/api';

// --- Rentals ---
export const ApiGetDeliveringRentals = async () => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/rentals/delivering`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiGetReturningRentals = async () => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/rentals/returning`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiClaimTask = async (taskId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/rentals/delivery-tasks/${taskId}/claim`, {}, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiConfirmPickup = async (rentalId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/rentals/${rentalId}/confirm-pickup`, {}, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

// --- Handover (prefix: /api/handovers) ---
export const ApiGetHandoverByRental = async (rentalId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/handovers/rentals/${rentalId}`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiCreateHandoverDraft = async (rentalId: string, deliveryTaskId?: string) => {
  try {
    const config = await getAuthHeaders();
    const body = deliveryTaskId ? { deliveryTaskId } : {};
    const response = await axios.post(`${BASE_URL}/handovers/rentals/${rentalId}/draft`, body, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiStartHandover = async (handoverId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.patch(`${BASE_URL}/handovers/${handoverId}/start`, {}, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiSaveHandoverInspection = async (handoverId: string, data: any) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.patch(`${BASE_URL}/handovers/${handoverId}/inspection`, data, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiConfirmHandoverSuccess = async (handoverId: string, formData: FormData) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/handovers/${handoverId}/confirm-success`, formData, {
      headers: { ...config.headers },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiFailHandover = async (handoverId: string, formData: FormData) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/handovers/${handoverId}/fail`, formData, {
      headers: { ...config.headers },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

// --- Return (prefix: /api/returns) ---
export const ApiGetReturnByRental = async (rentalId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/returns/rentals/${rentalId}`, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiCreateReturnDraft = async (rentalId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/returns/rentals/${rentalId}/draft`, {}, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiStartReturn = async (returnRecordId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.patch(`${BASE_URL}/returns/${returnRecordId}/start`, {}, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiSaveReturnInspection = async (returnRecordId: string, data: any) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.patch(`${BASE_URL}/returns/${returnRecordId}/inspection`, data, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiConfirmReturnSuccess = async (returnRecordId: string, formData: FormData) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/returns/${returnRecordId}/confirm-success`, formData, {
      headers: { ...config.headers },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

/** Web sử dụng endpoint này: POST /api/rentals/:rentalId/confirm-return */
export const ApiConfirmReturnByRental = async (rentalId: string, formData: FormData) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/rentals/${rentalId}/confirm-return`, formData, {
      headers: { ...config.headers },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiCreateReturnRetry = async (rentalId: string) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/returns/rentals/${rentalId}/retry`, {}, config);
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

export const ApiFailReturn = async (returnRecordId: string, formData: FormData) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.post(`${BASE_URL}/returns/${returnRecordId}/fail`, formData, {
      headers: { ...config.headers },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};

// --- Reports ---
export const ApiReportStaffIssue = async (type: 'delivery' | 'return', formData: FormData) => {
  try {
    const config = await getAuthHeaders();
    const endpoint = type === 'delivery' ? '/reports/staff-delivery-issue' : '/reports/staff-return-issue';
    const response = await axios.post(`${BASE_URL}${endpoint}`, formData, {
      headers: { ...config.headers },
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};
// --- Operation Logs ---
export const ApiGetMyOperationLogs = async (page = 1, limit = 50) => {
  try {
    const config = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/operation-logs/my`, {
      ...config,
      params: { page, limit }
    });
    return response.data;
  } catch (error: any) {
    return error.response?.data || { errorCode: -1, message: "Lỗi mạng" };
  }
};
