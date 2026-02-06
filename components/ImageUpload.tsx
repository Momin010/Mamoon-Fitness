
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import { Camera, X, Upload, Loader2, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../context/SupabaseContext';
import { decode } from 'base64-arraybuffer';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  onCancel: () => void;
  bucket?: string;
  folder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  onCancel,
  bucket = 'images',
  folder = 'uploads'
}) => {
  const { user } = useSupabase();
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [base64, setBase64] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setPreview(result.assets[0].uri);
      setBase64(result.assets[0].base64 || null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled) {
      setPreview(result.assets[0].uri);
      setBase64(result.assets[0].base64 || null);
    }
  };

  const handleUpload = async () => {
    if (!base64 || !user) return;

    setIsUploading(true);
    try {
      const filename = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = filename;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, decode(base64), {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onImageUploaded(publicUrl);
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <View className="flex-1 bg-black/90 items-center justify-center p-6">
        <View className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm border border-zinc-800">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold text-white">Upload Image</Text>
            <TouchableOpacity onPress={onCancel} className="p-2 bg-zinc-800 rounded-full">
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          {!preview ? (
            <View className="gap-4">
              <TouchableOpacity
                onPress={pickImage}
                className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 items-center justify-center"
              >
                <ImageIcon size={48} color="#71717a" />
                <Text className="text-zinc-400 mt-4 font-bold">Choose from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={takePhoto}
                className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 items-center justify-center"
              >
                <Camera size={48} color="#71717a" />
                <Text className="text-zinc-400 mt-4 font-bold">Take a Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="relative">
              <Image
                source={{ uri: preview }}
                className="w-full h-64 rounded-2xl"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => { setPreview(null); setBase64(null); }}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full"
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row gap-3 mt-8">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 py-4 border border-zinc-700 rounded-2xl items-center"
            >
              <Text className="text-zinc-400 font-bold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUpload}
              disabled={!preview || isUploading}
              className={`flex-1 py-4 bg-green-500 rounded-2xl items-center flex-row justify-center gap-2 ${(!preview || isUploading) ? 'opacity-50' : ''}`}
            >
              {isUploading ? (
                <ActivityIndicator color="black" size="small" />
              ) : (
                <>
                  <Upload size={18} color="black" />
                  <Text className="text-black font-bold">Upload</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ImageUpload;
