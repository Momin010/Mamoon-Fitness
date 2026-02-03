import type { Task, Meal, Exercise, UserStats, Friend, WorkoutSession } from '../types';
import React, { createContext, useContext, useCallback, useMemo, useEffect, useState } from 'react';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { useSupabase } from './SupabaseContext';
import { supabase } from '../lib/supabase';

interface AppState {
    user: UserStats;
    tasks: Task[];
    meals: Meal[];
    exercises: Exercise[];
    friends: Friend[];
    workoutHistory: WorkoutSession[];
    settings: AppSettings;
    isSyncing: boolean;
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
    addTask: (title: string, dueDate?: string, xpReward?: number) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    addExercise: (exercise: Omit<Exercise, 'id'>) => void;
    completeExerciseSet: (id: string) => void;
    resetExercises: () => void;
    saveWorkoutSession: (session: Omit<WorkoutSession, 'id' | 'date'>) => Promise<void>;
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
        'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Pull-ups', 'Push-ups'
    ],
    dailyResetHour: 0,
    notificationsEnabled: true,
    darkMode: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user: authUser } = useSupabase();

    const [user, setUser] = useAsyncStorage<UserStats>('forge-user', defaultUser);
    const [tasks, setTasks] = useAsyncStorage<Task[]>('forge-tasks', []);
    const [meals, setMeals] = useAsyncStorage<Meal[]>('forge-meals', []);
    const [exercises, setExercises] = useAsyncStorage<Exercise[]>('forge-exercises', []);
    const [friends, setFriends] = useAsyncStorage<Friend[]>('forge-friends', []);
    const [workoutHistory, setWorkoutHistory] = useAsyncStorage<WorkoutSession[]>('forge-workout-history', []);
    const [settings, setSettings] = useAsyncStorage<AppSettings>('forge-settings', defaultSettings);
    const [isSyncing, setIsSyncing] = useState(false);

    const addXp = useCallback(async (amount: number) => {
        setUser(prev => {
            const newXp = prev.xp + amount;
            const newLevel = Math.floor(newXp / 1000) + 1;
            return { ...prev, xp: newXp, level: newLevel };
        });
    }, [setUser]);

    const addTask = useCallback(async (title: string, dueDate: string = 'TODAY', xpReward: number = 100) => {
        const newTask: Task = {
            id: `${Date.now()}`,
            title,
            dueDate,
            completed: false,
            xpReward,
            createdAt: Date.now()
        };
        setTasks(prev => [newTask, ...prev]);
    }, [setTasks]);

    const toggleTask = useCallback(async (id: string) => {
        setTasks(prev => prev.map(t => {
            if (t.id === id) {
                const newCompleted = !t.completed;
                if (newCompleted) addXp(t.xpReward);
                return { ...t, completed: newCompleted, completedAt: newCompleted ? Date.now() : undefined };
            }
            return t;
        }));
    }, [setTasks, addXp]);

    const addExercise = useCallback((exercise: Omit<Exercise, 'id'>) => {
        const newExercise: Exercise = { ...exercise, id: `${Date.now()}` };
        setExercises(prev => [...prev, newExercise]);
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
        const newSession: WorkoutSession = { ...session, id: `${Date.now()}`, date: Date.now() };
        setWorkoutHistory(prev => [newSession, ...prev]);
        await addXp(session.totalXp);
    }, [setWorkoutHistory, addXp]);

    const value = useMemo(() => ({
        user, tasks, meals, allMeals: meals, exercises, friends, workoutHistory, settings, isSyncing,
        totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFats: 0,
        addXp, updateUser: setUser, addTask, toggleTask, addExercise, completeExerciseSet, resetExercises, saveWorkoutSession
    }), [user, tasks, meals, exercises, friends, workoutHistory, settings, isSyncing, addXp, setUser, addTask, toggleTask, addExercise, completeExerciseSet, resetExercises, saveWorkoutSession]);

    return <AppContext.Provider value={value as AppContextType}>{children}</AppContext.Provider>;
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) throw new Error('useApp must be used within an AppProvider');
    return context;
};
