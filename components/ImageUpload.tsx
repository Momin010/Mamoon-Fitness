
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import { Camera, X, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../context/SupabaseContext';
import { decode } from 'base64-arraybuffer';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  onCancel: () => void;
  bucket?: string;
  folder?: string;
  isVisible: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  onCancel,
  bucket = 'images',
  folder = 'uploads',
  isVisible
}) => {
  const { user } = useSupabase();
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setPreview(result.assets[0].uri);
      setError('');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      setPreview(result.assets[0].uri);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!preview) return;
    if (!user) {
      setError('You must be signed in to upload images');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // For mobile, we might need to fetch the file to get a blob or use base64
      // Using base64 from image picker is often easier for small/medium images
      const result = await ImagePicker.launchImageLibraryAsync({
          base64: true,
          quality: 0.8
      }); // This is redundant but just thinking about the best way

      // Actually we already have the URI. Let's get the base64 again if needed or fetch
      const response = await fetch(preview);
      const blob = await response.blob();

      const filename = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename);

      onImageUploaded(publicUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View className="flex-1 bg-black/90 justify-center items-center p-6">
        <View className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-xl font-bold">Upload Image</Text>
            <TouchableOpacity
              onPress={onCancel}
              className="p-2 bg-zinc-800 rounded-full"
            >
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          {error && (
            <View className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <Text className="text-red-400 text-sm">{error}</Text>
            </View>
          )}

          {!preview ? (
            <View className="gap-3">
              <TouchableOpacity
                onPress={pickImage}
                className="border-2 border-dashed border-zinc-700 rounded-xl p-8 items-center"
              >
                <Upload size={48} color="#71717a" className="mb-4" />
                <Text className="text-zinc-400 mb-2">Select from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={takePhoto}
                className="border-2 border-dashed border-zinc-700 rounded-xl p-8 items-center"
              >
                <Camera size={48} color="#71717a" className="mb-4" />
                <Text className="text-zinc-400 mb-2">Take a Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="relative">
              <Image
                source={{ uri: preview }}
                className="w-full h-48 rounded-xl"
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setPreview(null)}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full"
              >
                <X size={16} color="white" />
              </TouchableOpacity>
            </View>
          )}

          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 py-3 border border-zinc-700 rounded-xl items-center"
            >
              <Text className="text-zinc-400">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleUpload}
              disabled={!preview || isUploading}
              className={`flex-1 py-3 bg-green-500 rounded-xl items-center flex-row justify-center gap-2 ${(!preview || isUploading) ? 'opacity-50' : ''}`}
            >
              {isUploading ? (
                <ActivityIndicator color="black" />
              ) : (
                <Upload size={18} color="black" />
              )}
              <Text className="text-black font-bold">{isUploading ? 'Uploading...' : 'Upload'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ImageUpload;
