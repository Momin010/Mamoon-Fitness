import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { ChevronDown, Check, Search, X } from 'lucide-react-native';

export interface DropdownOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface ForgeDropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    searchable?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const ForgeDropdown: React.FC<ForgeDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    label,
    searchable = false,
    disabled = false,
    size = 'md',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedOption = options.find(opt => opt.value === value);
    const filteredOptions = searchable
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <View className="w-full">
            {label && (
                <Text className="text-zinc-500 font-black uppercase tracking-widest text-[10px] mb-2">
                    {label}
                </Text>
            )}

            <TouchableOpacity
                onPress={() => !disabled && setIsOpen(true)}
                className={`bg-zinc-900 border border-zinc-800 rounded-xl flex-row items-center justify-between px-4 py-4 ${disabled ? 'opacity-50' : ''}`}
            >
                <Text className={`font-bold ${!selectedOption ? 'text-zinc-500' : 'text-white'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>
                <ChevronDown size={20} color="#71717a" />
            </TouchableOpacity>

            <Modal
                visible={isOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsOpen(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1 justify-end"
                >
                    {/* Backdrop */}
                    <View className="absolute inset-0 bg-black/80" onTouchEnd={() => setIsOpen(false)} />

                    <View className="bg-zinc-900 rounded-t-3xl h-[80%] border-t border-zinc-800 w-full">
                        {/* Header */}
                        <View className="flex-row items-center justify-between p-5 border-b border-zinc-800">
                            <Text className="text-white font-black uppercase tracking-tight text-lg">Select Option</Text>
                            <TouchableOpacity onPress={() => setIsOpen(false)} className="p-2 bg-zinc-800 rounded-full">
                                <X size={20} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Search */}
                        {searchable && (
                            <View className="p-4 border-b border-zinc-800">
                                <View className="bg-black rounded-xl border border-zinc-800 flex-row items-center px-4 py-3">
                                    <Search size={18} color="#71717a" />
                                    <TextInput
                                        placeholder="Search..."
                                        placeholderTextColor="#71717a"
                                        className="flex-1 ml-3 text-white font-bold"
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                </View>
                            </View>
                        )}

                        {/* Options */}
                        <FlatList
                            data={filteredOptions}
                            keyExtractor={item => item.value}
                            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => !item.disabled && handleSelect(item.value)}
                                    className={`p-4 rounded-xl mb-2 flex-row items-center justify-between ${value === item.value ? 'bg-green-500/10' : 'bg-transparent'
                                        }`}
                                    disabled={item.disabled}
                                >
                                    <Text className={`font-bold text-base ${value === item.value ? 'text-green-500' : 'text-white'
                                        }`}>
                                        {item.label}
                                    </Text>
                                    {value === item.value && (
                                        <Check size={20} color="#22c55e" />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <View className="items-center py-10">
                                    <Text className="text-zinc-500 font-bold">No options found</Text>
                                </View>
                            }
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};
