import axios from 'axios';
import { getToken } from '../../shared/utils/storage';

const BASE_URL = 'https://gearxpert-production.up.railway.app/api/message';

const getHeaders = async () => {
    const token = await getToken();
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export const getConversationApi = async () => {
  try {
    const headers = await getHeaders();
    const response = await axios.get(`${BASE_URL}/conversation`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error getting conversations:", error);
    return null;
  }
};

export const ApiGetMessageByConversationId = async (conversationId: string) => {
  try {
    const headers = await getHeaders();
    const response = await axios.get(`${BASE_URL}/messages/${conversationId}`, { headers });
    return response.data;
  } catch (error) {
    console.error("Error get chat:", error);
    return null;
  }
};

export const ApiSendMessage = async (receiverId: string, text: string, conversationId: string | null = null, image = "", type = "text") => {
  try {
    const headers = await getHeaders();
    const response = await axios.post(
      `${BASE_URL}/message`,
      { 
          receiverId, 
          text, 
          conversationId, 
          image,
          type
      }, 
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    return null;
  }
};

export const ApiMarkMessagesAsSeen = async (conversationId: string) => {
  try {
    const headers = await getHeaders();
    const response = await axios.put(`${BASE_URL}/seenmessage/${conversationId}`, {}, { headers });
    return response.data;
  } catch (error) {
    console.error("Error message seen :", error);
    return null;
  }
};

export const ApiDeleteMessage = async (messageId: string) => {
  try {
    const headers = await getHeaders();
    await axios.put(`${BASE_URL}/delete/${messageId}`, {}, { headers });
    return true;
  } catch (error) {
    console.error("Error deleting message:", error);
    return false;
  }
};

export const ApiGetUserByUserId = async (userId: string) => {
    try {
      const headers = await getHeaders();
      const response = await axios.get(`${BASE_URL}/user/${userId}`, { headers });
      return response.data;
    } catch (error) {
      console.error("Error get user:", error);
      return null;
    }
};

export const ApiCreateConversation = async (receiverId: string) => {
    try {
      const headers = await getHeaders();
      const response = await axios.post(`${BASE_URL}/conversation`, { receiverId }, { headers });
      return response.data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
};
