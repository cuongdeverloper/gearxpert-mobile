import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ApiGetBlogDetail } from '../../src/features/blog/api';

const { width } = Dimensions.get('window');

const BlogDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await ApiGetBlogDetail(id as string);
      if (res && res._id) {
        setBlog(res);
      }
    } catch (error) {
      console.error('Error fetching blog detail:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!blog) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Article not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={styles.imageSection}>
          <Image 
            source={{ uri: blog.coverImage }} 
            style={styles.mainImage} 
            resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.6)', 'transparent', 'rgba(15, 23, 42, 0.8)']}
            style={StyleSheet.absoluteFill}
          />
          
          <SafeAreaView style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.circleButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleButton}>
              <Ionicons name="share-outline" size={24} color="#FFF" />
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.bottomInfo}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{blog.category}</Text>
            </View>
            <Text style={styles.titleText}>{blog.title}</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <View style={styles.authorMeta}>
            <View style={styles.authorAvatar}>
              {blog.author?.avatar ? (
                <Image source={{ uri: blog.author.avatar }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarTxt}>{blog.author?.name?.charAt(0) || 'G'}</Text>
              )}
            </View>
            <View style={styles.metaText}>
              <Text style={styles.authorName}>{blog.author?.name || 'GearXpert Editor'}</Text>
              <Text style={styles.dateText}>
                {new Date(blog.createdAt).toLocaleDateString()} • {blog.readTime} min read
              </Text>
            </View>
            <View style={styles.viewsContainer}>
              <Ionicons name="eye-outline" size={16} color="#94A3B8" />
              <Text style={styles.viewsCount}>{blog.views || 0}</Text>
            </View>
          </View>

          <View style={styles.articleBody}>
            {/* Simple content render — stripping basic HTML tags if any */}
            <Text style={styles.descriptionText}>{blog.description}</Text>
            
            {/* If blog.content exists and is HTML, we might need a better renderer. 
                For now we show description + content (striptags attempt) */}
            <Text style={styles.contentText}>
              {blog.content?.replace(/<[^>]*>?/gm, '') || ''}
            </Text>
          </View>

          {/* Interaction Bar */}
          <View style={styles.interactionBar}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="thumbs-up-outline" size={20} color="#6366F1" />
              <Text style={styles.actionText}>{blog.likes?.length || 0} Likes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={20} color="#6366F1" />
              <Text style={styles.actionText}>{blog.comments?.length || 0} Comments</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="bookmark-outline" size={20} color="#6366F1" />
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
};

export default BlogDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 16,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  imageSection: {
    width: width,
    height: 400,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  headerButtons: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 0 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },
  categoryBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  titleText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  contentSection: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  authorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarTxt: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  metaText: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    color: '#F1F5F9',
    fontSize: 15,
    fontWeight: '700',
  },
  dateText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsCount: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  articleBody: {
    paddingBottom: 40,
  },
  descriptionText: {
    color: '#F1F5F9',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 20,
  },
  contentText: {
    color: '#CBD5E1',
    fontSize: 16,
    lineHeight: 28,
  },
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
