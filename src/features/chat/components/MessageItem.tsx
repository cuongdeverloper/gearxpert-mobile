import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../../../../constants/theme';

interface MessageItemProps {
  message: any;
  own: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, own }) => {
  const isImage = !!message.image;

  return (
    <View style={[styles.container, own ? styles.ownContainer : styles.otherContainer]}>
      {!own && (
        <Image 
          source={message.sender?.avatar ? { uri: message.sender.avatar } : { uri: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }} 
          style={styles.avatar} 
        />
      )}
      <View style={[styles.messageBox, own ? styles.ownMessageBox : styles.otherMessageBox]}>
        {isImage ? (
          <Image source={{ uri: message.image }} style={styles.messageImage} resizeMode="cover" />
        ) : (
          <Text style={[styles.messageText, own ? styles.ownMessageText : styles.otherMessageText]}>
            {message.text}
          </Text>
        )}
        <Text style={styles.timestamp}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
    backgroundColor: '#334155',
  },
  messageBox: {
    padding: 12,
    borderRadius: 18,
    position: 'relative',
  },
  ownMessageBox: {
    backgroundColor: Colors.dark.primary,
    borderBottomRightRadius: 4,
  },
  otherMessageBox: {
    backgroundColor: '#334155',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#F1F5F9',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});

export default MessageItem;
