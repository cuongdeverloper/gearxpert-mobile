import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Image 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useSocket } from '../../src/context/SocketContext';
import { 
  ApiGetMessageByConversationId, ApiSendMessage, ApiMarkMessagesAsSeen, ApiGetUserByUserId, getConversationApi 
} from '../../src/features/chat/api';
import MessageItem from '../../src/features/chat/components/MessageItem';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const ChatDetailScreen = () => {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiver, setReceiver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const response = await ApiGetMessageByConversationId(conversationId);
      if (response && Array.isArray(response)) {
        setMessages(response);
      }
      
      // Fetch receiver info if not already fetched
      if (!receiver) {
         // We might need to find the receiver ID from the conversation or fetch it
         // For now, we'll try to find it from the list of conversations or fetch conversation details
         const conversations = await getConversationApi();
         const currentChat = conversations.find((c: any) => c._id === conversationId);
         if (currentChat) {
            const receiverId = currentChat.members.find((m: string) => m !== user?.id);
            if (receiverId) {
                const receiverInfo = await ApiGetUserByUserId(receiverId);
                setReceiver(receiverInfo);
            }
         }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.id, receiver]);

  const markAsSeen = useCallback(async () => {
    if (conversationId) {
      await ApiMarkMessagesAsSeen(conversationId);
      if (socket && user?.id) {
        socket.emit("seenMessage", { senderId: user.id, conversationId });
      }
    }
  }, [conversationId, socket, user?.id]);

  useEffect(() => {
    fetchMessages();
    markAsSeen();
  }, [fetchMessages, markAsSeen]);

  useEffect(() => {
    if (!socket) return;

    const handleGetMessage = (data: any) => {
      if (data.conversationId === conversationId) {
        setMessages((prev) => [...prev, {
          ...data,
          createdAt: Date.now(),
          sender: { _id: data.senderId }
        }]);
        markAsSeen();
      }
    };

    socket.on("getMessage", handleGetMessage);
    return () => {
      socket.off("getMessage", handleGetMessage);
    };
  }, [socket, conversationId, markAsSeen]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (!receiver?._id || !conversationId) return;

    const text = newMessage;
    setNewMessage("");

    // Optimistic update or wait for API
    try {
      const response = await ApiSendMessage(receiver._id, text, conversationId);
      if (response) {
        const newMsg = {
          ...response,
          sender: { _id: user?.id, avatar: user?.avatar }
        };
        setMessages((prev) => [...prev, newMsg]);

        if (socket) {
          socket.emit("sendMessage", {
            senderId: user?.id,
            receiverId: receiver._id,
            text: text,
            conversationId: conversationId,
          });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    const formData = new FormData();
    // Assuming you have cloudinary preset in env or similar
    // Since I don't have access to .env on mobile easily, 
    // I'll stick to text for now or assume a generic upload endpoint if needed.
    // For this implementation, I'll focus on text chat first as requested.
    setUploading(false);
    return null; 
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
       // Handle image upload logic here if needed
    }
  };

  const isOnline = onlineUsers.some((u: any) => u.userId === receiver?._id);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#F8FAFC" />
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Image 
              source={receiver?.avatar ? { uri: receiver.avatar } : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
              style={styles.avatar} 
            />
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View>
            <Text style={styles.userName}>{receiver?.fullName || "User"}</Text>
            <Text style={styles.userStatus}>{isOnline ? "Online" : "Offline"}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="information-circle-outline" size={24} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={({ item }) => (
            <MessageItem message={item} own={item.sender?._id === user?.id || item.sender === user?.id} />
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color={Colors.dark.accent} />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#64748B"
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
          </View>

          <TouchableOpacity 
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  backButton: {
    padding: 5,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: Colors.dark.background,
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Fonts.sansBold,
  },
  userStatus: {
    color: '#64748B',
    fontSize: 12,
  },
  headerAction: {
    padding: 5,
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  attachButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 22,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    color: '#F8FAFC',
    fontSize: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
    paddingBottom: Platform.OS === 'ios' ? 10 : 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  }
});

export default ChatDetailScreen;
