// src/HeaderButtons.tsx

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View, Alert } from 'react-native'; // <-- Make sure Alert is imported
import { signOut } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { useSettings } from '@/src/SettingsContext';

// Your Settings button, now with the correct alert logic from your video
export function SettingsButton() {
    const router = useRouter();
    const { isPinSet } = useSettings(); // This will now work correctly

    const handlePress = () => {
        if (isPinSet) {
            // If a PIN is set, go directly to the entry screen.
            router.push('/PinEntry');
        } else {
            // If no PIN is set, show the alert exactly like in the video.
            Alert.alert(
                "Setup Required",
                "Please set up a Parent PIN to access settings.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Set PIN Now", onPress: () => router.push('/PinSetup') }
                ]
            );
        }
    };
    
    return (
        <TouchableOpacity onPress={handlePress}>
            <Ionicons name="settings-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
    );
}

// Your Logout button (no changes needed here)
export function LogoutButton() {
    const router = useRouter();
    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/login');
    };

    return (
        <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={28} color="#DC3545" />
        </TouchableOpacity>
    );
}