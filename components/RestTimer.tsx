import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Play, Pause, RotateCcw, X, Bell } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

interface RestTimerProps {
    isOpen: boolean;
    onClose: () => void;
    defaultDuration?: number;
}

const PRESET_DURATIONS = [
    { label: '30s', value: 30 },
    { label: '60s', value: 60 },
    { label: '90s', value: 90 },
    { label: '2m', value: 120 },
    { label: '3m', value: 180 },
    { label: '5m', value: 300 }
];

export const RestTimer: React.FC<RestTimerProps> = ({
    isOpen,
    onClose,
    defaultDuration = 60
}) => {
    const [duration, setDuration] = useState(defaultDuration);
    const [timeLeft, setTimeLeft] = useState(defaultDuration);
    const [isRunning, setIsRunning] = useState(false);
    const [showNotification, setShowNotification] = useState(true);

    useEffect(() => {
        let interval: any;

        if (isRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsRunning(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timeLeft === 0) {
            setIsRunning(false);
        }

        return () => clearInterval(interval);
    }, [isRunning, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = () => setIsRunning(true);
    const handlePause = () => setIsRunning(false);
    const handleReset = () => {
        setIsRunning(false);
        setTimeLeft(duration);
    };

    const handleDurationChange = (newDuration: number) => {
        setDuration(newDuration);
        setTimeLeft(newDuration);
        setIsRunning(false);
    };

    const progress = ((duration - timeLeft) / duration) * 100;
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress / 100);

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/90 items-center justify-center p-6">
                <View className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm border border-zinc-800">
                    <View className="flex-row justify-between items-center mb-8">
                        <Text className="text-xl font-bold text-white">Rest Timer</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            className="p-2 bg-zinc-800 rounded-full"
                        >
                            <X size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Timer Display */}
                    <View className="items-center justify-center mb-8 relative">
                        <View style={{ width: 220, height: 220 }}>
                            <Svg width="100%" height="100%" viewBox="0 0 220 220">
                                <Circle
                                    cx="110"
                                    cy="110"
                                    r={radius}
                                    fill="none"
                                    stroke="#27272a"
                                    strokeWidth="12"
                                />
                                <Circle
                                    cx="110"
                                    cy="110"
                                    r={radius}
                                    fill="none"
                                    stroke="#22c55e"
                                    strokeWidth="12"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    rotation="-90"
                                    origin="110, 110"
                                />
                            </Svg>
                            <View className="absolute inset-0 items-center justify-center">
                                <Text className={`text-6xl font-black ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
                                    {formatTime(timeLeft)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Controls */}
                    <View className="flex-row justify-center gap-6 mb-8">
                        {!isRunning ? (
                            <TouchableOpacity
                                onPress={handleStart}
                                className="w-16 h-16 bg-green-500 rounded-full items-center justify-center"
                            >
                                <Play size={28} color="black" fill="black" />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={handlePause}
                                className="w-16 h-16 bg-yellow-500 rounded-full items-center justify-center"
                            >
                                <Pause size={28} color="black" fill="black" />
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={handleReset}
                            className="w-16 h-16 bg-zinc-800 rounded-full items-center justify-center"
                        >
                            <RotateCcw size={28} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* Notification Toggle */}
                    <TouchableOpacity
                        onPress={() => setShowNotification(!showNotification)}
                        className={`flex-row items-center justify-center gap-2 p-4 rounded-xl mb-6 ${showNotification ? 'bg-green-500/20' : 'bg-zinc-800'
                            }`}
                    >
                        <Bell size={18} color={showNotification ? '#22c55e' : '#a1a1aa'} />
                        <Text className={`text-sm font-bold ${showNotification ? 'text-green-500' : 'text-zinc-400'}`}>
                            {showNotification ? 'Notification On' : 'Notification Off'}
                        </Text>
                    </TouchableOpacity>

                    {/* Preset Durations */}
                    <View className="flex-row flex-wrap gap-2 justify-between">
                        {PRESET_DURATIONS.map((preset) => (
                            <TouchableOpacity
                                key={preset.value}
                                onPress={() => handleDurationChange(preset.value)}
                                className={`w-[30%] py-3 rounded-xl items-center justify-center ${duration === preset.value
                                        ? 'bg-green-500'
                                        : 'bg-zinc-800'
                                    }`}
                            >
                                <Text className={`font-bold text-xs ${duration === preset.value ? 'text-black' : 'text-zinc-400'
                                    }`}>
                                    {preset.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default RestTimer;
