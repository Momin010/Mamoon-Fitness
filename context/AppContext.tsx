import type { Task, Meal, Exercise, UserStats, Friend, WorkoutSession } from '../types';
import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from 'react';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { useSupabase } from './SupabaseContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  useProfileSync,
  useTasksSync,
  useMealsSync,
  useWorkoutsSync,
  useFriendsSync,
  useSettingsSync
} from '../hooks/useSupabaseSync';
import { useAutoSave } from '../hooks/useAutoSave';

interface AppState {
    user: UserStats;
    tasks: Task[];
    meals: Meal[];
    exercises: Exercise[];
    friends: Friend[];
    workoutHistory: WorkoutSession[];
    settings: AppSettings;
    isSyncing: boolean;
    lastSync: number | null;
    lastAutoSave: number | null;
}

interface AppSettings {
    exerciseList: string[];
    dailyResetHour: number;
    notificationsEnabled: boolean;
    darkMode: boolean;
}

interface AppContextType extends AppState {
    allMeals: Meal[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFats: number;

    addXp: (amount: number) => Promise<void>;
    updateUser: (updates: Partial<UserStats>) => void;
    resetUser: () => void;
    toggleTask: (id: string) => Promise<void>;
    addTask: (title: string, dueDate?: string, xpReward?: number) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    addMeal: (meal: Omit<Meal, 'id' | 'timestamp'>) => Promise<void>;
    deleteMeal: (id: string) => Promise<void>;
    getMealsByDate: (date: Date) => Meal[];
    addExercise: (exercise: Omit<Exercise, 'id'>) => void;
    updateExercise: (id: string, updates: Partial<Exercise>) => void;
    deleteExercise: (id: string) => void;
    completeExerciseSet: (id: string) => void;
    resetExercises: () => void;
    saveWorkoutSession: (session: Omit<WorkoutSession, 'id' | 'date'>) => Promise<void>;
    getWorkoutHistory: () => WorkoutSession[];
    deleteWorkoutSession: (id: string) => Promise<void>;
    addFriend: (friend: Omit<Friend, 'id'>) => Promise<void>;
    removeFriend: (id: string) => Promise<void>;
    updateFriendXp: (id: string, xp: number) => Promise<void>;
    updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
    resetAllData: () => void;
    syncWithCloud: () => Promise<void>;
    triggerAutoSave: () => Promise<void>;
}

const defaultUser: UserStats = {
    xp: 0,
    level: 1,
    caloriesGoal: 2500,
    proteinGoal: 150,
    carbsGoal: 250,
    fatsGoal: 70,
    name: 'New User',
    rank: 1
};

const defaultSettings: AppSettings = {
    exerciseList: [
        'Bench Press', 'Overhead Press', 'Lat Pulldown', 'Barbell Row', 'Tricep Extensions',
        'Lateral Raises', 'Face Pulls', 'Squat', 'Deadlift', 'Leg Press', 'Bicep Curls',
        'Plank', 'Push-ups', 'Pull-ups'
    ],
    dailyResetHour: 0,
    notificationsEnabled: true,
    darkMode: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user: authUser } = useSupabase();
    const isCloudEnabled = isSupabaseConfigured() && !!authUser;

    const { fetchProfile, updateProfile } = useProfileSync();
    const { fetchTasks, createTask, updateTask: updateTaskDb, deleteTask: deleteTaskDb } = useTasksSync();
    const { fetchMeals, createMeal, deleteMeal: deleteMealDb } = useMealsSync();
    const { fetchWorkouts, createWorkout, deleteWorkout: deleteWorkoutDb } = useWorkoutsSync();
    const { fetchFriends, createFriend, updateFriend: updateFriendDb, deleteFriend: deleteFriendDb } = useFriendsSync();
    const { fetchSettings, updateSettings: updateSettingsDb } = useSettingsSync();

    const [user, setUser, resetUserStorage] = useAsyncStorage<UserStats>('forge-user', defaultUser);
    const [tasks, setTasks, resetTasksStorage] = useAsyncStorage<Task[]>('forge-tasks', []);
    const [meals, setMeals, resetMealsStorage] = useAsyncStorage<Meal[]>('forge-meals', []);
    const [exercises, setExercises, resetExercisesStorage] = useAsyncStorage<Exercise[]>('forge-exercises', []);
    const [friends, setFriends, resetFriendsStorage] = useAsyncStorage<Friend[]>('forge-friends', []);
    const [workoutHistory, setWorkoutHistory, resetWorkoutHistoryStorage] = useAsyncStorage<WorkoutSession[]>('forge-workout-history', []);
    const [settings, setSettings, resetSettingsStorage] = useAsyncStorage<AppSettings>('forge-settings', defaultSettings);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useAsyncStorage<number | null>('forge-last-sync', null);
    const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);

    const { performSave: triggerAutoSave } = useAutoSave({
        user,
        tasks,
        meals,
        workoutHistory,
        friends,
        settings
    }, 3);

    useEffect(() => {
        if (authUser?.id) {
            resetUserStorage();
            resetTasksStorage();
            resetMealsStorage();
            resetExercisesStorage();
            resetFriendsStorage();
            resetWorkoutHistoryStorage();
            resetSettingsStorage();
            setLastSync(null);
        }
    }, [authUser?.id]);

    const syncFromCloud = useCallback(async () => {
        if (!isCloudEnabled) return;
        setIsSyncing(true);
        try {
            const profile = await fetchProfile() as any;
            if (profile) {
                setUser({
                    xp: profile.xp,
                    level: profile.level,
                    caloriesGoal: profile.calories_goal,
                    proteinGoal: profile.protein_goal,
                    carbsGoal: profile.carbs_goal,
                    fatsGoal: profile.fats_goal,
                    name: profile.name,
                    rank: profile.rank,
                    email: profile.email || undefined,
                    avatar: profile.avatar_url || undefined
                });
            }
            setTasks(await fetchTasks());
            setMeals(await fetchMeals());
            setWorkoutHistory(await fetchWorkouts());
            setFriends(await fetchFriends());
            const cloudSettings = await fetchSettings();
            if (cloudSettings) setSettings(cloudSettings);
            const now = Date.now();
            setLastSync(now);
            setLastAutoSave(now);
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isCloudEnabled, fetchProfile, fetchTasks, fetchMeals, fetchWorkouts, fetchFriends, fetchSettings, setUser, setTasks, setMeals, setWorkoutHistory, setFriends, setSettings, setLastSync]);

    useEffect(() => {
        if (isCloudEnabled && authUser) {
            syncFromCloud();
        }
    }, [isCloudEnabled, authUser?.id, syncFromCloud]);

    const addXp = useCallback(async (amount: number) => {
        let currentXp = 0;
        let currentLevel = 1;
        setUser(prev => {
            const newXp = prev.xp + amount;
            const newLevel = Math.floor(newXp / 1000) + 1;
            currentXp = newXp;
            currentLevel = newLevel;
            return { ...prev, xp: newXp, level: newLevel };
        });
        if (isCloudEnabled) await updateProfile({ xp: currentXp, level: currentLevel });
    }, [setUser, isCloudEnabled, updateProfile]);

    const updateUser = useCallback((updates: Partial<UserStats>) => {
        setUser(prev => {
            const updated = { ...prev, ...updates };
            if (isCloudEnabled) {
                updateProfile({
                    name: updates.name,
                    email: updates.email,
                    avatar_url: updates.avatar,
                    calories_goal: updates.caloriesGoal,
                    protein_goal: updates.proteinGoal,
                    carbs_goal: updates.carbsGoal,
                    fats_goal: updates.fatsGoal,
                    rank: updates.rank
                });
            }
            return updated;
        });
    }, [setUser, isCloudEnabled, updateProfile]);

    const resetUser = useCallback(() => resetUserStorage(), [resetUserStorage]);

    const toggleTask = useCallback(async (id: string) => {
        let updatedTask: Task | null = null;
        setTasks(prev => prev.map(t => {
            if (t.id === id) {
                const newCompleted = !t.completed;
                const updated = { ...t, completed: newCompleted, completedAt: newCompleted ? Date.now() : undefined };
                updatedTask = updated;
                return updated;
            }
            return t;
        }));
        if (updatedTask && (updatedTask as any).completed) await addXp((updatedTask as any).xpReward);
        if (isCloudEnabled && updatedTask) await updateTaskDb(id, updatedTask);
    }, [setTasks, addXp, isCloudEnabled, updateTaskDb]);

    const addTask = useCallback(async (title: string, dueDate: string = 'TODAY', xpReward: number = 100) => {
        const newTask: Task = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title: title.trim(),
            dueDate,
            completed: false,
            xpReward,
            createdAt: Date.now()
        };
        setTasks(prev => [newTask, ...prev]);
        if (isCloudEnabled) await createTask(newTask);
    }, [setTasks, isCloudEnabled, createTask]);

    const deleteTask = useCallback(async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        if (isCloudEnabled) await deleteTaskDb(id);
    }, [setTasks, isCloudEnabled, deleteTaskDb]);

    const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
        let updatedTask: Task | null = null;
        setTasks(prev => prev.map(t => {
            if (t.id === id) {
                const updated = { ...t, ...updates };
                updatedTask = updated;
                return updated;
            }
            return t;
        }));
        if (isCloudEnabled && updatedTask) await updateTaskDb(id, updatedTask);
    }, [setTasks, isCloudEnabled, updateTaskDb]);

    const addMeal = useCallback(async (meal: Omit<Meal, 'id' | 'timestamp'>) => {
        const newMeal: Meal = { ...meal, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, timestamp: Date.now() };
        setMeals(prev => [newMeal, ...prev]);
        await addXp(50);
        if (isCloudEnabled) await createMeal(newMeal);
    }, [setMeals, addXp, isCloudEnabled, createMeal]);

    const deleteMeal = useCallback(async (id: string) => {
        setMeals(prev => prev.filter(m => m.id !== id));
        if (isCloudEnabled) await deleteMealDb(id);
    }, [setMeals, isCloudEnabled, deleteMealDb]);

    const getMealsByDate = useCallback((date: Date) => {
        const startOfDay = new Date(date).setHours(0, 0, 0, 0);
        const endOfDay = new Date(date).setHours(23, 59, 59, 999);
        return meals.filter(m => m.timestamp >= startOfDay && m.timestamp <= endOfDay);
    }, [meals]);

    const addExercise = useCallback((exercise: Omit<Exercise, 'id'>) => {
        const newExercise: Exercise = { ...exercise, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
        setExercises(prev => [...prev, newExercise]);
    }, [setExercises]);

    const updateExercise = useCallback((id: string, updates: Partial<Exercise>) => {
        setExercises(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    }, [setExercises]);

    const deleteExercise = useCallback((id: string) => {
        setExercises(prev => prev.filter(e => e.id !== id));
    }, [setExercises]);

    const completeExerciseSet = useCallback((id: string) => {
        setExercises(prev => prev.map(e => {
            if (e.id === id && e.completedSets < e.sets) {
                const newCompletedSets = e.completedSets + 1;
                if (newCompletedSets === e.sets) addXp(25);
                return { ...e, completedSets: newCompletedSets };
            }
            return e;
        }));
    }, [setExercises, addXp]);

    const resetExercises = useCallback(() => setExercises([]), [setExercises]);

    const saveWorkoutSession = useCallback(async (session: Omit<WorkoutSession, 'id' | 'date'>) => {
        const newSession: WorkoutSession = { ...session, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, date: Date.now() };
        setWorkoutHistory(prev => [newSession, ...prev]);
        await addXp(session.totalXp);
        if (isCloudEnabled) {
            await createWorkout(newSession);
            await triggerAutoSave();
        }
    }, [setWorkoutHistory, addXp, isCloudEnabled, createWorkout, triggerAutoSave]);

    const getWorkoutHistory = useCallback(() => workoutHistory, [workoutHistory]);

    const deleteWorkoutSession = useCallback(async (id: string) => {
        setWorkoutHistory(prev => prev.filter(s => s.id !== id));
        if (isCloudEnabled) await deleteWorkoutDb(id);
    }, [setWorkoutHistory, isCloudEnabled, deleteWorkoutDb]);

    const addFriend = useCallback(async (friend: Omit<Friend, 'id'>) => {
        const newFriend: Friend = { ...friend, id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}` };
        setFriends(prev => [...prev, newFriend]);
        if (isCloudEnabled) await createFriend(newFriend);
    }, [setFriends, isCloudEnabled, createFriend]);

    const removeFriend = useCallback(async (id: string) => {
        setFriends(prev => prev.filter(f => f.id !== id));
        if (isCloudEnabled) await deleteFriendDb(id);
    }, [setFriends, isCloudEnabled, deleteFriendDb]);

    const updateFriendXp = useCallback(async (id: string, xp: number) => {
        let updatedFriend: Friend | null = null;
        setFriends(prev => prev.map(f => {
            if (f.id === id) {
                const newLevel = Math.floor(xp / 1000) + 1;
                const updated = { ...f, xp, level: newLevel };
                updatedFriend = updated;
                return updated;
            }
            return f;
        }));
        if (isCloudEnabled && updatedFriend) await updateFriendDb(id, updatedFriend);
    }, [setFriends, isCloudEnabled, updateFriendDb]);

    const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
        if (isCloudEnabled) await updateSettingsDb(updates);
    }, [setSettings, isCloudEnabled, updateSettingsDb]);

    const resetAllData = useCallback(() => {
        resetUserStorage(); resetTasksStorage(); resetMealsStorage(); resetExercisesStorage();
        resetFriendsStorage(); resetWorkoutHistoryStorage(); resetSettingsStorage(); setLastSync(null);
    }, [resetUserStorage, resetTasksStorage, resetMealsStorage, resetExercisesStorage, resetFriendsStorage, resetWorkoutHistoryStorage, resetSettingsStorage, setLastSync]);

    const todaysMeals = useMemo(() => {
        const today = new Date();
        return getMealsByDate(today);
    }, [getMealsByDate, meals]);

    const totalCalories = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.calories, 0), [todaysMeals]);
    const totalProtein = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.protein, 0), [todaysMeals]);
    const totalCarbs = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.carbs, 0), [todaysMeals]);
    const totalFats = useMemo(() => todaysMeals.reduce((acc, m) => acc + m.fats, 0), [todaysMeals]);

    const value = useMemo(() => ({
        user, tasks, meals: todaysMeals, allMeals: meals, exercises, friends, workoutHistory, settings, isSyncing, lastSync, lastAutoSave,
        addXp, updateUser, resetUser, toggleTask, addTask, deleteTask, updateTask, addMeal, deleteMeal, getMealsByDate,
        addExercise, updateExercise, deleteExercise, completeExerciseSet, resetExercises, saveWorkoutSession, getWorkoutHistory,
        deleteWorkoutSession, addFriend, removeFriend, updateFriendXp, updateSettings, resetAllData, syncWithCloud: syncFromCloud, triggerAutoSave,
        totalCalories, totalProtein, totalCarbs, totalFats
    }), [
        user, tasks, todaysMeals, meals, exercises, friends, workoutHistory, settings, isSyncing, lastSync, lastAutoSave,
        addXp, updateUser, resetUser, toggleTask, addTask, deleteTask, updateTask, addMeal, deleteMeal, getMealsByDate,
        addExercise, updateExercise, deleteExercise, completeExerciseSet, resetExercises, saveWorkoutSession, getWorkoutHistory,
        deleteWorkoutSession, addFriend, removeFriend, updateFriendXp, updateSettings, resetAllData, syncFromCloud, triggerAutoSave,
        totalCalories, totalProtein, totalCarbs, totalFats
    ]);

    return <AppContext.Provider value={value as AppContextType}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) throw new Error('useApp must be used within an AppProvider');
    return context;
};
