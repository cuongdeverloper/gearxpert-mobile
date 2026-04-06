import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../../../../constants/theme';

interface ConversationItemProps {
  conversation: any;
  currentUser: any;
  isActive: boolean;
  isOnline: boolean;
  onPress: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, currentUser, isActive, isOnline, onPress 
}) => {
  const friendName = conversation.friendName || "User";
  const lastMessage = conversation.lastMessage?.text || (conversation.lastMessage?.image ? "Sent an image" : "Started a conversation");
  
  return (
    <TouchableOpacity 
      style={[styles.container, isActive && styles.activeContainer]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={conversation.friendAvatar ? { uri: conversation.friendAvatar } : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
          style={styles.avatar} 
        />
        {isOnline && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.nameText} numberOfLines={1}>{friendName}</Text>
          <Text style={styles.timeText}>
            {conversation.lastMessage?.createdAt ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
          </Text>
        </View>
        <Text style={[styles.lastMessageText, !conversation.lastMessage?.seen && conversation.lastMessage?.sender !== currentUser?.id && styles.unreadText]} numberOfLines={1}>
          {lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  activeContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  imageContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: Colors.dark.background,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  lastMessageText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  unreadText: {
    color: '#F8FAFC',
    fontWeight: 'bold',
  }
});

export default ConversationItem;
