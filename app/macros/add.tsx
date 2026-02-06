
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, QrCode, Camera, Keyboard, AlertCircle } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

const AddMealPage: React.FC = () => {
  const router = useRouter();
  const { addMeal } = useApp();
  const [view, setView] = useState<'options' | 'manual'>('options');
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    mealType: 'snack' as 'breakfast' | 'lunch' | 'dinner' | 'snack'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Meal name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        if (value.trim().length > 50) return 'Name must be less than 50 characters';
        return '';
      case 'calories':
        if (!value) return 'Calories are required';
        const cal = parseInt(value);
        if (isNaN(cal) || cal < 0) return 'Must be a positive number';
        if (cal > 5000) return 'That seems too high (max 5000)';
        return '';
      case 'protein':
      case 'carbs':
      case 'fats':
        if (value) {
          const num = parseInt(value);
          if (isNaN(num) || num < 0) return 'Must be a positive number';
          if (num > 500) return 'That seems too high (max 500g)';
        }
        return '';
      default:
        return '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    newErrors.name = validateField('name', formData.name);
    newErrors.calories = validateField('calories', formData.calories);
    newErrors.protein = validateField('protein', formData.protein);
    newErrors.carbs = validateField('carbs', formData.carbs);
    newErrors.fats = validateField('fats', formData.fats);

    setErrors(newErrors);
    return !Object.values(newErrors).some(e => e);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field as keyof typeof formData] as string) }));
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleSubmit = () => {
    setTouched({ name: true, calories: true, protein: true, carbs: true, fats: true });

    if (!validateForm()) return;

    addMeal({
      name: formData.name.trim(),
      calories: parseInt(formData.calories),
      protein: parseInt(formData.protein) || 0,
      carbs: parseInt(formData.carbs) || 0,
      fats: parseInt(formData.fats) || 0,
      mealType: formData.mealType
    });
    router.replace('/(tabs)/macros');
  };

  if (view === 'manual') {
    return (
      <SafeAreaView className="flex-1 bg-black">
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <header className="flex-row items-center gap-4 p-6">
                <TouchableOpacity onPress={() => setView('options')} className="p-2 bg-zinc-900 rounded-full">
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-white">Log Meal</Text>
            </header>

            <ScrollView className="flex-1 p-6">
                <View className="gap-8 pb-32">
                    <View>
                        <Text className="text-zinc-500 text-sm font-black uppercase tracking-widest mb-4">Meal Type</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map(type => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setFormData(prev => ({ ...prev, mealType: type }))}
                                    className={`flex-1 py-4 rounded-xl items-center capitalize ${
                                        formData.mealType === type
                                        ? 'bg-green-500'
                                        : 'bg-zinc-900'
                                    }`}
                                >
                                    <Text className={`font-bold capitalize ${formData.mealType === type ? 'text-black' : 'text-zinc-400'}`}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View>
                        <Text className="text-zinc-500 text-sm font-black uppercase tracking-widest mb-2">Meal Name *</Text>
                        <TextInput
                            placeholder="e.g., Chicken Salad"
                            placeholderTextColor="#3f3f46"
                            className={`bg-black border-b-2 py-4 text-xl text-white font-bold ${
                                errors.name && touched.name ? 'border-red-500' : 'border-zinc-800'
                            }`}
                            value={formData.name}
                            onChangeText={v => handleChange('name', v)}
                            onBlur={() => handleBlur('name')}
                        />
                        {errors.name && touched.name && (
                            <View className="flex-row items-center gap-1 mt-2">
                                <AlertCircle size={14} color="#f87171" />
                                <Text className="text-red-400 text-xs">{errors.name}</Text>
                            </View>
                        )}
                    </View>

                    <View>
                        <Text className="text-zinc-500 text-sm font-black uppercase tracking-widest mb-2">Calories *</Text>
                        <TextInput
                            placeholder="0 kcal"
                            placeholderTextColor="#3f3f46"
                            className={`bg-black border-b-2 py-4 text-xl text-white font-bold ${
                                errors.calories && touched.calories ? 'border-red-500' : 'border-zinc-800'
                            }`}
                            value={formData.calories}
                            onChangeText={v => handleChange('calories', v)}
                            onBlur={() => handleBlur('calories')}
                            keyboardType="numeric"
                        />
                        {errors.calories && touched.calories && (
                            <View className="flex-row items-center gap-1 mt-2">
                                <AlertCircle size={14} color="#f87171" />
                                <Text className="text-red-400 text-xs">{errors.calories}</Text>
                            </View>
                        )}
                    </View>

                    <View>
                        <Text className="text-zinc-500 text-sm font-black uppercase tracking-widest mb-4">Macros (optional)</Text>
                        <View className="flex-row gap-4">
                            <View className="flex-1">
                                <Text className="text-zinc-600 text-xs mb-2 uppercase font-bold">Protein (g)</Text>
                                <TextInput
                                    placeholder="0"
                                    placeholderTextColor="#3f3f46"
                                    className={`bg-zinc-900 rounded-xl px-4 py-4 text-lg text-white font-bold border ${
                                        errors.protein && touched.protein ? 'border-red-500' : 'border-zinc-800'
                                    }`}
                                    value={formData.protein}
                                    onChangeText={v => handleChange('protein', v)}
                                    onBlur={() => handleBlur('protein')}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-zinc-600 text-xs mb-2 uppercase font-bold">Carbs (g)</Text>
                                <TextInput
                                    placeholder="0"
                                    placeholderTextColor="#3f3f46"
                                    className={`bg-zinc-900 rounded-xl px-4 py-4 text-lg text-white font-bold border ${
                                        errors.carbs && touched.carbs ? 'border-red-500' : 'border-zinc-800'
                                    }`}
                                    value={formData.carbs}
                                    onChangeText={v => handleChange('carbs', v)}
                                    onBlur={() => handleBlur('carbs')}
                                    keyboardType="numeric"
                                />
                            </View>
                            <View className="flex-1">
                                <Text className="text-zinc-600 text-xs mb-2 uppercase font-bold">Fats (g)</Text>
                                <TextInput
                                    placeholder="0"
                                    placeholderTextColor="#3f3f46"
                                    className={`bg-zinc-900 rounded-xl px-4 py-4 text-lg text-white font-bold border ${
                                        errors.fats && touched.fats ? 'border-red-500' : 'border-zinc-800'
                                    }`}
                                    value={formData.fats}
                                    onChangeText={v => handleChange('fats', v)}
                                    onBlur={() => handleBlur('fats')}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        className="w-full bg-green-500 py-5 rounded-2xl items-center shadow-lg shadow-green-500/20"
                    >
                        <Text className="text-black font-black uppercase tracking-widest">Save Meal (+50 XP)</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <header className="flex-row items-center gap-4 p-6">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">Add Meal</Text>
      </header>

      <View className="flex-1 p-6 gap-6">
        <TouchableOpacity
          onPress={() => setView('manual')}
          className="w-full p-8 bg-zinc-900 rounded-[2rem] border border-zinc-800"
        >
          <View className="flex-row items-center gap-6">
            <View className="p-4 bg-green-500/20 rounded-2xl">
              <Keyboard size={32} color="#22c55e" />
            </View>
            <View>
              <Text className="font-black text-white text-xl uppercase italic">Manual Entry</Text>
              <Text className="text-zinc-500 text-sm mt-1">Enter nutrition details</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View
          className="w-full p-8 bg-zinc-900/50 rounded-[2rem] opacity-50 border border-zinc-800"
        >
          <View className="flex-row items-center gap-6">
            <View className="p-4 bg-zinc-800 rounded-2xl">
              <Camera size={32} color="#52525b" />
            </View>
            <View>
              <Text className="font-black text-zinc-500 text-xl uppercase italic">Photo Log</Text>
              <Text className="text-zinc-600 text-sm mt-1">Coming soon</Text>
            </View>
          </View>
        </View>

        <View
          className="w-full p-8 bg-zinc-900/50 rounded-[2rem] opacity-50 border border-zinc-800"
        >
          <View className="flex-row items-center gap-6">
            <View className="p-4 bg-zinc-800 rounded-2xl">
              <QrCode size={32} color="#52525b" />
            </View>
            <View>
              <Text className="font-black text-zinc-500 text-xl uppercase italic">Scan Barcode</Text>
              <Text className="text-zinc-600 text-sm mt-1">Coming soon</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AddMealPage;
