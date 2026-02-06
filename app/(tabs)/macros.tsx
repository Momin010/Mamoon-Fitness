
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, History, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

const MacrosPage: React.FC = () => {
  const router = useRouter();
  const { user, meals, totalCalories, totalProtein, totalCarbs, totalFats } = useApp();

  const remaining = user.caloriesGoal - totalCalories;
  const isOverCalories = remaining < 0;

  const getProgressColor = (current: number, goal: number) => {
    const ratio = current / goal;
    if (ratio < 0.5) return '#a1a1aa';
    if (ratio < 0.8) return '#facc15';
    if (ratio <= 1) return '#22c55e';
    return '#f87171';
  };

  const getProgressBarColor = (current: number, goal: number) => {
    const ratio = current / goal;
    if (ratio < 0.5) return 'bg-zinc-600';
    if (ratio < 0.8) return 'bg-yellow-500';
    if (ratio <= 1) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatus = () => {
    if (isOverCalories) return { text: 'Over Budget', color: 'text-red-400', icon: TrendingUp, dot: 'bg-red-400' };
    if (remaining < 300) return { text: 'Almost There', color: 'text-yellow-400', icon: TrendingUp, dot: 'bg-yellow-400' };
    if (remaining > 800) return { text: 'On Track', color: 'text-green-500', icon: Minus, dot: 'bg-green-500' };
    return { text: 'Good Progress', color: 'text-green-400', icon: TrendingDown, dot: 'bg-green-400' };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  const macroData = [
    { name: 'Protein', current: totalProtein, goal: user.proteinGoal, unit: 'g', color: 'bg-blue-500', barColor: '#3b82f6' },
    { name: 'Carbs', current: totalCarbs, goal: user.carbsGoal, unit: 'g', color: 'bg-yellow-500', barColor: '#eab308' },
    { name: 'Fats', current: totalFats, goal: user.fatsGoal, unit: 'g', color: 'bg-red-500', barColor: '#ef4444' },
  ];

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <SafeAreaView className="flex-1 bg-black">
        <ScrollView className="flex-1 p-6 pb-32">
            <header className="flex-row justify-between items-center mb-12">
                <TouchableOpacity
                onPress={() => router.push('/macros/history')}
                className="p-3 bg-zinc-900 rounded-full"
                >
                <History size={20} color="white" />
                </TouchableOpacity>
                <Text className="text-zinc-500 uppercase text-xs font-bold tracking-[0.2em]">{today}</Text>
                <TouchableOpacity
                onPress={() => router.push('/settings')}
                className="p-3 bg-zinc-900 rounded-full"
                >
                <Calendar size={20} color="white" />
                </TouchableOpacity>
            </header>

            <View className="items-center mb-12">
                <Text className={`text-[80px] font-black tracking-tighter leading-none mb-2 text-white ${isOverCalories ? 'text-red-500' : ''}`}>
                {Math.abs(remaining).toLocaleString()}
                </Text>
                <Text className="text-zinc-500 uppercase text-xs font-bold tracking-[0.2em] mb-6">
                {isOverCalories ? 'Calories Over' : 'Calories Remaining'}
                </Text>
                <View className="flex-row items-center gap-2">
                <View className={`w-2 h-2 rounded-full ${status.dot}`} />
                <View className="flex-row items-center gap-1">
                    <StatusIcon size={12} color={status.color === 'text-red-400' ? '#f87171' : status.color === 'text-yellow-400' ? '#facc15' : '#22c55e'} />
                    <Text className={`font-bold text-xs uppercase tracking-widest ${status.color === 'text-red-400' ? 'text-red-400' : status.color === 'text-yellow-400' ? 'text-yellow-400' : 'text-green-500'}`}>
                        {status.text}
                    </Text>
                </View>
                </View>
            </View>

            <View className="mb-8">
                <View className="flex-row justify-between items-center mb-2">
                <Text className="text-zinc-400 text-sm">Daily Progress</Text>
                <Text className="text-sm font-bold">
                    <Text style={{ color: getProgressColor(totalCalories, user.caloriesGoal) }}>{totalCalories}</Text>
                    <Text className="text-zinc-500"> / {user.caloriesGoal}</Text>
                </Text>
                </View>
                <View className="h-3 bg-zinc-900 rounded-full overflow-hidden">
                <View
                    className={`h-full rounded-full ${getProgressBarColor(totalCalories, user.caloriesGoal)}`}
                    style={{ width: `${Math.min(100, (totalCalories / user.caloriesGoal) * 100)}%` }}
                />
                </View>
            </View>

            <View className="gap-6 mb-12">
                {macroData.map((macro) => {
                const progress = Math.min(100, (macro.current / macro.goal) * 100);
                const isOver = macro.current > macro.goal;

                return (
                    <View key={macro.name} className="gap-2">
                    <View className="flex-row justify-between items-end">
                        <View className="flex-row items-center gap-2">
                        <View className={`w-3 h-3 rounded-full ${macro.color}`} />
                        <Text className="text-lg font-bold text-white">{macro.name}</Text>
                        </View>
                        <View className="items-end">
                        <Text className="text-right">
                            <Text className={`text-2xl font-black text-white ${isOver ? 'text-red-400' : ''}`}>
                                {macro.current}
                            </Text>
                            <Text className="text-zinc-500 text-sm ml-1">/ {macro.goal}{macro.unit}</Text>
                        </Text>
                        </View>
                    </View>
                    <View className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                        <View
                        className={`h-full rounded-full ${isOver ? 'bg-red-500' : macro.color}`}
                        style={{ width: `${progress}%` }}
                        />
                    </View>
                    </View>
                );
                })}
            </View>

            {meals.length > 0 && (
                <View className="mb-6">
                <Text className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">Today's Meals</Text>
                <View className="gap-2">
                    {meals.slice(0, 5).map((meal) => (
                    <View key={meal.id} className="flex-row justify-between items-center p-4 bg-zinc-900 rounded-xl">
                        <View>
                        <Text className="font-medium text-sm text-white">{meal.name}</Text>
                        {meal.mealType && (
                            <Text className="text-xs text-zinc-500 capitalize">{meal.mealType}</Text>
                        )}
                        </View>
                        <Text className="text-sm font-bold text-white">{meal.calories} cal</Text>
                    </View>
                    ))}
                    {meals.length > 5 && (
                    <TouchableOpacity
                        onPress={() => router.push('/macros/history')}
                        className="w-full py-2 items-center"
                    >
                        <Text className="text-sm text-zinc-500">+ {meals.length - 5} more meals</Text>
                    </TouchableOpacity>
                    )}
                </View>
                </View>
            )}

            <View className="mt-auto pb-20 gap-3">
                <TouchableOpacity
                onPress={() => router.push('/macros/add')}
                className="w-full bg-white py-5 rounded-xl flex-row items-center justify-center gap-2"
                >
                <Plus size={24} color="black" />
                <Text className="text-black font-bold">Add Meal (+50 XP)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                onPress={() => router.push('/macros/history')}
                className="w-full bg-zinc-900 py-4 rounded-xl flex-row items-center justify-center gap-2 border border-zinc-800"
                >
                <History size={20} color="white" />
                <Text className="text-white font-bold">View History</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    </SafeAreaView>
  );
};

export default MacrosPage;
