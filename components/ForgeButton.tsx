import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';

interface ButtonProps {
    children: React.ReactNode;
    onPress?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
    uppercase?: boolean;
    disabled?: boolean;
    style?: any;
}

export const ForgeButton: React.FC<ButtonProps> = ({
    children,
    onPress,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    uppercase = false,
    disabled = false,
    style,
}) => {
    const variantClasses = {
        primary: 'bg-green-500',
        secondary: 'bg-zinc-800 border border-zinc-700',
        ghost: 'bg-transparent',
        danger: 'bg-red-500',
        outline: 'bg-transparent border-2 border-zinc-700',
    };

    const textClasses = {
        primary: 'text-black',
        secondary: 'text-white',
        ghost: 'text-zinc-400',
        danger: 'text-white',
        outline: 'text-white',
    };

    const sizeClasses = {
        sm: 'px-3 py-2',
        md: 'px-4 py-2.5',
        lg: 'px-6 py-3',
        xl: 'px-8 py-4',
    };

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || isLoading}
            className={`
        flex-row items-center justify-center rounded-xl
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || isLoading ? 'opacity-50' : ''}
      `}
            style={style}
        >
            {isLoading ? (
                <ActivityIndicator color={variant === 'primary' ? 'black' : 'white'} className="mr-2" />
            ) : (
                leftIcon && <View className="mr-2">{leftIcon}</View>
            )}

            <Text className={`
        font-bold
        ${textClasses[variant]}
        ${textSizeClasses[size]}
        ${uppercase ? 'uppercase tracking-wider' : ''}
      `}>
                {children}
            </Text>

            {!isLoading && rightIcon && <View className="ml-2">{rightIcon}</View>}
        </TouchableOpacity>
    );
};

export default ForgeButton;
