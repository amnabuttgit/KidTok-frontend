// Import a custom component that shows a styled alert (heart design)
import HeartAlert from '@/src/components/HeartAlert';

// Import font loading hook from Expo
import { useFonts } from 'expo-font';

// Import router for navigation
import { useRouter } from 'expo-router';

// Import React and useState hook
import React, { useState } from 'react';

// Import all necessary React Native components
import {
    ImageBackground, // For setting background image
    KeyboardAvoidingView, // To avoid keyboard overlapping inputs
    Platform, SafeAreaView, // SafeAreaView avoids notches
    StyleSheet, Text, // Style and text rendering
    TouchableOpacity, // For pressable buttons
    View // Basic view container
} from 'react-native';

// Import a 3rd party OTP input package for PIN entry boxes
import OtpInput from 'react-native-otp-textinput';

// Import custom settings hook that manages app settings, including PIN verification
import { useSettings } from './SettingsContext';

// Define the component using TypeScript's React.FC (Functional Component)
const PinEntryScreen: React.FC = () => {
    const router = useRouter(); // Used for navigation
    const { verifyPin } = useSettings(); // Get function to verify PIN from global settings context

    // State to store user-entered PIN
    const [enteredPin, setEnteredPin] = useState<string>('');

    // State to count how many failed attempts the user has made
    const [attempts, setAttempts] = useState<number>(0);

    // State to control visibility of the HeartAlert popup
    const [alertVisible, setAlertVisible] = useState(false);

    // State to hold alert's title text
    const [alertTitle, setAlertTitle] = useState('');

    // State to hold alert's message text
    const [alertMessage, setAlertMessage] = useState('');

    // Boolean to check if alert is for success (used for logic after alert closes)
    const [isSuccess, setIsSuccess] = useState(false);

    // Load custom font 'Lora-Regular.ttf' and assign it to 'AppFont'
    const [fontsLoaded] = useFonts({
        'AppFont': require('@/assets/Lora-Regular.ttf'),
    });

    // Function called when user presses "Unlock"
    const handleVerifyPin = (): void => {
        // If PIN is not 4 digits, show invalid alert
        if (enteredPin.length < 4) {
            setAlertTitle('Invalid PIN');
            setAlertMessage('Please enter a complete 4-digit PIN.');
            setIsSuccess(false);
            setAlertVisible(true);
            return;
        }

        // Check if the entered PIN matches the saved one
        const isCorrect = verifyPin(enteredPin);
        
        if (isCorrect) {
            // If correct PIN, show success alert
            setAlertTitle('Success!');
            setAlertMessage('PIN verified successfully.');
            setIsSuccess(true); // Used to redirect later
            setAlertVisible(true); // Show alert
        } else {
            // Increment number of failed attempts
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);

            // Clear input so user can try again
            setEnteredPin('');

            // Show failure message with remaining attempts or block access
            if (newAttempts >= 3) {
                setAlertTitle('Too Many Attempts');
                setAlertMessage('Please try again later.');
            } else {
                setAlertTitle('Incorrect PIN');
                setAlertMessage(`You have ${3 - newAttempts} attempts remaining.`);
            }

            setIsSuccess(false); // Mark as failed
            setAlertVisible(true); // Show alert
        }
    };

    // Function that runs when the HeartAlert closes
    const handleAlertClose = () => {
        setAlertVisible(false); // Hide alert

        // If PIN was correct, navigate to Settings page
        if (isSuccess) {
            router.replace({ pathname: '/Settings' });
        } 
        // If too many attempts, go back to previous screen
        else if (attempts >= 3) {
            router.back();
        }
    };

    // Don’t show UI until the custom font is loaded
    if (!fontsLoaded) {
        return null;
    }

    // UI layout starts here
    return (
        <>
            {/* Set background image for the entire screen */}
            <ImageBackground
                source={require('../assets/bear.png')} // Background image
                style={styles.background}
                resizeMode="cover"
            >
                {/* Wrapper to avoid top notch and corners */}
                <SafeAreaView style={styles.container}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"} // Adjust layout for keyboard
                        style={styles.keyboardAvoidingView}
                    >
                        <View style={styles.formContainer}>
                            {/* Heading text */}
                            <Text style={styles.title}>Enter Parent PIN</Text>
                            
                            {/* PIN input boxes using OTP component */}
                            <OtpInput
                                handleTextChange={setEnteredPin} // Store PIN in state
                                tintColor="#4CAF50"              // Active border color
                                offTintColor="#d3d3d3"           // Inactive border color
                                containerStyle={styles.pinInputContainer}
                                textInputStyle={styles.pinBox}
                                defaultValue={enteredPin}
                            />

                            {/* Unlock button triggers PIN check */}
                            <TouchableOpacity style={styles.unlockButton} onPress={handleVerifyPin}>
                                <Text style={styles.unlockButtonText}>Unlock</Text>
                            </TouchableOpacity>

                            {/* Cancel button navigates back */}
                            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </ImageBackground>

            {/* Custom alert shown on success/failure */}
            <HeartAlert
                visible={alertVisible}
                title={alertTitle}
                message={alertMessage}
                onClose={handleAlertClose} // When user presses OK
            />
        </>
    );
};

// ------------------ StyleSheet for UI ------------------
const styles = StyleSheet.create({
    background: { 
        flex: 1 
    },
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    keyboardAvoidingView: { 
        width: '100%', 
        alignItems: 'center' 
    },
    formContainer: {
        width: '90%',
        backgroundColor: 'rgba(255, 255, 255, 0.92)', // Slightly transparent white background
        paddingVertical: 30,
        paddingHorizontal: 25,
        borderRadius: 20, // Rounded corners
        alignItems: 'center',
        shadowColor: "#000", // Drop shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8, // Android shadow
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333',
        fontFamily: 'AppFont', // Use custom font
    },
    pinInputContainer: {
        marginBottom: 30,
    },
    pinBox: {
        height: 55,
        width: 55,
        borderWidth: 2,
        borderRadius: 10,
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'AppFont',
    },
    unlockButton: {
        backgroundColor: '#4CAF50', // Green color
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 30,
        elevation: 5, // Android shadow
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    unlockButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'AppFont',
    },
    cancelButton: {
        marginTop: 20,
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#555',
        fontFamily: 'AppFont',
    },
});

// Export the component so it can be used in navigation
export default PinEntryScreen;
