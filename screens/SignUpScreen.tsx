// Import Firebase authentication object from your custom firebaseConfig file
import { auth } from '@/firebaseConfig';

// Import navigation hook from Expo Router
import { useRouter } from 'expo-router';

// Import Firebase authentication functions for login, signup, and password reset
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';

// Import core React and React Native components/hooks
import React, { useState } from 'react';

// Import all necessary UI components from React Native
import {
    ActivityIndicator, // For showing a loading spinner
    Alert, // For showing pop-up alerts
    ImageBackground, // For setting a background image
    KeyboardAvoidingView, // For keeping the keyboard from overlapping inputs
    Platform, // Detects whether the platform is iOS or Android
    SafeAreaView, // Ensures UI doesn't go into phone's notch
    StatusBar, // Allows customizing the phone’s status bar
    StyleSheet, // Used for styling the screen
    Text, // For rendering text
    TextInput, // For email and password input
    TouchableOpacity, // For clickable buttons
    View // Basic container/view component
} from 'react-native';

// Start of the SignUpScreen functional component
export default function SignUpScreen() {
    const router = useRouter(); // Hook used to navigate between screens

    // State to store user-entered email
    const [email, setEmail] = useState('');

    // State to store user-entered password
    const [password, setPassword] = useState('');

    // State to control loading spinner visibility
    const [isLoading, setIsLoading] = useState(false);

    // State to toggle between login and sign-up screens
    const [isLoginView, setIsLoginView] = useState(true);

    // Function to handle user login or signup
    const handleAuth = async () => {
        // If email or password is empty, show alert and stop
        if (!email || !password) {
            return Alert.alert('Missing Fields', 'Please enter both email and password.');
        }

        setIsLoading(true); // Show loading spinner while Firebase authenticates

        try {
            if (isLoginView) {
                // If in login mode, try to sign in the user using Firebase
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // If in sign-up mode, create a new user using Firebase
                await createUserWithEmailAndPassword(auth, email, password);

                // Show success alert and switch to login view after signup
                Alert.alert('Sign Up Successful', 'Your account has been created! You can now sign in.', [
                    { text: 'OK', onPress: () => setIsLoginView(true) } // Switch to login after pressing OK
                ]);
            }
        } catch (error: any) {
            // Log error and show error message to user
            console.error("FIREBASE AUTH ERROR:", error);
            Alert.alert('Authentication Error', error.message);
        } finally {
            setIsLoading(false); // Hide loading spinner after process completes
        }
    };
    
    // Function to send password reset email
    const handlePasswordReset = async () => {
        // If email field is empty, show alert
        if (!email) return Alert.alert('Reset Password', 'Please enter your email address first.');

        try {
            // Firebase function to send reset email
            await sendPasswordResetEmail(auth, email);

            // Show confirmation alert
            Alert.alert('Reset Password', 'A password reset link has been sent to your email.');
        } catch (error: any) {
            // Show error if email is invalid or any other issue
            Alert.alert('Error', error.message);
        }
    };

    // JSX to return UI layout
    return (
        <ImageBackground
            // Set a background image for the screen
            source={require('../assets/background.png')}
            style={styles.background}
            resizeMode="cover" // Image resizing behavior
        >
            {/* Set status bar text color to light */}
            <StatusBar barStyle="light-content" />

            {/* Wrapper for safe display (avoids notches) */}
            <SafeAreaView style={styles.container}>

                {/* Allows screen to move up when keyboard is open */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"} // Padding for iOS, height for Android
                    style={{ flex: 1 }}
                >
                    {/* -------- Top Heading Section -------- */}
                    <View style={styles.topContainer}>
                        {/* Show screen title based on login or sign-up */}
                        <Text style={styles.title}>{isLoginView ? 'Welcome Back' : 'Register'}</Text>

                        {/* Show subtitle instruction */}
                        <Text style={styles.subtitle}>
                            {isLoginView ? 'Login to your account' : 'Create your new account'}
                        </Text>
                    </View>

                    {/* -------- Form Section -------- */}
                    <View style={styles.formContainer}>
                        {/* Email input field */}
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#8e8e93"
                            value={email}                 // Binds state to input
                            onChangeText={setEmail}       // Updates state on change
                            keyboardType="email-address"  // Brings up email keyboard
                            autoCapitalize="none"         // Prevents first letter from auto-capitalizing
                        />

                        {/* Password input field */}
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            placeholderTextColor="#8e8e93"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry                // Hides password text
                        />

                        {/* Show "Forgot Password" only if in login mode */}
                        {isLoginView && (
                            <TouchableOpacity style={styles.forgotPasswordButton} onPress={handlePasswordReset}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        )}

                        {/* Submit button (login or sign-up) */}
                        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={isLoading}>
                            {/* Show spinner while loading, otherwise show button text */}
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isLoginView ? 'Login' : 'Sign Up'}</Text>}
                        </TouchableOpacity>

                        {/* Link to toggle between login and sign-up screens */}
                        <TouchableOpacity style={styles.linkButton} onPress={() => setIsLoginView(!isLoginView)}>
                            <Text style={styles.linkText}>
                                {isLoginView ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </ImageBackground>
    );
}

// -------- StyleSheet: Defines styles for each component --------
const styles = StyleSheet.create({
    background: {
        flex: 1, // Fill entire screen
    },
    container: {
        flex: 1, // Fill space within SafeAreaView
    },
    topContainer: {
        flex: 1, // Take 1 part of screen height
        justifyContent: 'center', // Center vertically
        paddingHorizontal: 20, // Space on left and right
    },
    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#fff', // White text color
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#eee', // Light gray
        textAlign: 'center',
        marginTop: 10,
    },
    formContainer: {
        position: 'absolute', // Position at bottom of screen
        bottom: 0,
        left: 0,
        right: 0,
        height: '65%', // Takes up 65% of screen height
        backgroundColor: 'white',
        borderTopLeftRadius: 40,  // Rounded top corners
        borderTopRightRadius: 40,
        padding: 30,              // Padding inside container
        alignItems: 'center',
    },
    input: {
        width: '100%',
        backgroundColor: '#F6F7FB', // Light background for input
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        fontSize: 16,
        color: '#333',             // Dark text
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',     // Align to right
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#0066cc',          // Blue link
        fontSize: 14,
    },
    button: {
        width: '100%',
        backgroundColor: '#0C4A6E', // Dark teal/blue color
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',             // White text
        fontSize: 16,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 20,
    },
    linkText: {
        color: '#0C4A6E',          // Same dark blue as button
        fontSize: 14,
        fontWeight: '500',
    },
});
