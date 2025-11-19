// Import necessary packages from React, Expo Router, Firebase, and other libraries
import { auth } from '@/firebaseConfig'; // Firebase configuration
import { SettingsProvider } from '@/src/SettingsContext'; // Custom context for app-wide settings
import { StripeProvider } from '@stripe/stripe-react-native'; // Stripe payment provider
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

// Splash screen component shown while app is checking login status
function SplashScreen() {
    return (
        <View style={styles.splashContainer}>
            {/* Logo Image */}
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
            {/* App Name */}
            <Text style={styles.splashText}>KID TOK</Text>
            {/* Loading spinner */}
            <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
        </View>
    );
}

// Main navigation component that handles login status and routing
function RootLayoutNav() {
    const router = useRouter(); // Used to navigate programmatically
    const segments = useSegments(); // Gives current route segments
    const [user, setUser] = useState<User | null>(null); // Stores currently logged-in user
    const [isInitializing, setIsInitializing] = useState(true); // True while checking login

    // This useEffect runs once: sets up Firebase auth listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
            setUser(authenticatedUser); // Set user state
            if (isInitializing) setIsInitializing(false); // Turn off splash once ready
        });
        return () => unsubscribe(); // Clean up the listener when component unmounts
    }, []);

    // This useEffect runs when login state or route changes
    useEffect(() => {
        if (isInitializing) return; // Wait until Firebase is done loading

        const inLoginScreen = segments[0] === 'login'; // Check if on login screen
        const inAppTabs = segments[0] === '(tabs)'; // Check if on main app tabs

        // If user is logged in and still on login screen, redirect to main app
        if (user && inLoginScreen) {
            router.replace('/(tabs)');
        }
        // If user is not logged in but trying to access the app, redirect to login
        else if (!user && inAppTabs) {
            router.replace('/login');
        }
    }, [user, segments, isInitializing, router]);

    // If still initializing (e.g., checking login), show splash screen
    if (isInitializing) {
        return <SplashScreen />;
    }

    // Define app screens for navigation
    return (
        <Stack>
            {/* Main app with bottom tabs, header hidden */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            {/* Login screen, header hidden */}
            <Stack.Screen name="login" options={{ headerShown: false }} />
            {/* PIN entry screen, shows as a modal with a title */}
            <Stack.Screen name="PinEntry" options={{ presentation: 'modal', title: 'Enter Parent PIN' }}/>
            
            {/* PIN setup screen with custom header background and text color */}
            <Stack.Screen
                name="PinSetup"
                options={{
                    presentation: 'modal',
                    title: 'Set Up Parent PIN',
                    headerStyle: { backgroundColor: '#FAE1EB' }, // Light shiny pink top bar
                    headerTintColor: '#333' // Dark text/icons for better visibility
                }}
            />
            
            {/* Settings screen shown as a modal */}
            <Stack.Screen name="Settings" options={{ presentation: 'modal', title: 'Parent Settings' }}/>
        </Stack>
    );
}

// Root layout that wraps everything in necessary providers
export default function RootLayout() {
    return (
        // StripeProvider enables payment functionality in app
        <StripeProvider
            publishableKey="pk_test_51Rqhw821QLgpKioedHaH31Oa1nOankJmOhJtj5isgCHrsmO5alNSmEcRbyThynzpF1JmUcvhIeGpjOBYB35PkynL009UH3wTfb" // Stripe test key (replace in production)
            merchantIdentifier="merchant.com.yourapp.name" // Used for Apple Pay (optional)
        >
            {/* Custom app-wide context provider for global settings */}
            <SettingsProvider>
                {/* Main navigation handler */}
                <RootLayoutNav />
            </SettingsProvider>
        </StripeProvider>
    );
}

// Styling used in SplashScreen
const styles = StyleSheet.create({
    splashContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    logo: { width: 150, height: 150 }, // Logo size
    splashText: { fontSize: 24, fontWeight: 'bold', marginTop: 20, color: '#007AFF' }, // App name style
});
