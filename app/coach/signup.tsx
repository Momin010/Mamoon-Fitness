
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  CheckCircle,
  Star,
  Users,
  Trophy,
  Upload,
  AlertCircle,
  Clock,
  XCircle,
  MessageSquare
} from 'lucide-react-native';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';
import { ForgeButton } from '../../components/ForgeButton';
import { ForgeSlider } from '../../components/ForgeSlider';

interface CoachApplication {
  bio: string;
  specialties: string[];
  experience: number;
  certifications: string[];
  socialLinks: {
    instagram?: string;
    youtube?: string;
    website?: string;
  };
}

const SPECIALTIES_OPTIONS = [
  'Strength Training',
  'Weight Loss',
  'Bodybuilding',
  'CrossFit',
  'Yoga',
  'Nutrition',
  'HIIT',
  'Powerlifting',
  'Calisthenics',
  'Running'
];

interface ExistingApplication {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function CoachSignupScreen() {
  const router = useRouter();
  const { user: authUser } = useSupabase();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const [application, setApplication] = useState<CoachApplication>({
    bio: '',
    specialties: [],
    experience: 1,
    certifications: [],
    socialLinks: {}
  });

  const [newCertification, setNewCertification] = useState('');

  // Check for existing application
  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!authUser) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('coach_applications')
          .select('id, status, admin_notes, created_at, updated_at')
          .eq('user_id', authUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking existing application:', error);
        }

        if (data) {
          setExistingApp(data as any);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setIsChecking(false);
      }
    };

    checkExistingApplication();
  }, [authUser]);

  const toggleSpecialty = (specialty: string) => {
    setApplication(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setApplication(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setApplication(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!authUser) {
      setError('You must be logged in to apply');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('coach_applications')
        .insert({
          user_id: authUser.id,
          bio: application.bio,
          specialties: application.specialties,
          experience_years: application.experience,
          certifications: application.certifications,
          social_links: application.socialLinks,
          status: 'pending'
        });

      if (submitError) throw submitError;

      setSuccess(true);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return application.bio.length >= 50;
      case 2:
        return application.specialties.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (isChecking) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <ActivityIndicator color="#22c55e" size="large" />
        <Text className="mt-4 text-zinc-400">Checking application status...</Text>
      </View>
    );
  }

  if (existingApp && !success) {
    const getStatusConfig = () => {
      switch (existingApp.status) {
        case 'approved':
          return {
            icon: <CheckCircle size={48} color="#22c55e" />,
            bgColor: 'bg-green-500/20',
            title: 'Application Approved!',
            message: 'Congratulations! Your coach application has been approved. You can now access your coach dashboard.',
            showCoachLink: true
          };
        case 'rejected':
          return {
            icon: <XCircle size={48} color="#ef4444" />,
            bgColor: 'bg-red-500/20',
            title: 'Application Not Approved',
            message: 'Unfortunately, your coach application was not approved at this time.',
            showCoachLink: false
          };
        default:
          return {
            icon: <Clock size={48} color="#eab308" />,
            bgColor: 'bg-yellow-500/20',
            title: 'Application Under Review',
            message: 'Your coach application is currently being reviewed. We\'ll notify you once a decision has been made.',
            showCoachLink: false
          };
      }
    };

    const config = getStatusConfig();

    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <View className="items-center max-w-md w-full">
          <View className={`w-24 h-24 ${config.bgColor} rounded-full items-center justify-center mb-6`}>
            {config.icon}
          </View>
          <h1 className="text-white text-2xl font-bold mb-4">{config.title}</h1>
          <Text className="text-zinc-400 text-center mb-6">
            {config.message}
          </Text>

          {existingApp.admin_notes && (
            <View className="mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800 w-full">
              <View className="flex-row items-center gap-2 mb-2">
                <MessageSquare size={16} color="#71717a" />
                <Text className="text-zinc-400 text-sm font-medium">Reviewer Notes</Text>
              </View>
              <Text className="text-zinc-300 text-sm">{existingApp.admin_notes}</Text>
            </View>
          )}

          <View className="space-y-3 w-full">
            {config.showCoachLink && (
              <ForgeButton
                onPress={() => router.push('/coach')}
              >
                Go to Coach Dashboard
              </ForgeButton>
            )}
            <ForgeButton
              variant="secondary"
              onPress={() => router.push('/settings')}
            >
              Back to Settings
            </ForgeButton>
          </View>
        </View>
      </View>
    );
  }

  if (success) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <View className="items-center max-w-md w-full text-center">
          <View className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center mb-6">
            <CheckCircle size={40} color="#22c55e" />
          </View>
          <Text className="text-white text-2xl font-bold mb-4">Application Submitted!</Text>
          <Text className="text-zinc-400 text-center mb-8">
            Thank you for your interest in becoming a Forge Fitness coach.
            We'll review your application and get back to you within 3-5 business days.
          </Text>
          <ForgeButton
            onPress={() => router.push('/settings')}
          >
            Back to Settings
          </ForgeButton>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <View className="flex-row items-center gap-4 p-6 border-b border-zinc-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl font-bold">Become a Coach</Text>
          <Text className="text-xs text-zinc-500">Step {step} of 3</Text>
        </View>
      </View>

      <View className="flex-row gap-1 p-4">
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-green-500' : 'bg-zinc-800'}`}
          />
        ))}
      </View>

      <ScrollView className="flex-1 p-6">
        {error && (
          <View className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex-row items-center gap-3">
            <AlertCircle size={20} color="#ef4444" />
            <Text className="text-red-400 text-sm">{error}</Text>
          </View>
        )}

        {step === 1 && (
          <View className="space-y-6">
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-green-500/20 rounded-full items-center justify-center mb-4">
                <Star size={32} color="#22c55e" />
              </View>
              <Text className="text-white text-xl font-bold mb-2">Tell us about yourself</Text>
              <Text className="text-zinc-400 text-sm text-center">
                Share your fitness journey and what makes you unique
              </Text>
            </View>

            <View>
              <Text className="text-zinc-400 text-sm font-medium mb-2 ml-1">
                Bio <Text className="text-zinc-600">({application.bio.length}/500)</Text>
              </Text>
              <TextInput
                value={application.bio}
                onChangeText={(text) => setApplication(prev => ({ ...prev, bio: text }))}
                placeholder="Tell us about your fitness philosophy, experience, and what motivates you..."
                placeholderTextColor="#3f3f46"
                multiline
                numberOfLines={6}
                maxLength={500}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-white text-base h-40"
                style={{ textAlignVertical: 'top' }}
              />
              <Text className="text-xs text-zinc-500 mt-2">
                Minimum 50 characters required
              </Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View className="space-y-6">
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-blue-500/20 rounded-full items-center justify-center mb-4">
                <Trophy size={32} color="#3b82f6" />
              </View>
              <Text className="text-white text-xl font-bold mb-2">Your Specialties</Text>
              <Text className="text-zinc-400 text-sm text-center">
                Select the areas you specialize in
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-3">
              {SPECIALTIES_OPTIONS.map((specialty) => {
                const isSelected = application.specialties.includes(specialty);
                return (
                  <TouchableOpacity
                    key={specialty}
                    onPress={() => toggleSpecialty(specialty)}
                    className={`p-4 rounded-xl border-2 w-[48%] ${isSelected ? 'border-green-500 bg-green-500/10' : 'border-zinc-800 bg-zinc-900'}`}
                  >
                    <View className="flex-row items-center gap-2">
                        <View className={`w-5 h-5 rounded border-2 items-center justify-center ${isSelected ? 'border-green-500 bg-green-500' : 'border-zinc-600'}`}>
                            {isSelected && <CheckCircle size={12} color="black" />}
                        </View>
                        <Text className={`font-medium text-sm ${isSelected ? 'text-green-500' : 'text-zinc-400'}`}>{specialty}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View className="space-y-6">
            <View className="items-center mb-8">
              <View className="w-16 h-16 bg-purple-500/20 rounded-full items-center justify-center mb-4">
                <Users size={32} color="#a855f7" />
              </View>
              <Text className="text-white text-xl font-bold mb-2">Experience & Credentials</Text>
              <Text className="text-zinc-400 text-sm text-center">
                Help us understand your background
              </Text>
            </View>

            <ForgeSlider
              label="Years of Experience"
              value={application.experience}
              onChange={(value) => setApplication(prev => ({ ...prev, experience: value }))}
              min={0}
              max={30}
            />

            <View>
              <Text className="text-zinc-400 text-sm font-medium mb-3 ml-1">Certifications</Text>
              <View className="flex-row gap-2 mb-3">
                <TextInput
                  value={newCertification}
                  onChangeText={setNewCertification}
                  placeholder="e.g., NASM-CPT"
                  placeholderTextColor="#3f3f46"
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                />
                <TouchableOpacity
                  onPress={addCertification}
                  disabled={!newCertification.trim()}
                  className={`bg-zinc-800 px-4 rounded-xl items-center justify-center ${!newCertification.trim() ? 'opacity-50' : ''}`}
                >
                  <Text className="text-white font-bold">Add</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row flex-wrap gap-2">
                {application.certifications.map((cert, index) => (
                  <View key={index} className="flex-row items-center bg-zinc-800 px-3 py-1 rounded-full">
                    <Text className="text-zinc-300 text-sm mr-2">{cert}</Text>
                    <TouchableOpacity onPress={() => removeCertification(index)}>
                      <Text className="text-zinc-500 text-lg">×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            <View className="space-y-3">
              <Text className="text-zinc-400 text-sm font-medium ml-1">Social Links (Optional)</Text>
              <TextInput
                value={application.socialLinks.instagram}
                onChangeText={(text) => setApplication(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: text } }))}
                placeholder="Instagram URL"
                placeholderTextColor="#3f3f46"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
              />
              <TextInput
                value={application.socialLinks.youtube}
                onChangeText={(text) => setApplication(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: text } }))}
                placeholder="YouTube URL"
                placeholderTextColor="#3f3f46"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white"
              />
            </View>
          </View>
        )}
        <View className="h-20" />
      </ScrollView>

      <View className="p-6 border-t border-zinc-800 flex-row gap-3">
        {step > 1 && (
          <TouchableOpacity
            onPress={() => setStep(step - 1)}
            className="flex-1 py-4 bg-zinc-800 rounded-2xl items-center"
          >
            <Text className="text-white font-bold">Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={step < 3 ? () => setStep(step + 1) : handleSubmit}
          disabled={!canProceed() || isSubmitting}
          className={`flex-1 py-4 bg-green-500 rounded-2xl items-center ${(!canProceed() || isSubmitting) ? 'opacity-50' : ''}`}
        >
          <Text className="text-black font-bold">{step < 3 ? 'Continue' : (isSubmitting ? 'Submitting...' : 'Submit')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
