// Import core React and useState hook for state management
import React, { useState } from 'react';

// Import basic UI components from React Native
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Define how many digits the PIN should have
const PIN_LENGTH = 4;

// TypeScript interface for props this component will receive
interface PinInputProps {
    title: string;                        // Title text shown at top
    instruction?: string;                // Optional instruction message
    onSubmit: (pin: string) => void;     // Callback when full PIN is entered
    onCancel?: () => void;               // Optional callback for Cancel button
    showCancel?: boolean;                // Optional boolean to show/hide Cancel
}

// Main component definition using functional component syntax
const PinInput: React.FC<PinInputProps> = ({ 
    title, 
    instruction, 
    onSubmit, 
    onCancel, 
    showCancel = false // Default is false if not provided
}) => {
    const [pin, setPin] = useState<string>(''); // State to store entered PIN

    // Called when a number key is pressed
    const handleKeyPress = (num: string): void => {
        // Only allow input if length is less than 4
        if (pin.length < PIN_LENGTH) {
            const newPin = pin + num;     // Add new digit to the PIN
            setPin(newPin);               // Update state
            if (newPin.length === PIN_LENGTH) {
                // Wait for next tick so state update completes before submit
                setTimeout(() => {
                    onSubmit(newPin);     // Call the parent with full PIN
                    // Optional: clear PIN if needed after submit
                    // setPin('');
                }, 0);
            }
        }
    };

    // Called when back/delete key is pressed
    const handleDelete = (): void => {
        setPin((prevPin) => prevPin.slice(0, -1)); // Remove last digit
    };

    // Render the keypad layout dynamically
    const renderKeypad = () => {
        // 4 rows of keys, including Cancel and Delete
        const keys: string[][] = [
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            [showCancel ? 'Cancel' : '', '0', '<'], // < represents delete
        ];

        // Map through each row to generate buttons
        return keys.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
                {row.map((key) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.keypadButton, key === '' ? styles.emptyKey : {}]} // Hide empty key visually
                        onPress={() => {
                            if (key >= '0' && key <= '9') {
                                handleKeyPress(key); // Handle number press
                            } else if (key === '<') {
                                handleDelete();      // Handle delete
                            } else if (key === 'Cancel' && onCancel) {
                                onCancel();          // Call cancel handler
                            }
                        }}
                        disabled={key === ''} // Disable invisible buttons
                    >
                        {/* Show proper label for delete key */}
                        <Text style={styles.keypadText}>{key === '<' ? 'DEL' : key}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        ));
    };

    // JSX layout
    return (
        // Main container
        <View style={styles.container}>
            {/* Title shown at top */}
            <Text style={styles.title}>{title}</Text>

            {/* Optional instruction text */}
            {instruction && <Text style={styles.instruction}>{instruction}</Text>}

            {/* Dots showing PIN entry progress */}
            <View style={styles.pinDotsContainer}>
                {Array(PIN_LENGTH).fill(0).map((_, index) => (
                    <View
                        key={index}
                        style={[styles.pinDot, index < pin.length ? styles.pinDotFilled : {}]} // Fill dot if digit entered
                    />
                ))}
            </View>

            {/* Keypad buttons */}
            <View style={styles.keypadContainer}>
                {renderKeypad()} {/* Rendered keypad rows */}
            </View>

            {/* Hidden TextInput: optional for keyboard input/focus management */}
            <TextInput
                style={styles.hiddenInput}
                value={pin}
                maxLength={PIN_LENGTH}
                keyboardType="numeric"
                editable={false} // Prevent manual typing
                caretHidden={true} // Hide the cursor
            />
        </View>
    );
};

// ----------- Styling section -------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5', // Light gray background
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333', // Dark text
    },
    instruction: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    pinDotsContainer: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    pinDot: {
        width: 18,
        height: 18,
        borderRadius: 9,              // Make it a circle
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
        marginHorizontal: 10,
    },
    pinDotFilled: {
        backgroundColor: '#6200ee',  // Filled dot color (purple)
        borderColor: '#6200ee',
    },
    hiddenInput: { 
        width: 0, 
        height: 0, 
        position: 'absolute', // Offscreen
        top: -100, 
        left: -100
    },
    keypadContainer: {
        marginTop: 20,
        width: '80%',
        maxWidth: 300,
        alignItems: 'center',
    },
    keypadRow: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Even spacing between keys
        marginBottom: 15,
        width: '100%',
    },
    keypadButton: {
        width: 70,
        height: 70,
        borderRadius: 35,                 // Circular buttons
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',             // iOS shadow
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 3,                    // Android shadow
    },
    emptyKey: {
        backgroundColor: 'transparent', // No button background
        elevation: 0,
        shadowOpacity: 0,
    },
    keypadText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333', // Dark text
    }
});

// Export the component to use it in other files
export default PinInput;
