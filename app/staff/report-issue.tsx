import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ApiReportStaffIssue } from '../../src/features/staff/api';

export default function ReportIssueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [issueType, setIssueType] = useState<'delivery' | 'return'>('delivery');
  const [rentalId, setRentalId] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!rentalId || !description) {
      Alert.alert('Error', 'Rental ID and Description are required.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('rentalId', rentalId);
      formData.append('description', description);
      
      images.forEach((imgUri, index) => {
        const fileMatch = imgUri.match(/\/([^\/?#]+)[^\/]*$/);
        const fileName = fileMatch ? fileMatch[1] : `image_${index}.jpg`;
        formData.append('images', {
          uri: imgUri,
          name: fileName,
          type: 'image/jpeg',
        } as any);
      });

      const res = await ApiReportStaffIssue(issueType, formData);
      
      if (res && res.errorCode === 0) {
        Alert.alert('Success', 'Issue reported successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to report issue');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F172A', '#1E1B4B']} style={StyleSheet.absoluteFillObject} />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Issue Type</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeButton, issueType === 'delivery' && styles.typeButtonActive]}
            onPress={() => setIssueType('delivery')}
          >
            <Text style={[styles.typeText, issueType === 'delivery' && styles.typeTextActive]}>Delivery Issue</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, issueType === 'return' && styles.typeButtonActive]}
            onPress={() => setIssueType('return')}
          >
            <Text style={[styles.typeText, issueType === 'return' && styles.typeTextActive]}>Return Issue</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Rental ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Rental ID"
          placeholderTextColor="#64748B"
          value={rentalId}
          onChangeText={setRentalId}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the issue in detail..."
          placeholderTextColor="#64748B"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Evidences (Images)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
          {images.map((img, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri: img }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 5 && (
            <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
              <Ionicons name="camera-outline" size={32} color="#94A3B8" />
              <Text style={styles.addImageText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <TouchableOpacity 
          style={[styles.submitBtn, isLoading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Submit Report</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 },
  backButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  content: { padding: 20 },
  label: { color: '#F8FAFC', fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 16 },
  typeSelector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 },
  typeButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  typeButtonActive: { backgroundColor: '#22D3EE' },
  typeText: { color: '#94A3B8', fontWeight: '500' },
  typeTextActive: { color: '#0F172A', fontWeight: 'bold' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingHorizontal: 16, height: 50, color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 16 },
  imagesContainer: { flexDirection: 'row', marginTop: 8 },
  imageWrapper: { marginRight: 12, position: 'relative' },
  previewImage: { width: 80, height: 80, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 12 },
  addImageBtn: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  addImageText: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  submitBtn: { backgroundColor: '#EF4444', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 40 },
  submitBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
