
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView, Image, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  User,
  Target,
  Dumbbell,
  Bell,
  Shield,
  Trash2,
  Save,
  Plus,
  X,
  Camera,
  LogOut,
  Download,
  AlertTriangle,
  Check,
  Loader2,
  Users,
  Crown,
  Moon,
  Globe,
  Lock
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useSupabase } from '../../context/SupabaseContext';
import { supabase } from '../../lib/supabase';
import { ForgeButton, ForgeSlider, ForgeToggle, ForgeDropdown, ImageUpload } from '../../components';

interface PrivacySettings {
  profileVisible: boolean;
  showWorkouts: boolean;
  showMeals: boolean;
  showStats: boolean;
  allowFriendRequests: boolean;
}

interface NotificationSettings {
  workoutReminders: boolean;
  mealReminders: boolean;
  friendActivity: boolean;
  achievements: boolean;
  coachUpdates: boolean;
  pushEnabled: boolean;
}

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const {
    user,
    updateUser,
    settings,
    updateSettings,
    resetAllData,
  } = useApp();
  const { user: authUser, signOut } = useSupabase();

  const [activeTab, setActiveTab] = useState<'profile' | 'goals' | 'exercises' | 'notifications' | 'privacy' | 'account'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isCoach, setIsCoach] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    email: user.email || '',
    username: '',
    bio: ''
  });

  // Goals form
  const [goalsForm, setGoalsForm] = useState({
    caloriesGoal: user.caloriesGoal,
    proteinGoal: user.proteinGoal,
    carbsGoal: user.carbsGoal,
    fatsGoal: user.fatsGoal
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisible: true,
    showWorkouts: true,
    showMeals: false,
    showStats: true,
    allowFriendRequests: true
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    workoutReminders: true,
    mealReminders: true,
    friendActivity: true,
    achievements: true,
    coachUpdates: true,
    pushEnabled: settings.notificationsEnabled
  });

  // Exercise management
  const [newExercise, setNewExercise] = useState('');

  // Load privacy settings
  useEffect(() => {
    if (authUser) {
      loadPrivacySettings();
      checkCoachStatus();
    }
  }, [authUser]);

  const loadPrivacySettings = async () => {
    try {
      const { data } = await supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', authUser?.id)
        .single();

      if (data) {
        setPrivacySettings({
          profileVisible: data.profile_visible,
          show_workouts: data.show_workouts,
          show_meals: data.show_meals,
          show_stats: data.show_stats,
          allowFriendRequests: data.allow_friend_requests
        } as any);
      }
    } catch (err) {
      console.error('Error loading privacy settings:', err);
    }
  };

  const checkCoachStatus = async () => {
    try {
      const { data } = await supabase
        .from('coach_profiles')
        .select('id')
        .eq('user_id', authUser?.id)
        .single();

      setIsCoach(!!data);
    } catch (err) {
      setIsCoach(false);
    }
  };

  const showSaveNotification = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 2000);
    Alert.alert('Settings', msg);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      updateUser({
        name: profileForm.name.trim(),
        email: profileForm.email.trim()
      });
      showSaveNotification('Profile saved!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGoals = async () => {
    setIsSaving(true);
    try {
      updateUser({
        caloriesGoal: Math.max(500, goalsForm.caloriesGoal),
        proteinGoal: Math.max(10, goalsForm.proteinGoal),
        carbsGoal: Math.max(10, goalsForm.carbsGoal),
        fatsGoal: Math.max(5, goalsForm.fatsGoal)
      });
      showSaveNotification('Goals updated!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    if (!authUser) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: authUser.id,
          profile_visible: privacySettings.profileVisible,
          show_workouts: privacySettings.showWorkouts,
          show_meals: privacySettings.showMeals,
          show_stats: privacySettings.showStats,
          allow_friend_requests: privacySettings.allowFriendRequests
        });

      if (error) throw error;
      showSaveNotification('Privacy settings saved!');
    } catch (err) {
      console.error('Error saving privacy settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    updateSettings({ notificationsEnabled: notificationSettings.pushEnabled });
    showSaveNotification('Notification preferences saved!');
  };

  const handleAddExercise = () => {
    if (newExercise.trim() && !settings.exerciseList.includes(newExercise.trim())) {
      updateSettings({
        exerciseList: [...settings.exerciseList, newExercise.trim()]
      });
      setNewExercise('');
      showSaveNotification('Exercise added!');
    }
  };

  const handleRemoveExercise = (exercise: string) => {
    updateSettings({
      exerciseList: settings.exerciseList.filter(e => e !== exercise)
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    resetAllData();
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'notifications', label: 'Notif', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'account', label: 'Account', icon: Lock }
  ];

  return (
    <SafeAreaView className="flex-1 bg-black">
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            {/* Header */}
            <View className="flex-row items-center gap-4 p-6 border-b border-zinc-800">
                <TouchableOpacity
                onPress={() => router.back()}
                className="p-2 bg-zinc-900 rounded-full"
                >
                <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-white">Settings</Text>
            </View>

            {/* Tabs */}
            <View className="border-b border-zinc-800">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {tabs.map(tab => (
                    <TouchableOpacity
                        key={tab.id}
                        onPress={() => setActiveTab(tab.id as any)}
                        className={`flex-row items-center gap-2 px-6 py-4 transition-colors ${
                        activeTab === tab.id ? 'border-b-2 border-green-500' : ''
                        }`}
                    >
                        <tab.icon size={16} color={activeTab === tab.id ? '#22c55e' : '#71717a'} />
                        <Text className={`font-medium ${activeTab === tab.id ? 'text-green-500' : 'text-zinc-400'}`}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView className="flex-1 p-6">
                {activeTab === 'profile' && (
                <View className="gap-6 pb-20">
                    {/* Avatar */}
                    <View className="items-center">
                    <View className="relative">
                        {user.avatar ? (
                        <Image
                            source={{ uri: user.avatar }}
                            className="w-24 h-24 rounded-full border-2 border-green-500"
                        />
                        ) : (
                        <View className="w-24 h-24 rounded-full bg-zinc-800 items-center justify-center border-2 border-zinc-700">
                            <User size={40} color="#71717a" />
                        </View>
                        )}
                        <TouchableOpacity
                        onPress={() => setShowImageUpload(true)}
                        className="absolute bottom-0 right-0 p-2 bg-green-500 rounded-full"
                        >
                        <Camera size={16} color="black" />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowImageUpload(true)}
                        className="mt-3"
                    >
                        <Text className="text-sm text-green-500">Change Avatar</Text>
                    </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View className="gap-4">
                    <View>
                        <Text className="text-zinc-400 text-sm mb-2">Display Name</Text>
                        <TextInput
                        value={profileForm.name}
                        onChangeText={(text) => setProfileForm({ ...profileForm, name: text })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white font-bold"
                        placeholder="Enter your name"
                        placeholderTextColor="#3f3f46"
                        />
                    </View>

                    <View>
                        <Text className="text-zinc-400 text-sm mb-2">Email</Text>
                        <TextInput
                        value={profileForm.email}
                        onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white font-bold"
                        placeholder="Enter your email"
                        placeholderTextColor="#3f3f46"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        />
                    </View>

                    {/* Stats Card */}
                    <View className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800">
                        <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="font-bold text-white">Current Level</Text>
                            <Text className="text-zinc-400 text-sm mt-1">Level {user.level} • {user.xp.toLocaleString()} XP</Text>
                        </View>
                        <Text className="text-4xl font-black text-green-500">{user.level}</Text>
                        </View>
                    </View>

                    {/* Coach Application */}
                    {!isCoach && (
                        <View className="p-5 bg-green-500/10 border border-green-500/20 rounded-2xl">
                        <View className="flex-row gap-3">
                            <Crown size={24} color="#22c55e" />
                            <View className="flex-1">
                            <Text className="font-bold text-white">Become a Coach</Text>
                            <Text className="text-sm text-zinc-400 mt-1">
                                Share your expertise and create workout plans for the community
                            </Text>
                            <TouchableOpacity
                                className="mt-4 bg-green-500 py-3 rounded-xl items-center"
                                onPress={() => router.push('/coach/signup')}
                            >
                                <Text className="text-black font-bold">Apply Now</Text>
                            </TouchableOpacity>
                            </View>
                        </View>
                        </View>
                    )}

                    <TouchableOpacity
                        className="bg-green-500 py-5 rounded-2xl flex-row items-center justify-center gap-2"
                        onPress={handleSaveProfile}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 size={20} color="black" /> : <Save size={20} color="black" />}
                        <Text className="text-black font-bold uppercase tracking-widest">Save Profile</Text>
                    </TouchableOpacity>
                    </View>
                </View>
                )}

                {activeTab === 'goals' && (
                <View className="gap-8 pb-20">
                    <ForgeSlider
                        label="Daily Calories"
                        value={goalsForm.caloriesGoal}
                        onChange={(v) => setGoalsForm({ ...goalsForm, caloriesGoal: v })}
                        min={1000}
                        max={5000}
                        step={50}
                        color="green"
                    />

                    <ForgeSlider
                        label="Protein Goal"
                        value={goalsForm.proteinGoal}
                        onChange={(v) => setGoalsForm({ ...goalsForm, proteinGoal: v })}
                        min={20}
                        max={300}
                        step={5}
                        color="blue"
                    />

                    <ForgeSlider
                        label="Carbs Goal"
                        value={goalsForm.carbsGoal}
                        onChange={(v) => setGoalsForm({ ...goalsForm, carbsGoal: v })}
                        min={50}
                        max={500}
                        step={5}
                    />

                    <ForgeSlider
                        label="Fats Goal"
                        value={goalsForm.fatsGoal}
                        onChange={(v) => setGoalsForm({ ...goalsForm, fatsGoal: v })}
                        min={10}
                        max={150}
                        step={5}
                        color="red"
                    />

                    <TouchableOpacity
                        className="bg-green-500 py-5 rounded-2xl flex-row items-center justify-center gap-2 mt-4"
                        onPress={handleSaveGoals}
                        disabled={isSaving}
                    >
                        {isSaving ? <Loader2 size={20} color="black" /> : <Save size={20} color="black" />}
                        <Text className="text-black font-bold uppercase tracking-widest">Update Goals</Text>
                    </TouchableOpacity>
                </View>
                )}

                {activeTab === 'exercises' && (
                <View className="gap-6 pb-20">
                    <View className="flex-row gap-2">
                    <TextInput
                        value={newExercise}
                        onChangeText={setNewExercise}
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 text-white font-bold"
                        placeholder="Add new exercise..."
                        placeholderTextColor="#3f3f46"
                    />
                    <TouchableOpacity
                        onPress={handleAddExercise}
                        disabled={!newExercise.trim()}
                        className="bg-green-500 px-6 rounded-xl items-center justify-center disabled:opacity-50"
                    >
                        <Plus size={24} color="black" />
                    </TouchableOpacity>
                    </View>

                    <View className="gap-2">
                    {settings.exerciseList.map((exercise) => (
                        <View
                        key={exercise}
                        className="flex-row items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800"
                        >
                        <Text className="text-white font-bold">{exercise}</Text>
                        <TouchableOpacity
                            onPress={() => handleRemoveExercise(exercise)}
                            className="p-2"
                        >
                            <X size={18} color="#71717a" />
                        </TouchableOpacity>
                        </View>
                    ))}
                    </View>
                </View>
                )}

                {activeTab === 'notifications' && (
                <View className="gap-4 pb-20">
                    <View className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800">
                    <ForgeToggle
                        checked={notificationSettings.pushEnabled}
                        onChange={(checked) => setNotificationSettings({ ...notificationSettings, pushEnabled: checked })}
                        label="Push Notifications"
                        description="Enable push notifications on your device"
                    />
                    </View>

                    <View className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800 gap-6">
                    <Text className="font-bold text-white text-base">Notification Types</Text>

                    <ForgeToggle
                        checked={notificationSettings.workoutReminders}
                        onChange={(checked) => setNotificationSettings({ ...notificationSettings, workoutReminders: checked })}
                        label="Workout Reminders"
                        description="Daily reminders to complete your workout"
                    />

                    <View className="border-t border-zinc-800 pt-6">
                        <ForgeToggle
                        checked={notificationSettings.mealReminders}
                        onChange={(checked) => setNotificationSettings({ ...notificationSettings, mealReminders: checked })}
                        label="Meal Logging"
                        description="Reminders to log your meals"
                        />
                    </View>

                    <View className="border-t border-zinc-800 pt-6">
                        <ForgeToggle
                        checked={notificationSettings.friendActivity}
                        onChange={(checked) => setNotificationSettings({ ...notificationSettings, friendActivity: checked })}
                        label="Friend Activity"
                        description="Updates about your friends' workouts"
                        />
                    </View>
                    </View>

                    <TouchableOpacity
                    className="bg-green-500 py-5 rounded-2xl flex-row items-center justify-center gap-2"
                    onPress={handleSaveNotifications}
                    >
                    <Save size={20} color="black" />
                    <Text className="text-black font-bold uppercase tracking-widest">Save Preferences</Text>
                    </TouchableOpacity>
                </View>
                )}

                {activeTab === 'privacy' && (
                <View className="gap-4 pb-20">
                    <View className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800 gap-6">
                    <Text className="font-bold text-white text-base">Profile Visibility</Text>

                    <ForgeToggle
                        checked={privacySettings.profileVisible}
                        onChange={(checked) => setPrivacySettings({ ...privacySettings, profileVisible: checked })}
                        label="Public Profile"
                        description="Allow others to find and view your profile"
                    />

                    <View className="border-t border-zinc-800 pt-6">
                        <ForgeToggle
                        checked={privacySettings.allowFriendRequests}
                        onChange={(checked) => setPrivacySettings({ ...privacySettings, allowFriendRequests: checked })}
                        label="Allow Friend Requests"
                        description="Let others send you friend requests"
                        />
                    </View>
                    </View>

                    <TouchableOpacity
                    className="bg-green-500 py-5 rounded-2xl flex-row items-center justify-center gap-2"
                    onPress={handleSavePrivacy}
                    disabled={isSaving}
                    >
                        {isSaving ? <Loader2 size={20} color="black" /> : <Save size={20} color="black" />}
                        <Text className="text-black font-bold uppercase tracking-widest">Save Privacy Settings</Text>
                    </TouchableOpacity>
                </View>
                )}

                {activeTab === 'account' && (
                <View className="gap-4 pb-20">
                    {/* Sign Out */}
                    <View className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800">
                    <View className="flex-row gap-4">
                        <LogOut size={24} color="#eab308" />
                        <View className="flex-1">
                        <Text className="font-bold text-white text-base">Sign Out</Text>
                        <Text className="text-sm text-zinc-400 mt-1">
                            Sign out of your account on this device
                        </Text>
                        <TouchableOpacity
                            className="mt-4 bg-zinc-800 py-3 rounded-xl items-center border border-zinc-700"
                            onPress={handleSignOut}
                        >
                            <Text className="text-white font-bold">Sign Out</Text>
                        </TouchableOpacity>
                        </View>
                    </View>
                    </View>

                    {/* Delete Account */}
                    <View className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20">
                    <View className="flex-row gap-4">
                        <AlertTriangle size={24} color="#ef4444" />
                        <View className="flex-1">
                        <Text className="font-bold text-red-500 text-base">Delete Account</Text>
                        <Text className="text-sm text-zinc-400 mt-1">
                            Permanently delete your account and all data. This cannot be undone.
                        </Text>
                        <TouchableOpacity
                            className="mt-4 bg-red-500 py-3 rounded-xl items-center"
                            onPress={() => setShowDeleteConfirm(true)}
                        >
                            <Text className="text-white font-bold">Delete Account</Text>
                        </TouchableOpacity>
                        </View>
                    </View>
                    </View>
                </View>
                )}
            </ScrollView>

            {showImageUpload && (
                <ImageUpload
                onImageUploaded={(url) => {
                    updateUser({ avatar: url });
                    setShowImageUpload(false);
                }}
                onCancel={() => setShowImageUpload(false)}
                bucket="avatars"
                folder="profiles"
                />
            )}

            {/* Delete Confirmation Modal */}
            <Modal visible={showDeleteConfirm} transparent animationType="fade">
                <View className="flex-1 bg-black/80 items-center justify-center p-6">
                    <View className="bg-zinc-900 rounded-3xl p-6 max-w-sm w-full border border-zinc-800">
                        <View className="flex-row items-center gap-3 mb-4">
                            <AlertTriangle size={24} color="#f87171" />
                            <Text className="text-lg font-bold text-white">Delete Account?</Text>
                        </View>
                        <Text className="text-zinc-400 mb-6">
                            This will permanently delete all your progress, data, and account.
                            Type <Text className="text-white font-bold">DELETE</Text> to confirm.
                        </Text>
                        <TextInput
                            value={deleteConfirmText}
                            onChangeText={setDeleteConfirmText}
                            placeholder="Type DELETE"
                            placeholderTextColor="#3f3f46"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-4 text-white font-bold mb-6"
                            autoCapitalize="characters"
                        />
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => {
                                setShowDeleteConfirm(false);
                                setDeleteConfirmText('');
                                }}
                                className="flex-1 py-4 bg-zinc-800 rounded-xl items-center"
                            >
                                <Text className="text-white font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE'}
                                className={`flex-1 py-4 bg-red-500 rounded-xl items-center ${deleteConfirmText !== 'DELETE' ? 'opacity-50' : ''}`}
                            >
                                <Text className="text-white font-bold">Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SettingsPage;
