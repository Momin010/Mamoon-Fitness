import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView } from 'react-native';
import { Dumbbell, Plus, X } from 'lucide-react-native';
import { Exercise } from '../types';

interface Template {
    id: string;
    name: string;
    description: string;
    exercises: Omit<Exercise, 'id' | 'completedSets'>[];
}

const BUILT_IN_TEMPLATES: Template[] = [
    {
        id: 'push-day',
        name: 'Push Day',
        description: 'Chest, shoulders, and triceps',
        exercises: [
            { name: 'Bench Press', sets: 4, reps: 8, weight: 135 },
            { name: 'Overhead Press', sets: 3, reps: 10, weight: 95 },
            { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
            { name: 'Lateral Raises', sets: 3, reps: 15 },
            { name: 'Tricep Extensions', sets: 3, reps: 12 },
            { name: 'Cable Flys', sets: 3, reps: 12 }
        ]
    },
    {
        id: 'pull-day',
        name: 'Pull Day',
        description: 'Back and biceps',
        exercises: [
            { name: 'Barbell Row', sets: 4, reps: 8, weight: 135 },
            { name: 'Lat Pulldown', sets: 3, reps: 10 },
            { name: 'Face Pulls', sets: 3, reps: 15 },
            { name: 'Bicep Curls', sets: 3, reps: 12 },
            { name: 'Pull-ups', sets: 3, reps: 8 },
            { name: 'Hammer Curls', sets: 3, reps: 12 }
        ]
    },
    {
        id: 'legs-day',
        name: 'Legs Day',
        description: 'Quads, hamstrings, and calves',
        exercises: [
            { name: 'Squat', sets: 4, reps: 6, weight: 185 },
            { name: 'Romanian Deadlift', sets: 3, reps: 10, weight: 135 },
            { name: 'Leg Press', sets: 3, reps: 12 },
            { name: 'Leg Curls', sets: 3, reps: 12 },
            { name: 'Calf Raises', sets: 4, reps: 15 },
            { name: 'Lunges', sets: 3, reps: 10 }
        ]
    },
    {
        id: 'upper-body',
        name: 'Upper Body',
        description: 'Full upper body workout',
        exercises: [
            { name: 'Bench Press', sets: 4, reps: 8, weight: 135 },
            { name: 'Barbell Row', sets: 4, reps: 8, weight: 135 },
            { name: 'Overhead Press', sets: 3, reps: 10, weight: 95 },
            { name: 'Lat Pulldown', sets: 3, reps: 10 },
            { name: 'Bicep Curls', sets: 3, reps: 12 },
            { name: 'Tricep Extensions', sets: 3, reps: 12 }
        ]
    },
    {
        id: 'lower-body',
        name: 'Lower Body',
        description: 'Full lower body workout',
        exercises: [
            { name: 'Squat', sets: 4, reps: 6, weight: 185 },
            { name: 'Deadlift', sets: 3, reps: 5, weight: 225 },
            { name: 'Leg Press', sets: 3, reps: 12 },
            { name: 'Leg Curls', sets: 3, reps: 12 },
            { name: 'Calf Raises', sets: 4, reps: 15 },
            { name: 'Leg Extensions', sets: 3, reps: 15 }
        ]
    },
    {
        id: 'full-body',
        name: 'Full Body',
        description: 'Complete full body routine',
        exercises: [
            { name: 'Squat', sets: 3, reps: 8, weight: 135 },
            { name: 'Bench Press', sets: 3, reps: 8, weight: 135 },
            { name: 'Barbell Row', sets: 3, reps: 8, weight: 135 },
            { name: 'Overhead Press', sets: 3, reps: 10, weight: 95 },
            { name: 'Lat Pulldown', sets: 3, reps: 10 },
            { name: 'Plank', sets: 3, reps: 60 }
        ]
    }
];

interface ExerciseTemplatesProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (exercises: Omit<Exercise, 'id' | 'completedSets'>[]) => void;
}

export const ExerciseTemplates: React.FC<ExerciseTemplatesProps> = ({
    isOpen,
    onClose,
    onSelectTemplate
}) => {
    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black p-6">
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-xl font-bold text-white">Workout Templates</Text>
                        <Text className="text-sm text-zinc-400">Choose a pre-built routine</Text>
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        className="p-2 bg-zinc-900 rounded-full"
                    >
                        <X size={20} color="white" />
                    </TouchableOpacity>
                </View>

                <ScrollView className="space-y-3">
                    {BUILT_IN_TEMPLATES.map((template) => (
                        <TouchableOpacity
                            key={template.id}
                            className="p-4 bg-zinc-900 rounded-xl mb-4 border border-zinc-800"
                            onPress={() => {
                                onSelectTemplate(template.exercises);
                                onClose();
                            }}
                        >
                            <View className="flex-row items-start justify-between">
                                <View className="flex-row items-center gap-3 flex-1">
                                    <View className="p-2 bg-green-500/20 rounded-lg">
                                        <Dumbbell size={20} color="#22c55e" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-bold text-white text-base">
                                            {template.name}
                                        </Text>
                                        <Text className="text-sm text-zinc-400">{template.description}</Text>
                                        <Text className="text-xs text-zinc-500 mt-1">
                                            {template.exercises.length} exercises
                                        </Text>
                                    </View>
                                </View>
                                <Plus size={20} color="#22c55e" />
                            </View>

                            <View className="mt-3 pt-3 border-t border-zinc-800 flex-row flex-wrap gap-2">
                                {template.exercises.slice(0, 4).map((ex, idx) => (
                                    <View
                                        key={idx}
                                        className="bg-zinc-950 px-2 py-1 rounded"
                                    >
                                        <Text className="text-xs text-zinc-400">{ex.name}</Text>
                                    </View>
                                ))}
                                {template.exercises.length > 4 && (
                                    <View className="bg-zinc-950 px-2 py-1 rounded">
                                        <Text className="text-xs text-zinc-400">
                                            +{template.exercises.length - 4} more
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                    <View className="h-10" />
                </ScrollView>

                <View className="mt-4 pt-4 border-t border-zinc-800">
                    <TouchableOpacity
                        onPress={onClose}
                        className="w-full py-4 border border-zinc-700 rounded-xl items-center"
                    >
                        <Text className="text-zinc-400 font-bold">Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

export default ExerciseTemplates;
