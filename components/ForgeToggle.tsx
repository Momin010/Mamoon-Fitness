import React from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';

interface ForgeToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    description?: string;
}

export const ForgeToggle: React.FC<ForgeToggleProps> = ({
    checked,
    onChange,
    label,
    description
}) => {
    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onChange(!checked)}
            className="flex-row items-center justify-between"
        >
            <View className="flex-1 mr-4">
                <Text className="text-white font-black uppercase text-xs tracking-tight">{label}</Text>
                {description && (
                    <Text className="text-zinc-500 text-[10px] font-bold mt-1 uppercase tracking-widest">{description}</Text>
                )}
            </View>
            <Switch
                value={checked}
                onValueChange={onChange}
                trackColor={{ false: '#27272a', true: '#22c55e' }}
                thumbColor={checked ? '#ffffff' : '#a1a1aa'}
                ios_backgroundColor="#27272a"
            />
        </TouchableOpacity>
    );
};

export default ForgeToggle;
