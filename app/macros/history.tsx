
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Trash2, ChevronLeft as ChevronLeftIcon, ChevronRight } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Meal } from '../../types';

const MealHistoryPage: React.FC = () => {
  const router = useRouter();
  const { allMeals, deleteMeal, user } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const mealsByDate = useMemo(() => {
    const grouped = new Map<string, Meal[]>();
    allMeals.forEach(meal => {
      const date = new Date(meal.timestamp).toDateString();
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(meal);
    });
    return grouped;
  }, [allMeals]);

  const selectedDateMeals = useMemo(() => {
    return mealsByDate.get(selectedDate.toDateString()) || [];
  }, [mealsByDate, selectedDate]);

  const selectedDateStats = useMemo(() => {
    return selectedDateMeals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
  }, [selectedDateMeals]);

  const sortedDates = useMemo(() => {
    return Array.from(mealsByDate.keys()).sort((a, b) =>
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [mealsByDate]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getMealTypeIcon = (type?: string) => {
    switch (type) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      case 'snack': return '🍿';
      default: return '🍽️';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      <header className="flex-row items-center gap-4 p-6 border-b border-zinc-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Meal History</Text>
      </header>

      <ScrollView className="flex-1">
        <View className="p-6 border-b border-zinc-800">
            <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity
                onPress={() => changeDate(-1)}
                className="p-3 bg-zinc-900 rounded-full"
            >
                <ChevronLeftIcon size={20} color="white" />
            </TouchableOpacity>
            <View className="flex-row items-center gap-2">
                <Calendar size={18} color="#71717a" />
                <Text className="font-bold text-white text-base">{formatDate(selectedDate)}</Text>
            </View>
            <TouchableOpacity
                onPress={() => changeDate(1)}
                className="p-3 bg-zinc-900 rounded-full"
            >
                <ChevronRight size={20} color="white" />
            </TouchableOpacity>
            </View>

            <View className="flex-row gap-3">
            <View className="flex-1 items-center p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
                <Text className="text-xl font-black text-white">{selectedDateStats.calories}</Text>
                <Text className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Cals</Text>
            </View>
            <View className="flex-1 items-center p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
                <Text className="text-xl font-black text-blue-400">{selectedDateStats.protein}g</Text>
                <Text className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Prot</Text>
            </View>
            <View className="flex-1 items-center p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
                <Text className="text-xl font-black text-yellow-400">{selectedDateStats.carbs}g</Text>
                <Text className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Carb</Text>
            </View>
            <View className="flex-1 items-center p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
                <Text className="text-xl font-black text-red-400">{selectedDateStats.fats}g</Text>
                <Text className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mt-1">Fat</Text>
            </View>
            </View>

            <View className="mt-6 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-xs font-bold text-zinc-400">Goal Progress</Text>
                    <Text className={`text-xs font-black ${
                    selectedDateStats.calories <= user.caloriesGoal ? 'text-green-500' : 'text-red-400'
                    }`}>
                    {Math.round((selectedDateStats.calories / user.caloriesGoal) * 100)}%
                    </Text>
                </View>
                <View className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <View
                    className={`h-full rounded-full ${
                        selectedDateStats.calories <= user.caloriesGoal ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, (selectedDateStats.calories / user.caloriesGoal) * 100)}%` }}
                    />
                </View>
            </View>
        </View>

        <View className="p-6 pb-20">
            {selectedDateMeals.length === 0 ? (
            <View className="items-center py-12">
                <Text className="text-zinc-500 text-lg">No meals logged for this day</Text>
                <TouchableOpacity onPress={() => router.push('/macros/add')}>
                <Text className="mt-4 text-green-500 font-bold">Log a meal</Text>
                </TouchableOpacity>
            </View>
            ) : (
            <View className="gap-3">
                {selectedDateMeals
                .sort((a, b) => b.timestamp - a.timestamp)
                .map(meal => (
                    <View key={meal.id} className="p-5 bg-zinc-900 rounded-3xl border border-zinc-800">
                    <View className="flex-row items-start justify-between">
                        <View className="flex-row items-start gap-4">
                        <Text className="text-3xl">{getMealTypeIcon(meal.mealType)}</Text>
                        <View>
                            <Text className="font-bold text-white text-base">{meal.name}</Text>
                            <Text className="text-xs text-zinc-500 mt-1">
                            {new Date(meal.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                            })}
                            {meal.mealType && ` • ${meal.mealType}`}
                            </Text>
                        </View>
                        </View>
                        <TouchableOpacity
                        onPress={() => deleteMeal(meal.id)}
                        className="p-2"
                        >
                        <Trash2 size={16} color="#3f3f46" />
                        </TouchableOpacity>
                    </View>
                    <View className="mt-4 flex-row gap-4">
                        <Text className="text-zinc-400 text-xs font-bold">{meal.calories} cal</Text>
                        <Text className="text-blue-400 text-xs font-bold">{meal.protein}g P</Text>
                        <Text className="text-yellow-400 text-xs font-bold">{meal.carbs}g C</Text>
                        <Text className="text-red-400 text-xs font-bold">{meal.fats}g F</Text>
                    </View>
                    </View>
                ))}
            </View>
            )}
        </View>
      </ScrollView>

      {sortedDates.length > 0 && (
        <View className="p-6 border-t border-zinc-800 bg-black">
          <Text className="text-xs font-black text-zinc-500 mb-4 uppercase tracking-widest italic">Previous Days</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
            {sortedDates.slice(0, 14).map(dateStr => {
              const date = new Date(dateStr);
              const dayMeals = mealsByDate.get(dateStr) || [];
              const dayCalories = dayMeals.reduce((sum, m) => sum + m.calories, 0);
              const isSelected = dateStr === selectedDate.toDateString();

              return (
                <TouchableOpacity
                  key={dateStr}
                  onPress={() => setSelectedDate(date)}
                  className={`p-4 rounded-2xl items-center min-w-[70px] mr-2 ${
                    isSelected ? 'bg-green-500' : 'bg-zinc-900 border border-zinc-800'
                  }`}
                >
                  <Text className={`text-[10px] uppercase font-black ${isSelected ? 'text-black/70' : 'text-zinc-500'}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text className={`text-xl font-black mt-1 ${isSelected ? 'text-black' : 'text-white'}`}>
                    {date.getDate()}
                  </Text>
                  <Text className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-black/70' : 'text-zinc-600'}`}>
                    {dayCalories}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
};

export default MealHistoryPage;
