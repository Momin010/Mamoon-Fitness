import React from 'react';
import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';

interface ForgeSliderProps {
    label?: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step?: number;
    color?: 'green' | 'blue' | 'red';
    size?: 'sm' | 'md';
}

export const ForgeSlider: React.FC<ForgeSliderProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    color = 'green'
}) => {
    const activeColor = color === 'green' ? '#22c55e' : color === 'blue' ? '#3b82f6' : '#ef4444';

    return (
        <View className="w-full">
            <View className="flex-row justify-between items-end mb-4">
                {label && (
                    <Text className="text-zinc-500 font-black uppercase tracking-widest text-[10px]">
                        {label}
                    </Text>
                )}
                <Text className="text-white font-black text-xl" style={{ color: activeColor }}>
                    {value}
                </Text>
            </View>

            <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={min}
                maximumValue={max}
                step={step}
                value={value}
                onValueChange={onChange}
                minimumTrackTintColor={activeColor}
                maximumTrackTintColor="#27272a"
                thumbTintColor={activeColor}
            />

            <View className="flex-row justify-between px-1 mt-1">
                <Text className="text-zinc-600 text-[10px] font-bold">{min}</Text>
                <Text className="text-zinc-600 text-[10px] font-bold">{max}</Text>
            </View>
        </View>
    );
};
