
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, MoreHorizontal, History, Plus, Trash2, Check, Timer, LayoutTemplate, Dumbbell } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { Exercise } from '../../types';
import { RestTimer, ExerciseTemplates, ForgeDropdown, ForgeSlider } from '../../components';

const WorkoutPage: React.FC = () => {
  const router = useRouter();
  const {
    settings,
    addExercise,
    exercises,
    completeExerciseSet,
    deleteExercise,
    resetExercises,
    saveWorkoutSession,
    triggerAutoSave,
  } = useApp();

  const [isActive, setIsActive] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState(3);
  const [newExerciseReps, setNewExerciseReps] = useState(10);
  const [newExerciseWeight, setNewExerciseWeight] = useState('');
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: any;
    if (isActive && workoutStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, workoutStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartWorkout = () => {
    setIsActive(true);
    setWorkoutStartTime(Date.now());
    resetExercises();
  };

  const handleFinishWorkout = async () => {
    if (!workoutStartTime) return;

    setIsFinishing(true);
    try {
      const duration = Math.floor((Date.now() - workoutStartTime) / 60000);
      const completedExercises = exercises.filter(e => e.completedSets === e.sets);
      const totalXp = completedExercises.length * 25 + (completedExercises.length > 0 ? 50 : 0);

      await saveWorkoutSession({
        exercises: [...exercises],
        duration,
        totalXp,
        notes: ''
      });

      await triggerAutoSave();

      setIsActive(false);
      setWorkoutStartTime(null);
      setElapsedTime(0);
      resetExercises();

      router.push('/workout/history');
    } catch (error) {
      console.error('Failed to finish workout:', error);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleAddExercise = () => {
    if (newExerciseName.trim()) {
      addExercise({
        name: newExerciseName.trim(),
        sets: newExerciseSets,
        reps: newExerciseReps,
        completedSets: 0,
        weight: newExerciseWeight ? parseInt(newExerciseWeight) : undefined
      });
      setNewExerciseName('');
      setNewExerciseSets(3);
      setNewExerciseReps(10);
      setNewExerciseWeight('');
      setShowAddExercise(false);
    }
  };

  const handleApplyTemplate = (templateExercises: Omit<Exercise, 'id' | 'completedSets'>[]) => {
    templateExercises.forEach(ex => {
      addExercise({
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        completedSets: 0,
        weight: ex.weight
      });
    });
  };

  const handleCompleteSet = () => {
    if (currentExercise) {
      completeExerciseSet(currentExercise.id);
      const updated = exercises.find(e => e.id === currentExercise.id);
      if (updated) setCurrentExercise(updated);
    }
  };

  const handleFinishExercise = () => {
    setCurrentExercise(null);
  };

  const allExercisesCompleted = exercises.length > 0 && exercises.every(e => e.completedSets === e.sets);
  const completedCount = exercises.filter(e => e.completedSets === e.sets).length;

  useEffect(() => {
    if (!isActive) handleStartWorkout();
  }, []);

  if (currentExercise) {
    const isComplete = currentExercise.completedSets === currentExercise.sets;

    return (
      <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 p-6 pb-32">
            <View className="flex-row justify-between items-center mb-8">
            <TouchableOpacity
                onPress={() => setCurrentExercise(null)}
                className="p-2 bg-zinc-900 rounded-full"
            >
                <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
            <View className="items-center">
                <Text className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Active Exercise</Text>
            </View>
            <TouchableOpacity className="p-2 bg-zinc-900 rounded-full">
                <MoreHorizontal size={24} color="white" />
            </TouchableOpacity>
            </View>

            <Text className="text-3xl font-black uppercase mb-2 italic text-white">{currentExercise.name}</Text>
            {currentExercise.weight && (
            <Text className="text-zinc-400 mb-8 font-bold">{currentExercise.weight} lbs</Text>
            )}

            <ScrollView className="space-y-3 mb-8">
            {Array.from({ length: currentExercise.sets }, (_, i) => i + 1).map((set) => {
                const isCompleted = set <= currentExercise.completedSets;
                return (
                <View
                    key={set}
                    className={`flex-row justify-between items-center p-4 rounded-2xl border mb-3 ${isCompleted
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-zinc-900 border-zinc-800'
                    }`}
                >
                    <View className="flex-row items-center gap-3">
                    <View className={`w-8 h-8 rounded-lg items-center justify-center ${isCompleted ? 'bg-green-500' : 'bg-zinc-800'
                        }`}>
                        {isCompleted ? <Check size={16} color="black" strokeWidth={3} /> : <Text className="text-xs font-bold text-white">{set}</Text>}
                    </View>
                    <Text className={`text-xs font-black uppercase tracking-wider ${isCompleted ? 'text-green-500' : 'text-zinc-500'
                        }`}>
                        Set {set}
                    </Text>
                    </View>
                    <Text className={`text-sm font-black ${isCompleted ? 'text-green-500' : 'text-zinc-600'}`}>
                    {currentExercise.reps} REPS
                    </Text>
                </View>
                );
            })}
            </ScrollView>

            <View className="mt-auto gap-3">
            {!isComplete ? (
                <>
                <TouchableOpacity
                    onPress={handleCompleteSet}
                    className="w-full bg-green-500 py-5 rounded-2xl items-center shadow-lg shadow-green-500/20"
                >
                    <Text className="text-black text-lg font-black uppercase tracking-wider">Log Set (+10 XP)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setShowRestTimer(true)}
                    className="w-full bg-zinc-900 py-4 rounded-2xl flex-row items-center justify-center gap-2 border border-zinc-800"
                >
                    <Timer size={20} color="white" />
                    <Text className="text-white font-bold">Rest Timer</Text>
                </TouchableOpacity>
                </>
            ) : (
                <TouchableOpacity
                onPress={handleFinishExercise}
                className="w-full bg-white py-5 rounded-2xl items-center"
                >
                <Text className="text-black text-lg font-black uppercase tracking-wider">Finish Exercise (+25 XP)</Text>
                </TouchableOpacity>
            )}
            </View>

            <RestTimer
            isOpen={showRestTimer}
            onClose={() => setShowRestTimer(false)}
            defaultDuration={60}
            />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
        <View className="flex-1 p-6 pb-32">
            <View className="flex-row justify-between items-center mb-8">
                <View>
                <Text className="text-4xl font-black uppercase tracking-tighter italic text-white">Workout</Text>
                <View className="flex-row items-center gap-2 mt-1">
                    <View className="w-2 h-2 rounded-full bg-green-500" />
                    <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Live Session</Text>
                </View>
                </View>
                <View className="items-end">
                    <Text className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Duration</Text>
                    <Text className="font-bold text-green-500 text-xl">{formatTime(elapsedTime)}</Text>
                </View>
            </View>

            <View className="mb-8">
                <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Session Progress</Text>
                <Text className="text-green-500 font-bold text-xs">{completedCount}/{exercises.length} Exercises</Text>
                </View>
                <View className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <View
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0}%` }}
                />
                </View>
            </View>

            <ScrollView className="flex-1 mb-4">
                {exercises.length === 0 ? (
                <View className="items-center justify-center py-20 opacity-40">
                    <View className="w-20 h-20 bg-zinc-900 rounded-[2rem] items-center justify-center mb-6">
                    <Dumbbell size={32} color="#52525b" />
                    </View>
                    <Text className="text-white text-lg font-bold mb-1">Empty Forge</Text>
                    <Text className="text-xs text-zinc-500 text-center max-w-[200px]">Add exercises or use a template to begin your session.</Text>
                </View>
                ) : (
                exercises.map((ex) => {
                    const isComplete = ex.completedSets === ex.sets;
                    return (
                    <TouchableOpacity
                        key={ex.id}
                        onPress={() => !isComplete && setCurrentExercise(ex)}
                        className={`p-5 rounded-3xl border mb-3 ${isComplete
                        ? 'bg-green-500/5 border-green-500/20 opacity-40'
                        : 'bg-zinc-900 border-zinc-800'
                        }`}
                    >
                        <View className="flex-row justify-between items-center">
                            <View className="flex-1">
                                <Text className={`font-black uppercase tracking-tight ${isComplete ? 'text-green-500' : 'text-white'}`}>{ex.name}</Text>
                                <View className="flex-row items-center gap-3 mt-1">
                                <Text className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                    {ex.sets} Sets × {ex.reps} Reps
                                </Text>
                                {ex.weight && <View className="w-1 h-1 rounded-full bg-zinc-800" />}
                                {ex.weight && (
                                    <Text className="text-[10px] font-bold text-green-500/70 uppercase tracking-widest">
                                    {ex.weight} LBS
                                    </Text>
                                )}
                                </View>
                            </View>
                            <View className="flex-row items-center gap-4">
                                <Text className={`text-xs font-black ${isComplete ? 'text-green-500' : 'text-zinc-700'}`}>
                                    {ex.completedSets}/{ex.sets}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => deleteExercise(ex.id)}
                                    className="p-2"
                                >
                                    <Trash2 size={16} color="#3f3f46" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                    );
                })
                )}
            </ScrollView>

            <View className="gap-3">
                {showAddExercise && (
                <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-4 gap-4">
                    <Text className="text-xs font-black uppercase tracking-widest text-zinc-500">Pick Your Poison</Text>
                    <ForgeDropdown
                    options={settings.exerciseList.map(ex => ({ value: ex, label: ex }))}
                    value={newExerciseName}
                    onChange={setNewExerciseName}
                    placeholder="Search exercise..."
                    searchable
                    />
                    <View className="gap-6 pt-2">
                    <ForgeSlider
                        label="Target Sets"
                        value={newExerciseSets}
                        onChange={setNewExerciseSets}
                        min={1}
                        max={10}
                    />
                    <ForgeSlider
                        label="Target Reps"
                        value={newExerciseReps}
                        onChange={setNewExerciseReps}
                        min={1}
                        max={50}
                        color="blue"
                    />
                    </View>
                    <View className="flex-row gap-3 pt-2">
                    <TouchableOpacity
                        onPress={() => setShowAddExercise(false)}
                        className="flex-1 py-4 bg-zinc-800 rounded-2xl items-center"
                    >
                        <Text className="text-zinc-400 font-black text-[10px] uppercase tracking-widest">Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleAddExercise}
                        disabled={!newExerciseName}
                        className="flex-1 py-4 bg-green-500 rounded-2xl items-center disabled:opacity-50"
                    >
                        <Text className="text-black font-black text-[10px] uppercase tracking-widest">Add To Set</Text>
                    </TouchableOpacity>
                    </View>
                </View>
                )}

                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => setShowTemplates(true)}
                        className="flex-1 flex-row items-center justify-center gap-2 py-4 bg-zinc-900 text-zinc-400 rounded-2xl border border-zinc-800"
                    >
                        <LayoutTemplate size={16} color="#a1a1aa" />
                        <Text className="text-zinc-400 font-bold text-xs uppercase tracking-widest">Template</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setShowAddExercise(true)}
                        className="flex-1 flex-row items-center justify-center gap-2 py-4 bg-zinc-900 rounded-2xl border border-green-500/20"
                    >
                        <Plus size={16} color="#22c55e" />
                        <Text className="text-green-500 font-bold text-xs uppercase tracking-widest">Add Move</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-row gap-3">
                <TouchableOpacity
                    onPress={() => router.push('/workout/history')}
                    className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800"
                >
                    <History size={20} color="#a1a1aa" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setShowRestTimer(true)}
                    className="p-5 bg-zinc-900 rounded-2xl border border-zinc-800"
                >
                    <Timer size={20} color="#a1a1aa" />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={allExercisesCompleted ? handleFinishWorkout : undefined}
                    disabled={isFinishing}
                    className={`flex-1 py-5 rounded-2xl items-center justify-center ${allExercisesCompleted
                    ? 'bg-white'
                    : 'bg-zinc-900 border border-zinc-800'
                    } ${isFinishing ? 'opacity-50' : ''}`}
                >
                    {isFinishing ? (
                        <ActivityIndicator color="black" size="small" />
                    ) : (
                        <Text className={`text-xs font-black uppercase tracking-widest ${allExercisesCompleted ? 'text-black' : 'text-zinc-700'}`}>
                            Finish Session
                        </Text>
                    )}
                </TouchableOpacity>
                </View>
            </View>

            <RestTimer
                isOpen={showRestTimer}
                onClose={() => setShowRestTimer(false)}
                defaultDuration={60}
            />

            <ExerciseTemplates
                isOpen={showTemplates}
                onClose={() => setShowTemplates(false)}
                onSelectTemplate={handleApplyTemplate}
            />
        </View>
    </SafeAreaView>
  );
};

export default WorkoutPage;
