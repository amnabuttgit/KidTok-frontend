// Import Ionicons for using vector icons in the UI
import { Ionicons } from '@expo/vector-icons';
// Import router for navigation between screens
import { useRouter } from 'expo-router';
// React core and hooks
import React, { useState } from 'react';
// React Native components for UI and user interaction
import {
    ActivityIndicator, Alert, Modal, SafeAreaView, ScrollView,
    StyleSheet, Switch, Text, TouchableOpacity, View
} from 'react-native';
// Import custom hook to access app-wide settings
import { useSettings } from './SettingsContext';

const SettingsScreen: React.FC = () => {
    const router = useRouter(); // Used for navigating between screens

    // Destructure values and functions from context
    const { restrictedMode, toggleRestrictedMode, clearSettings } = useSettings();

    const [isLoading, setIsLoading] = useState<boolean>(false); // Loading state for async actions
    const [showResetModal, setShowResetModal] = useState<boolean>(false); // State to control the reset modal visibility

    // Function to reset only settings (not app data)
    const handleResetSettings = async (): Promise<void> => {
        setIsLoading(true); // Show loader
        try {
            await clearSettings(); // Clear PIN, selected videos, and restricted mode
            Alert.alert('Success', 'All settings have been reset.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') } // Navigate to main app tabs
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to reset settings.'); // Error handling
        } finally {
            setIsLoading(false); // Hide loader
            setShowResetModal(false); // Close modal
        }
    };

    // Function to reset everything including auth (like a full logout and wipe)
    const handleClearAppData = async (): Promise<void> => {
        setIsLoading(true);
        Alert.alert(
            "Are you sure?",
            "This will clear all app data and log you out.",
            [
                { text: "Cancel", style: "cancel", onPress: () => setIsLoading(false) },
                {
                    text: "Clear Data", style: "destructive",
                    onPress: async () => {
                        try {
                            await clearSettings(); // Clear all AsyncStorage values
                            router.replace('/login'); // Go to login screen
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear app data.');
                        } finally {
                            setIsLoading(false);
                            setShowResetModal(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* --- Content Controls Section --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Content Controls</Text>
                    <View style={styles.settingRow}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingTitle}>Restricted Mode</Text>
                            <Text style={styles.settingDescription}>
                                When enabled, only approved videos will be shown.
                            </Text>
                        </View>
                        <Switch
                            value={restrictedMode}
                            onValueChange={toggleRestrictedMode}
                            disabled={isLoading} // Disable interaction during loading
                        />
                    </View>
                </View>

                {/* --- Account Section --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>

                    {/* Change Parent PIN Option */}
                    <TouchableOpacity style={styles.buttonRow} onPress={() => router.push('/PinSetup')}>
                        <Text style={styles.buttonText}>Change Parent PIN</Text>
                        <Ionicons name="chevron-forward" size={24} color="#007AFF" />
                    </TouchableOpacity>

                    {/* Reset Settings Option */}
                    <TouchableOpacity style={styles.buttonRow} onPress={() => setShowResetModal(true)}>
                        <Text style={styles.dangerButtonText}>Reset Settings</Text>
                        <Ionicons name="warning-outline" size={24} color="#DC3545" />
                    </TouchableOpacity>
                </View>

                {/* --- App Information Section --- */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Information</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Version</Text>
                        <Text style={styles.infoValue}>1.0.0</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Build</Text>
                        <Text style={styles.infoValue}>2023.05.1</Text>
                    </View>
                </View>

                {/* --- Modal for Reset Options --- */}
                <Modal
                    visible={showResetModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowResetModal(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Reset Options</Text>
                            <Text style={styles.modalText}>Please select what you would like to reset:</Text>

                            {/* Option: Reset only app settings */}
                            <TouchableOpacity
                                style={styles.modalButton}
                                onPress={handleResetSettings}
                                disabled={isLoading}
                            >
                                <Text style={styles.modalButtonText}>Reset Settings Only</Text>
                            </TouchableOpacity>

                            {/* Option: Clear all data and logout */}
                            <TouchableOpacity
                                style={[styles.modalButton, styles.dangerButton]}
                                onPress={handleClearAppData}
                                disabled={isLoading}
                            >
                                <Text style={styles.dangerButtonText}>Clear All App Data</Text>
                            </TouchableOpacity>

                            {/* Optional loader when a reset is in progress */}
                            {isLoading && (
                                <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
                            )}

                            {/* Cancel Button */}
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowResetModal(false)}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
};

// Stylesheet for visual structure and design
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },

    section: {
        backgroundColor: '#fff',
        marginBottom: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 10,
        marginHorizontal: 15,
    },

    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        marginTop: 5,
        color: '#333',
    },

    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },

    settingTextContainer: { flex: 1, paddingRight: 10 },

    settingTitle: { fontSize: 16, fontWeight: '500', marginBottom: 4 },

    settingDescription: { fontSize: 14, color: '#666' },

    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },

    buttonText: { fontSize: 16, color: '#007AFF' },
    dangerButtonText: { fontSize: 16, color: '#DC3545' },

    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },

    infoLabel: { fontSize: 16, color: '#333' },
    infoValue: { fontSize: 16, color: '#666' },

    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },

    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    modalText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },

    modalButton: {
        width: '100%',
        paddingVertical: 12,
        marginVertical: 5,
        borderRadius: 5,
        backgroundColor: '#f8f9fa',
        alignItems: 'center',
    },

    modalButtonText: { fontSize: 16, color: '#007AFF', fontWeight: '500' },
    dangerButton: { backgroundColor: '#fff5f5' },
    cancelButton: { backgroundColor: '#f0f0f0' },
    cancelButtonText: { fontSize: 16, color: '#555' },
    loader: { marginVertical: 10 },
});

// Exporting screen as default
export default SettingsScreen;
