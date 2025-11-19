import AsyncStorage from '@react-native-async-storage/async-storage'; // Used to persist data across app sessions
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// This interface defines the types of values and functions shared via context
interface SettingsContextType {
    isPinSet: boolean; // Indicates whether a parent PIN has been created
    restrictedMode: boolean; // Indicates whether restricted mode is ON or OFF
    isLoading: boolean; // Indicates whether settings are still being loaded from AsyncStorage
    selectedVideos: string[]; // List of selected video IDs for personalized content
    savePin: (pin: string) => Promise<boolean>; // Saves a new PIN to AsyncStorage
    verifyPin: (pin: string) => boolean; // Verifies if entered PIN matches stored PIN
    toggleVideoSelectionInContext: (videoId: string) => Promise<void>; // Adds/removes a video from the selected list
    toggleRestrictedMode: () => Promise<void>; // Toggles restricted mode ON/OFF and persists it
    clearSettings: () => Promise<void>; // Clears all locally stored settings
}

// Create the context with an initial undefined value (used with custom hook below)
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// The provider wraps the app and shares the state and logic defined here
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true); // Tracks if settings are still loading from AsyncStorage
    const [isPinSet, setIsPinSet] = useState(false); // True if a PIN has been set and saved
    const [pin, setPin] = useState<string | null>(null); // Stores the actual saved PIN (not encrypted)
    const [restrictedMode, setRestrictedMode] = useState(false); // Whether restricted mode is active
    const [selectedVideos, setSelectedVideos] = useState<string[]>([]); // List of selected videos for "For You" page

    // This effect runs once to load all saved settings when the app starts
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const storedPin = await AsyncStorage.getItem('parentPin');
                if (storedPin) {
                    setPin(storedPin);
                    setIsPinSet(true);
                }

                const storedMode = await AsyncStorage.getItem('restrictedMode');
                setRestrictedMode(storedMode === 'true'); // Convert string to boolean

                const storedVideos = await AsyncStorage.getItem('selectedVideos');
                setSelectedVideos(storedVideos ? JSON.parse(storedVideos) : []);
            } catch (e) {
                console.error("Failed to load settings", e);
            } finally {
                setIsLoading(false); // Done loading regardless of success or failure
            }
        };

        loadSettings();
    }, []);

    // Saves a new PIN to AsyncStorage and updates state
    const savePin = async (newPin: string): Promise<boolean> => {
        try {
            await AsyncStorage.setItem('parentPin', newPin);
            setPin(newPin);
            setIsPinSet(true);
            return true;
        } catch (e) {
            return false; // If saving fails, return false
        }
    };

    // Compares entered PIN with stored PIN
    const verifyPin = (enteredPin: string): boolean => enteredPin === pin;

    // Adds or removes a video ID from the selected videos list and persists the update
    const toggleVideoSelectionInContext = async (videoId: string): Promise<void> => {
        const newSelectedVideos = selectedVideos.includes(videoId)
            ? selectedVideos.filter(id => id !== videoId) // Remove if already selected
            : [...selectedVideos, videoId]; // Add if not selected

        setSelectedVideos(newSelectedVideos);
        await AsyncStorage.setItem('selectedVideos', JSON.stringify(newSelectedVideos));
    };

    // Flips the restricted mode setting and updates AsyncStorage
    const toggleRestrictedMode = async (): Promise<void> => {
        const newMode = !restrictedMode;
        setRestrictedMode(newMode);
        await AsyncStorage.setItem('restrictedMode', String(newMode));
    };

    // Clears all settings stored in AsyncStorage and resets local state
    const clearSettings = async (): Promise<void> => {
        await AsyncStorage.multiRemove(['parentPin', 'restrictedMode', 'selectedVideos']);
        setPin(null);
        setIsPinSet(false);
        setRestrictedMode(false);
        setSelectedVideos([]);
    };

    // Combine all state and actions to provide them via context
    const value: SettingsContextType = {
        isLoading,
        isPinSet,
        restrictedMode,
        selectedVideos,
        savePin,
        verifyPin,
        toggleVideoSelectionInContext,
        toggleRestrictedMode,
        clearSettings,
    };

    // Wrap children with provider to share context
    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

// Custom hook to access the SettingsContext inside components
export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext); // Access the current context value

    // If the context is undefined, it means useSettings was called outside the SettingsProvider.
    // This ensures that components using this hook are properly wrapped in the provider.
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider'); // Throw helpful error
    }

    return context; // Return the valid context so components can use its values and functions
};


