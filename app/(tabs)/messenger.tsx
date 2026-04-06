import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '../../constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { useSocket } from '../../src/context/SocketContext';
import { getConversationApi, ApiGetUserByUserId } from '../../src/features/chat/api';
import ConversationItem from '../../src/features/chat/components/ConversationItem';
import BottomNav from '../../src/components/BottomNav';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const MessengerScreen = () => {
  const { user, isAuthenticated } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      const response = await getConversationApi();
      if (response && Array.isArray(response)) {
        const enriched = await Promise.all(response.map(async (conv: any) => {
          const friendId = conv.members.find((m: string) => m !== user.id);
          if (friendId) {
            const friendInfo = await ApiGetUserByUserId(friendId);
            return {
              ...conv,
              friendName: friendInfo?.fullName || friendInfo?.username || "User",
              friendAvatar: friendInfo?.avatar || "",
              friendId: friendId
            };
          }
          return conv;
        }));
        setConversations(enriched);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      // Refresh list when new message arrives to update last message and order
      fetchConversations();
    };

    socket.on("getMessage", handleNewMessage);
    return () => {
      socket.off("getMessage", handleNewMessage);
    };
  }, [socket, fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const isOnline = (friendId: string) => {
    return onlineUsers.some((u: any) => u.userId === friendId);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Chats</Text>
      <TouchableOpacity style={styles.headerIcon}>
        <Ionicons name="create-outline" size={24} color={Colors.dark.accent} />
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.messageText}>Vui lòng đăng nhập để xem tin nhắn</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(auth)/signin')}>
          <Text style={styles.loginButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgContainer}>
        <View style={[styles.glowOrb, { top: -100, right: -50, backgroundColor: 'rgba(99, 102, 241, 0.2)' }]} />
        <View style={[styles.glowOrb, { bottom: -50, left: -100, backgroundColor: 'rgba(34, 211, 238, 0.1)' }]} />
      </View>

      {renderHeader()}

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.dark.accent} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              currentUser={user}
              isActive={false}
              isOnline={isOnline(item.friendId)}
              onPress={() => router.push(`/messenger/${item._id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.accent} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#334155" />
              <Text style={styles.emptyText}>Chưa có cuộc trò chuyện nào</Text>
            </View>
          }
        />
      )}

      <BottomNav activeTab="messenger" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  bgContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  glowOrb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F8FAFC',
    fontFamily: Fonts.sansBold,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#475569',
    fontSize: 16,
    marginTop: 16,
  },
});

export default MessengerScreen;
