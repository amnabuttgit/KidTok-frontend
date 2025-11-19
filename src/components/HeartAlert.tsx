// src/components/HeartAlert.tsx

import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface HeartAlertProps {
    visible: boolean;
    title: string;
    message: string;
    onClose: () => void;
}

const HeartAlert: React.FC<HeartAlertProps> = ({ visible, title, message, onClose }) => {
    // Load the font
    const [fontsLoaded] = useFonts({
        'Lora-Regular': require('@/assets/Lora-Regular.ttf'),
    });

    if (!fontsLoaded) {
        return null; // Don't render until font is loaded
    }
    
    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.heartContainer}>
                    {/* This creates the heart shape */}
                    <Ionicons name="heart" size={300} color="#FAE1EB" style={styles.heartIcon} />
                    
                    {/* This is the content inside the heart */}
                    <View style={styles.contentContainer}>
                        <Text style={styles.title}>{title}</Text>
                        <Text style={styles.message}>{message}</Text>
                        <TouchableOpacity style={styles.button} onPress={onClose}>
                            <Text style={styles.buttonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartContainer: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartIcon: {
        position: 'absolute',
    },
    contentContainer: {
        width: '70%',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        fontFamily: 'Lora-Regular',
    },
    message: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'Lora-Regular',
    },
    button: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    buttonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Lora-Regular',
    },
});

export default HeartAlert;