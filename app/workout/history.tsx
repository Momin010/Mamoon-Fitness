
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Clock, Trophy, Trash2, Dumbbell } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';

const WorkoutHistoryPage: React.FC = () => {
  const router = useRouter();
  const { workoutHistory, deleteWorkoutSession } = useApp();

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const totalStats = workoutHistory.reduce((acc, session) => ({
    workouts: acc.workouts + 1,
    duration: acc.duration + session.duration,
    xp: acc.xp + session.totalXp,
    exercises: acc.exercises + session.exercises.length
  }), { workouts: 0, duration: 0, xp: 0, exercises: 0 });

  return (
    <SafeAreaView className="flex-1 bg-black">
      <header className="flex-row items-center gap-4 p-6 border-b border-zinc-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-zinc-900 rounded-full">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Workout History</Text>
      </header>

      <ScrollView className="flex-1">
        <View className="p-6 border-b border-zinc-800">
            <View className="flex-row flex-wrap gap-4">
            <View className="flex-1 min-w-[40%] p-4 bg-zinc-900 rounded-2xl items-center border border-zinc-800">
                <Text className="text-3xl font-black text-green-500">{totalStats.workouts}</Text>
                <Text className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Workouts</Text>
            </View>
            <View className="flex-1 min-w-[40%] p-4 bg-zinc-900 rounded-2xl items-center border border-zinc-800">
                <Text className="text-3xl font-black text-blue-500">{Math.round(totalStats.duration / 60)}h</Text>
                <Text className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Time</Text>
            </View>
            <View className="flex-1 min-w-[40%] p-4 bg-zinc-900 rounded-2xl items-center border border-zinc-800">
                <Text className="text-3xl font-black text-yellow-500">{totalStats.xp.toLocaleString()}</Text>
                <Text className="text-xs text-zinc-500 uppercase tracking-wider mt-1">XP Earned</Text>
            </View>
            <View className="flex-1 min-w-[40%] p-4 bg-zinc-900 rounded-2xl items-center border border-zinc-800">
                <Text className="text-3xl font-black text-purple-500">{totalStats.exercises}</Text>
                <Text className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Exercises</Text>
            </View>
            </View>
        </View>

        <View className="p-6 pb-32">
            {workoutHistory.length === 0 ? (
            <View className="items-center py-12">
                <Dumbbell size={48} color="#52525b" className="mb-4" />
                <Text className="text-zinc-500 text-lg">No workouts logged yet</Text>
                <TouchableOpacity onPress={() => router.push('/workout')}>
                <Text className="mt-4 text-green-500 font-bold">Start a workout</Text>
                </TouchableOpacity>
            </View>
            ) : (
            <View className="gap-4">
                {workoutHistory.map(session => (
                <View key={session.id} className="p-5 bg-zinc-900 rounded-3xl border border-zinc-800">
                    <View className="flex-row items-start justify-between mb-4">
                        <View className="flex-row items-center gap-3">
                            <View className="p-2 bg-green-500/20 rounded-xl">
                            <Trophy size={20} color="#22c55e" />
                            </View>
                            <View>
                            <Text className="font-bold text-white">Workout #{session.id.slice(-4)}</Text>
                            <View className="flex-row items-center gap-2 mt-1">
                                <Calendar size={12} color="#71717a" />
                                <Text className="text-xs text-zinc-500">{formatDate(session.date)}</Text>
                            </View>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => deleteWorkoutSession(session.id)}
                            className="p-2"
                        >
                            <Trash2 size={16} color="#3f3f46" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center gap-4 mb-4">
                        <View className="flex-row items-center gap-1">
                            <Clock size={14} color="#a1a1aa" />
                            <Text className="text-sm text-zinc-400">{formatDuration(session.duration)}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                            <Trophy size={14} color="#eab308" />
                            <Text className="text-sm text-yellow-500">+{session.totalXp} XP</Text>
                        </View>
                    </View>

                    <View className="gap-1">
                        {session.exercises.map((exercise, idx) => (
                            <View key={idx} className="flex-row items-center justify-between py-2 border-t border-zinc-800">
                            <Text className="text-zinc-300 text-xs font-medium">{exercise.name}</Text>
                            <Text className="text-zinc-500 text-[10px] font-bold">
                                {exercise.completedSets}/{exercise.sets} × {exercise.reps}
                                {exercise.weight && ` @ ${exercise.weight}lbs`}
                            </Text>
                            </View>
                        ))}
                    </View>

                    {session.notes && (
                    <Text className="mt-3 text-xs text-zinc-500 italic">"{session.notes}"</Text>
                    )}
                </View>
                ))}
            </View>
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutHistoryPage;
