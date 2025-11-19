// Import your custom HeartAlert popup component (for success message)
import HeartAlert from '@/src/components/HeartAlert';

// Import icon set from Expo (used for eye icons)
import { Ionicons } from '@expo/vector-icons';

// Import font loading function to load custom font
import { useFonts } from 'expo-font';

// Import navigation hook to move between screens
import { useRouter } from 'expo-router';

// Import React and state hook
import React, { useState } from 'react';

// Import UI components from React Native
import {
    ActivityIndicator, // Spinner while saving
    Alert, // Show error alerts
    ImageBackground, // Set screen background image
    KeyboardAvoidingView, // Adjust layout for keyboard
    Platform, SafeAreaView, // Respect screen safe areas
    StyleSheet, Text, // Styling and text
    TextInput, // PIN input fields
    TouchableOpacity, // Pressable buttons
    View // Container
} from 'react-native';

// Import the custom app settings hook (where PIN is saved)
import { useSettings } from './SettingsContext';

// Functional component definition using TypeScript
const PinSetupScreen: React.FC = () => {
    const router = useRouter(); // Used to navigate to next screen
    const { savePin } = useSettings(); // Function from SettingsContext to store the PIN

    // State for storing entered PIN
    const [pin, setPin] = useState<string>('');

    // State for confirming PIN
    const [confirmPin, setConfirmPin] = useState<string>('');

    // State to show/hide loading spinner
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Toggle to show/hide original PIN
    const [isPinVisible, setIsPinVisible] = useState(false);

    // Toggle to show/hide confirm PIN
    const [isConfirmPinVisible, setIsConfirmPinVisible] = useState(false);

    // State to manage visibility of custom alert popup
    const [alertVisible, setAlertVisible] = useState(false);

    // Alert title and message (used in HeartAlert)
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

    // Load custom font from assets
    const [fontsLoaded] = useFonts({
        'AppFont': require('@/assets/Lora-Regular.ttf'),
    });

    // Function that runs when user taps "Set PIN"
    const handleSetPin = async (): Promise<void> => {
        // Validate if inputs are filled
        if (!pin || !confirmPin) {
            return Alert.alert('Missing Input', 'Please enter and confirm your PIN.');
        }

        // Validate PIN length
        if (pin.length < 4) {
            return Alert.alert('PIN Too Short', 'PIN must be at least 4 digits.');
        }

        // Check if both PIN entries match
        if (pin !== confirmPin) {
            return Alert.alert('PIN Mismatch', 'The PINs you entered do not match.');
        }

        // Show loading spinner
        setIsLoading(true);
        try {
            // Try to save the PIN using context
            const success = await savePin(pin);

            if (success) {
                // If saved successfully, show the HeartAlert popup
                setAlertTitle('Success');
                setAlertMessage('Parent PIN has been set successfully.');
                setAlertVisible(true); // Show the alert
            } else {
                // Throw error if save failed
                throw new Error('Failed to save PIN');
            }
        } catch (error) {
            // Show error if something went wrong
            Alert.alert('Error', 'Could not set PIN. Please try again.');
        } finally {
            // Always stop spinner at the end
            setIsLoading(false);
        }
    };

    // Wait for font to load before rendering
    if (!fontsLoaded) {
        return null;
    }

    // --- UI Rendering Starts Here ---
    return (
        <>
            {/* Background image for the screen */}
            <ImageBackground
                source={require('../assets/download.jpeg')}
                style={styles.background}
                resizeMode="cover"
            >
                {/* Wrap content within safe area for notch devices */}
                <SafeAreaView style={styles.container}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.keyboardAvoidingView}
                    >
                        {/* Container for the form */}
                        <View style={styles.formContainer}>
                            {/* Title and description */}
                            <Text style={styles.title}>Set Parent PIN</Text>
                            <Text style={styles.instruction}>
                                Create a PIN that will be required to access parent settings.
                            </Text>

                            {/* --- PIN Input Field --- */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter PIN"
                                    value={pin}
                                    onChangeText={setPin}
                                    keyboardType="numeric"
                                    maxLength={6}
                                    secureTextEntry={!isPinVisible} // Hide/show PIN
                                />
                                {/* Eye icon to toggle visibility */}
                                <TouchableOpacity onPress={() => setIsPinVisible(!isPinVisible)} style={styles.icon}>
                                    <Ionicons
                                        name={isPinVisible ? "eye-outline" : "eye-off-outline"}
                                        size={24}
                                        color="#8e8e93"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* --- Confirm PIN Input --- */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm PIN"
                                    value={confirmPin}
                                    onChangeText={setConfirmPin}
                                    keyboardType="numeric"
                                    maxLength={6}
                                    secureTextEntry={!isConfirmPinVisible}
                                />
                                {/* Eye icon for confirm PIN */}
                                <TouchableOpacity onPress={() => setIsConfirmPinVisible(!isConfirmPinVisible)} style={styles.icon}>
                                    <Ionicons
                                        name={isConfirmPinVisible ? "eye-outline" : "eye-off-outline"}
                                        size={24}
                                        color="#8e8e93"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* --- Button or Loading Spinner --- */}
                            {isLoading ? (
                                <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
                            ) : (
                                <TouchableOpacity style={styles.button} onPress={handleSetPin}>
                                    <Text style={styles.buttonText}>Set PIN</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </ImageBackground>

            {/* Heart Alert Component for success message */}
            <HeartAlert
                visible={alertVisible}
                title={alertTitle}
                message={alertMessage}
                onClose={() => {
                    setAlertVisible(false); // Hide alert
                    router.replace({ pathname: '/Settings' }); // Navigate to Settings page
                }}
            />
        </>
    );
};

// -------- Styles --------
const styles = StyleSheet.create({
    background: { flex: 1 },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    keyboardAvoidingView: { width: '100%', alignItems: 'center' },
    formContainer: {
        width: '85%',
        backgroundColor: 'rgba(250, 225, 235, 0.92)', // Light pinkish background
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8, // Android shadow
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#333',
        fontFamily: 'AppFont',
    },
    instruction: {
        fontSize: 15,
        marginBottom: 25,
        textAlign: 'center',
        color: '#666',
        fontFamily: 'AppFont',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 15,
        width: '100%',
        marginBottom: 15,
    },
    input: {
        flex: 1,
        height: 55,
        paddingHorizontal: 20,
        fontSize: 18,
        fontFamily: 'AppFont',
    },
    icon: {
        padding: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 30,
        marginTop: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'AppFont',
    },
    loader: {
        marginTop: 20,
    },
});

// Export the component so it can be used in navigation
export default PinSetupScreen;
