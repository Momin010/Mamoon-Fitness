
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react-native';
import { router } from 'expo-router';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // In React Native, we can't easily reload the whole app like window.location.reload()
    // but we can try to navigate to the index
    router.replace('/');
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    router.replace('/');
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-1 items-center justify-center p-6">
            <View className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={40} color="#ef4444" />
            </View>

            <Text className="text-white text-2xl font-bold mb-2">Something went wrong</Text>
            <Text className="text-zinc-400 text-center mb-6">
              We apologize for the inconvenience. The app encountered an unexpected error.
            </Text>

            {__DEV__ && this.state.error && (
              <View className="bg-zinc-900 rounded-lg p-4 mb-6 w-full max-h-48">
                <ScrollView>
                    <Text className="text-red-400 font-mono text-sm mb-2">
                    {this.state.error.toString()}
                    </Text>
                    {this.state.errorInfo && (
                    <Text className="text-zinc-500 text-xs font-mono">
                        {this.state.errorInfo.componentStack}
                    </Text>
                    )}
                </ScrollView>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={this.handleReset}
                className="flex-row items-center bg-green-500 px-6 py-3 rounded-xl"
              >
                <RefreshCw size={18} color="black" />
                <Text className="text-black font-bold ml-2">Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={this.handleGoHome}
                className="flex-row items-center bg-zinc-800 px-6 py-3 rounded-xl"
              >
                <Home size={18} color="white" />
                <Text className="text-white font-bold ml-2">Go Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
