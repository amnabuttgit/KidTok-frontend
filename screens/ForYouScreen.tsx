// src/ForYouScreen.tsx - Complete Enhanced Version with User Details

// Import icons library from Expo
import { Ionicons } from '@expo/vector-icons';

// Import network checking library to see if internet is working
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Import audio and video components from Expo
import { Audio, AVPlaybackStatus, ResizeMode, Video } from 'expo-av';

// Import React and its hooks (useEffect, useRef, useState)
import React, { useEffect, useRef, useState } from 'react';

// Import all the UI components from React Native
import {
  ActivityIndicator, // Loading spinner
  Alert, // Pop-up messages
  FlatList, // Scrollable list
  Image, // Image component
  ListRenderItem, // Type for list items
  SafeAreaView, // Safe area for different phone screens
  StatusBar, // Phone's status bar
  StyleSheet, // For styling components
  Text, // Text component
  TouchableOpacity, // Touchable button
  View // Container component
} from 'react-native';

// Import custom settings context (manages app settings)
import { useSettings } from '../src/SettingsContext'; // Ensure correct path

// *** STRIPE AND USER DETAIL IMPORTS ***
// Import Firebase authentication
import { auth } from '@/firebaseConfig'; // Adjust path as needed

// Import Stripe payment library
import { useStripe } from '@stripe/stripe-react-native';

// Import app constants and device info
import Constants from 'expo-constants';
import * as Device from 'expo-device';

// --- Type Definitions ---
// Define what a video object looks like
interface VideoData {
  id: string;                    // Unique video ID
  url: string;                   // Video file URL
  thumbnailUrl?: string | null;  // Optional thumbnail image URL
  filename?: string;             // Optional filename
  duration?: number;             // Optional video length in seconds
  formattedDuration?: string;    // Optional formatted time like "2:30"
}

// Define what an error object looks like
interface VideoError {
  message: string;               // Error message text
}

// --- Network Utility ---
// Function to check if internet is working
const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    // Get network information
    const state: NetInfoState = await NetInfo.fetch();
    
    // Return true if connected, false if not (with fallback)
    return state.isConnected ?? false;
  } catch (error) {
    // Log error to console for debugging
    console.error('[checkNetworkStatus] Error:', error);
    
    // If checking fails, assume internet is working
    return true; // Fallback
  }
};

// --- Constants ---
// Maximum number of videos user can select for free
const MAX_FREE_SELECTIONS = 5;

// ForYouScreen.tsx
// url
const BACKEND_URL = 'https://mykidtokapp-aspeivism9-amnas-projects-9ac5f77d.vercel.app/api/videos';

// URL to create payment on backend server
const STRIPE_PAYMENT_URL = 'https://mykidtokapp-aspeivism9-amnas-projects-9ac5f77d.vercel.app/api/create-payment';

// URL to confirm payment on backend server
const STRIPE_CONFIRM_URL = 'https://mykidtokapp-aspeivism9-amnas-projects-9ac5f77d.vercel.app/api/confirm-payment';
// ...
// --- Component Definition ---
// Main component function (React.FC means React Function Component)
const ForYouScreen: React.FC = () => {
  
  // Get settings and functions from settings context
  const {
    restrictedMode: isApprovedOnlyMode,    // Rename restrictedMode to isApprovedOnlyMode
    isLoading: settingsLoading,            // Rename isLoading to settingsLoading
    selectedVideos,                        // Array of selected video IDs
    toggleVideoSelectionInContext,         // Function to select/unselect videos
  } = useSettings();

  // *** STRIPE HOOK ***
  // Get Stripe payment functions
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // State to store filtered videos for display
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([]);
  
  // State to track if user has premium (simulated)
  const [hasSimulatedPremium, setHasSimulatedPremium] = useState<boolean>(false);
  
  // State to track if payment is in progress
  const [isSimulatingPurchase, setIsSimulatingPurchase] = useState<boolean>(false);

  // State to track which video is currently playing
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  
  // State to track which video user wants to play
  const [videoToPlayIntent, setVideoToPlayIntent] = useState<string | null>(null);

  // Reference to store video player components (useRef persists across re-renders)
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  
  // Reference to cache video status to avoid repeated API calls
  const videoStatusCache = useRef<{ [key: string]: AVPlaybackStatus | null }>({});

  // State to store videos from backend server
  const [backendVideos, setBackendVideos] = useState<VideoData[]>([]);
  
  // State to track if videos are loading from backend
  const [backendLoading, setBackendLoading] = useState<boolean>(true);
  
  // State to store any error from backend
  const [backendError, setBackendError] = useState<string | null>(null);

  // State to store video-specific errors
  const [videoErrors, setVideoErrors] = useState<{ [key: string]: VideoError }>({});
  
  // State to track how many times each video has been retried
  const [retryAttempts, setRetryAttempts] = useState<{ [key: string]: number }>({});
  
  // Maximum number of times to retry a failed video
  const MAX_RETRY_ATTEMPTS = 3;

  // useEffect runs when component first loads
  useEffect(() => {
    // Set up audio settings for the app
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,        // Don't allow recording on iOS
      playsInSilentModeIOS: true,       // Play audio even in silent mode on iOS
      shouldDuckAndroid: true,          // Lower other app volumes on Android
      staysActiveInBackground: false,   // Don't play when app is in background
    }).catch(e => console.error("Failed to set audio mode:", e)); // Log error if fails
  }, []); // Empty array means this runs once when component loads

  // useEffect to fetch videos from backend when component loads
  useEffect(() => {
    // Define async function to fetch videos
    const fetchVideos = async () => {
      // Set loading to true
      setBackendLoading(true);
      
      // Clear any previous errors
      setBackendError(null);
      
      // Check if internet is working
      if (!(await checkNetworkStatus())) {
        // If no internet, set error and stop loading
        setBackendError("No internet connection.");
        setBackendLoading(false);
        return;
      }
      
      try {
        // Create abort controller to cancel request if it takes too long
        const controller = new AbortController();
        
        // Set timeout to cancel request after 15 seconds
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        // Make request to backend with timeout
        const response = await fetch(BACKEND_URL, { signal: controller.signal });
        
        // Clear the timeout since request completed
        clearTimeout(timeoutId);
        
        // Check if response is successful (status 200-299)
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        // Convert response to JSON
        const data = await response.json();
        
        // Filter and clean the video data
        const validVideos: VideoData[] = (data.videos || data)  // Use data.videos or fallback to data
          .filter((v: any) => v && v.id && v.url)              // Only keep videos with id and url
          .map((v: any) => ({ ...v, thumbnailUrl: v.thumbnailUrl || null })); // Ensure thumbnailUrl is null if missing
        
        // Update state with valid videos
        setBackendVideos(validVideos);
        
      } catch (err: any) {
        // Handle different types of errors
        const msg = err.name === 'AbortError' ? 'Request timed out.' : err.message;
        
        // Set error message and clear videos
        setBackendError(msg);
        setBackendVideos([]);
        
      } finally {
        // Always set loading to false when done (success or error)
        setBackendLoading(false);
      }
    };
    
    // Call the function
    fetchVideos();
  }, []); // Empty array means this runs once when component loads

  // useEffect to filter videos based on approved mode
  useEffect(() => {
    // If in approved mode, only show selected videos, otherwise show all
    const videosToDisplay = isApprovedOnlyMode
      ? backendVideos.filter(v => selectedVideos.includes(v.id))  // Filter to only selected videos
      : backendVideos;                                            // Show all videos
    
    // Update filtered videos state
    setFilteredVideos(videosToDisplay);
    
  }, [selectedVideos, isApprovedOnlyMode, backendVideos]); // Run when these values change

  // useEffect to handle video playback when user wants to play a video
  useEffect(() => {
    // Define async function to handle playback
    const performPlayback = async () => {
      // If no video is requested, do nothing
      if (!videoToPlayIntent) return;

      // Get the video ID that user wants to play
      const videoId = videoToPlayIntent;
      
      // Get the video player component for this video
      const videoRef = videoRefs.current[videoId];
      
      // Find the video data for this ID
      const videoData = backendVideos.find(v => v.id === videoId);

      // Clear any previous errors for this video
      setVideoErrors(prev => { 
        const n = { ...prev };      // Copy previous errors
        delete n[videoId];          // Remove error for this video
        return n;                   // Return new object
      });

      // Check if video player is ready
      if (!videoRef) {
        // If player not ready, show error and stop
        handleVideoError(videoId, new Error("Player not ready."));
        setVideoToPlayIntent(null);
        return;
      }
      
      // Check if video data exists
      if (!videoData?.url) {
        // If no video data, show error and stop
        handleVideoError(videoId, new Error("Video data missing."));
        setVideoToPlayIntent(null);
        return;
      }

      // Set this video as currently playing
      setCurrentlyPlaying(videoId);
      
      // Variable to store timeout ID
      let loadingTimeoutId: number | null = null;

      try {
        // Set timeout to handle slow loading videos (12 seconds)
        loadingTimeoutId = setTimeout(() => {
          // If loading takes too long, show error and unload video
          handleVideoError(videoId, new Error('Video loading timed out.'));
          videoRef.unloadAsync();
        }, 12000) as any;

        // Unload any previous video
        await videoRef.unloadAsync();
        
        // Load the new video and start playing
        const status = await videoRef.loadAsync({ uri: videoData.url }, { shouldPlay: true });

        // Clear timeout since loading completed
        if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
        
        // Cache the video status
        videoStatusCache.current[videoId] = status;

        // Check if video loaded successfully but isn't playing
        if (status.isLoaded && !status.isPlaying) {
          // Start playing the video
          await videoRef.playAsync();
        } else if (!status.isLoaded) {
          // If video failed to load, throw error
          throw new Error('Failed to load video content.');
        }
        
      } catch (error: any) {
        // Clear timeout if error occurs
        if (loadingTimeoutId) clearTimeout(loadingTimeoutId);
        
        // Handle the error
        handleVideoError(videoId, error);
        
      } finally {
        // Always clear the play intent when done
        setVideoToPlayIntent(null);
      }
    };

    // If there's a video to play, start playback
    if (videoToPlayIntent) {
      performPlayback();
    }
    
  }, [videoToPlayIntent, backendVideos]); // Run when these values change

  // Function to handle video errors
  const handleVideoError = (videoId: string, error: Error) => {
    // Get error message or use default
    const errorMessage = error.message || 'An unknown video error occurred';
    
    // Add error to video errors state
    setVideoErrors(prev => ({ ...prev, [videoId]: { message: errorMessage } }));
    
    // Increment retry attempts for this video
    setRetryAttempts(prev => ({ ...prev, [videoId]: (prev[videoId] || 0) + 1 }));
    
    // If this video was playing, stop it
    if (currentlyPlaying === videoId) setCurrentlyPlaying(null);
    
    // If this video was requested to play, clear the request
    if (videoToPlayIntent === videoId) setVideoToPlayIntent(null);
    
    // Clear cached status for this video
    videoStatusCache.current[videoId] = null;
  };

  // Function to retry a failed video
  const retryVideo = (videoId: string) => {
    // Clear error for this video
    setVideoErrors(prev => { 
      const n = { ...prev }; 
      delete n[videoId]; 
      return n; 
    });
    
    // Reset retry attempts for this video
    setRetryAttempts(prev => { 
      const n = { ...prev }; 
      delete n[videoId]; 
      return n; 
    });
    
    // Request to play this video again
    setVideoToPlayIntent(videoId);
  };

  // Function to handle play/pause when user taps video
  const handleVideoPlayback = async (videoId: string) => {
    // Check internet connection first
    if (!(await checkNetworkStatus())) {
      handleVideoError(videoId, new Error('No internet connection.'));
      return;
    }
    
    // Get video player for this video
    const videoRef = videoRefs.current[videoId];
    
    // If this video is already playing
    if (currentlyPlaying === videoId && videoRef) {
      try {
        // Get current status (from cache or player)
        const status = videoStatusCache.current[videoId] || await videoRef.getStatusAsync();
        
        // If status exists and video is loaded
        if (status && "isLoaded" in status && status.isLoaded) {
          // Update cache
          videoStatusCache.current[videoId] = status;
          
          // Toggle play/pause based on current state
          if (status.isPlaying) 
            await videoRef.pauseAsync();     // If playing, pause it
          else 
            await videoRef.playAsync();      // If paused, play it
        } else {
          // If not loaded, request to play
          setVideoToPlayIntent(videoId);
        }
      } catch (error: any) {
        // Handle any errors during play/pause
        handleVideoError(videoId, error);
      }
    } else {
      // If different video is playing, pause it first
      if (currentlyPlaying && videoRefs.current[currentlyPlaying]) {
        videoRefs.current[currentlyPlaying]?.pauseAsync().catch(e => console.warn(e.message));
      }
      
      // Request to play new video
      setVideoToPlayIntent(videoId);
    }
  };

  // Function to handle selecting/unselecting videos
  const handleToggleVideoSelection = (videoId: string) => {
    // Don't allow selection during payment process
    if (isSimulatingPurchase) return;
    
    // Check if video is currently selected
    const isCurrentlySelected = selectedVideos.includes(videoId);
    
    // If trying to select new video, at limit, and not premium
    if (!isCurrentlySelected && selectedVideos.length >= MAX_FREE_SELECTIONS && !hasSimulatedPremium) {
      // Show premium upgrade alert
      Alert.alert(
        "Unlock Premium",                                           // Title
        `Select up to ${MAX_FREE_SELECTIONS} videos for free. Unlock unlimited access for $9.99?`,  // Message
        [
          { text: "Not Now", style: "cancel" },                     // Cancel button
          { text: "Unlock Premium", onPress: () => handleStripePayment(() => toggleVideoSelectionInContext(videoId)) }  // Purchase button
        ]
      );
      return;
    }
    
    // Otherwise, toggle selection normally
    toggleVideoSelectionInContext(videoId);
  };

  // *** ENHANCED STRIPE PAYMENT FUNCTION WITH USER DETAILS ***
  // Function to handle premium purchase
  const handleStripePayment = async (callbackAfterUnlock?: () => void) => {
    // Check internet connection
    if (!(await checkNetworkStatus())) {
      Alert.alert("Error", "No internet connection. Please check your network and try again.");
      return;
    }

    // Set payment in progress
    setIsSimulatingPurchase(true);

    try {
      // Get current user from Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated. Please log in first.');
      }

      // Gather user and device information
      const userDetails = {
        userId: currentUser.uid,                                                    // Firebase user ID
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',  // User name with fallbacks
        userEmail: currentUser.email || '',                                        // User email
        deviceInfo: JSON.stringify({                                               // Device info as JSON string
          deviceName: Device.deviceName || 'Unknown Device',                       // Phone name
          deviceType: Device.deviceType || 'Unknown',                              // Phone type
          osName: Device.osName || 'Unknown OS',                                   // Operating system
          osVersion: Device.osVersion || 'Unknown Version',                        // OS version
          modelName: Device.modelName || 'Unknown Model',                          // Phone model
          brand: Device.brand || 'Unknown Brand'                                   // Phone brand
        }),
        appVersion: Constants.expoConfig?.version || '1.0.0',                      // App version
        purchaseType: 'unlimited_video_selection'                                  // What user is buying
      };

      // Log user details (for debugging)
      console.log('Creating payment intent with user details:', {
        userId: userDetails.userId,
        userName: userDetails.userName,
        userEmail: userDetails.userEmail
      });

      // Step 1: Create payment intent on backend with user details
      const response = await fetch(STRIPE_PAYMENT_URL, {
        method: 'POST',                                           // POST request
        headers: {
          'Content-Type': 'application/json',                     // JSON content
        },
        body: JSON.stringify(userDetails),                        // Send user details
      });

      // Check if request was successful
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
      }

      // Get payment data from response
      const paymentData = await response.json();
      console.log('Payment intent created successfully:', paymentData.paymentIntentId);

      // Step 2: Initialize payment sheet with user information
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Kid Tok Premium',                   // Store name
        paymentIntentClientSecret: paymentData.clientSecret,      // Payment secret from backend
        defaultBillingDetails: {                                  // Pre-fill user info
          name: userDetails.userName,                             // User name
          email: userDetails.userEmail,                           // User email
        },
        appearance: {                                             // Customize payment sheet look
          colors: {
            primary: '#007AFF',                                   // Primary color (blue)
            background: '#ffffff',                                // Background color (white)
            componentBackground: '#f6f6f6',                       // Component background (light gray)
          },
          shapes: {
            borderRadius: 12,                                     // Rounded corners
          },
        },
        applePay: {                                               // Apple Pay settings
          merchantCountryCode: 'US',                              // Country code
        },
        googlePay: {                                              // Google Pay settings
          merchantCountryCode: 'US',                              // Country code
          testEnv: __DEV__,                                       // Use test environment in development
        },
      });

      // Check if payment sheet initialization failed
      if (initError) {
        console.error('Payment sheet initialization error:', initError);
        throw new Error(initError.message);
      }

      console.log('Payment sheet initialized successfully');

      // Step 3: Present payment sheet to user
      const { error: paymentError } = await presentPaymentSheet();

      // Check if payment was cancelled or failed
      if (paymentError) {
        console.log('Payment cancelled or failed:', paymentError.message);
        
        // Only show error if not cancelled by user
        if (paymentError.code !== 'Canceled') {
          Alert.alert('Payment Failed', paymentError.message);
        }
        return;
      }

      // Step 4: Payment successful - confirm with backend
      console.log('Payment successful! Confirming with backend...');
      
      try {
        // Send confirmation to backend
        const confirmResponse = await fetch(STRIPE_CONFIRM_URL, {
          method: 'POST',                                         // POST request
          headers: {
            'Content-Type': 'application/json',                   // JSON content
          },
          body: JSON.stringify({                                  // Send payment info
            paymentIntentId: paymentData.paymentIntentId,         // Payment ID
            userId: userDetails.userId,                           // User ID
          }),
        });

        // Check confirmation result
        if (confirmResponse.ok) {
          console.log('Payment confirmed with backend');
        } else {
          console.warn('Failed to confirm payment with backend, but payment was successful');
        }
      } catch (confirmError) {
        console.warn('Error confirming payment with backend:', confirmError);
        // Don't fail the whole flow if confirmation fails
      }

      // Step 5: Update local state and show success message
      setHasSimulatedPremium(true);                               // Mark user as premium
      
      // Show success message
      Alert.alert(
        "Premium Unlocked! 🎉",                                   // Title with emoji
        `Welcome to Kid Tok Premium, ${userDetails.userName}!\n\nYou now have unlimited access to select videos. Thank you for your purchase!\n\nReceipt sent to: ${userDetails.userEmail}`,  // Message
        [
          { 
            text: "Great!",                                       // Button text
            onPress: () => {
              console.log('Premium activated for user:', userDetails.userId);
              callbackAfterUnlock?.();                            // Call callback if provided
            }
          }
        ]
      );

      // Log successful purchase for analytics
      console.log('Premium purchase completed:', {
        userId: userDetails.userId,
        userName: userDetails.userName,
        paymentIntentId: paymentData.paymentIntentId,
        amount: paymentData.amount,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Payment process error:', error);
      
      // Show specific error messages based on error type
      let errorMessage = 'Something went wrong. Please try again.';      // Default message
      
      // Check for specific error types and customize message
      if (error.message.includes('User not authenticated')) {
        errorMessage = 'Please log in to make a purchase.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('email')) {
        errorMessage = 'Please ensure your account has a valid email address.';
      } else if (error.message) {
        errorMessage = error.message;                             // Use actual error message
      }
      
      // Show error alert
      Alert.alert("Payment Error", errorMessage);
      
    } finally {
      // Always stop payment process indicator
      setIsSimulatingPurchase(false);
    }
  };

  // Function to format time in MM:SS format
  const formatTime = (seconds?: number): string => {
    // Check if seconds is valid
    if (seconds === undefined || isNaN(seconds)) return 'N/A';
    
    // Calculate minutes and seconds
    const mins = Math.floor(seconds / 60);                        // Get whole minutes
    const secs = Math.floor(seconds % 60);                        // Get remaining seconds
    
    // Return formatted string with zero padding
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Function to render each video item in the list
  const renderVideoItem: ListRenderItem<VideoData> = ({ item }) => {
    // Don't render if item is invalid
    if (!item?.id || !item.url) return null;

    // Check various states for this video
    const isSelected = selectedVideos.includes(item.id);          // Is video selected?
    const isPlaying = currentlyPlaying === item.id;               // Is video playing?
    const hasError = !!videoErrors[item.id];                      // Does video have error?
    const canRetry = (retryAttempts[item.id] || 0) < MAX_RETRY_ATTEMPTS;  // Can retry?
    const showVideoPlayer = isPlaying && !hasError;               // Should show video player?

    return (
      <View style={styles.videoContainer}>
        <View style={styles.videoPlayerContainer}>
          {/* Show thumbnail and controls when not playing video */}
          {!showVideoPlayer && (
            <>
              {/* Thumbnail image */}
              <Image
                source={
                  hasError 
                    ? require('../assets/video-error.png')                              // Error image
                    : (item.thumbnailUrl 
                        ? { uri: item.thumbnailUrl }                                    // Thumbnail from URL
                        : require('../assets/video-placeholder.png'))                  // Placeholder image
                }
                style={styles.thumbnail}
                resizeMode="cover"
              />
              
              {/* Error overlay or play button */}
              {hasError ? (
                <View style={styles.errorOverlay}>
                  {/* Error icon */}
                  <Ionicons name="alert-circle" size={40} color="#FF3B30" />
                  
                  {/* Error message */}
                  <Text style={styles.errorTextDetail}>
                    {videoErrors[item.id]?.message || 'Video error'}
                  </Text>
                  
                  {/* Retry button or max retries message */}
                  {canRetry ? (
                    <TouchableOpacity style={styles.retryButton} onPress={() => retryVideo(item.id)}>
                      <Ionicons name="refresh" size={16} color="#FFF" />
                      <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.maxRetriesText}>Max retries reached.</Text>
                  )}
                </View>
              ) : (
                // Play button when no error
                <TouchableOpacity style={styles.playButton} onPress={() => handleVideoPlayback(item.id)}>
                  <Ionicons name="play-circle" size={60} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Video player component */}
          <Video
            ref={r => { videoRefs.current[item.id] = r; }}          // Store reference to this video player
            style={[
              styles.videoPlayer, 
              !showVideoPlayer && { height: 0, opacity: 0 }        // Hide when not playing
            ]}
            useNativeControls={false}                               // Don't show default controls
            resizeMode={ResizeMode.CONTAIN}                         // Fit video in container
            onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
              // Cache the status
              videoStatusCache.current[item.id] = status;
              
              // Handle status changes for currently playing video
              if (item.id === currentlyPlaying && status.isLoaded) {
                  // Check for errors in status
                  if ('error' in status && typeof status.error === 'string') {
                    handleVideoError(item.id, new Error(status.error));
                  } 
                  // Check if video finished playing
                  else if (status.didJustFinish) {
                    videoRefs.current[item.id]?.unloadAsync();      // Unload video
                    setCurrentlyPlaying(null);                      // Clear currently playing
                  }
              }
            }}
            onError={(errorMsg: string) => {
              // Handle video player errors
              handleVideoError(item.id, new Error(`Player error: ${errorMsg}`));
            }}
          />

          {/* Overlay with duration and select button */}
          <View style={styles.controlsOverlay}>
            {/* Duration display */}
            <Text style={styles.duration}>
              {item.formattedDuration || formatTime(item.duration)}
            </Text>
            
            {/* Video selection checkbox */}
            <TouchableOpacity style={styles.selectButton} onPress={() => handleToggleVideoSelection(item.id)}>
              <Ionicons 
                name={isSelected ? "checkbox" : "checkbox-outline"}  // Filled or outline checkbox
                size={28} 
                color={isSelected ? "#4CAF50" : "#FFFFFF"}           // Green if selected, white if not
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Video info section */}
        <View style={styles.videoInfoContainer}>
          {/* Video title */}
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.filename || 'Untitled Video'}
          </Text>
          
          {/* Pause button when video is playing */}
          {isPlaying && !hasError && (
            <TouchableOpacity style={styles.playPauseButton} onPress={() => handleVideoPlayback(item.id)}>
              <Ionicons name="pause-circle" size={32} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Show loading screen while settings or videos are loading, or payment is processing
  if (settingsLoading || backendLoading || isSimulatingPurchase) {
    // Determine what message to show
    let msg = isSimulatingPurchase ? "Processing Payment..." : settingsLoading ? "Settings..." : "Videos...";
    
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>{msg}</Text>
      </SafeAreaView>
    );
  }
  
  // Show error screen if backend failed
  if (backendError) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        {/* Error icon */}
        <Ionicons name="cloud-offline" size={40} color="red" />
        
        {/* Error title */}
        <Text style={styles.errorTitle}>Error</Text>
        
        {/* Error message */}
        <Text>{backendError}</Text>
      </SafeAreaView>
    );
  }

  // Main screen UI when everything is loaded
  return (
    <SafeAreaView style={styles.container}>
      {/* Phone status bar styling */}
      <StatusBar barStyle="dark-content" />
      
      {/* Header section */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Kid Tok</Text>
      </View>
      
      {/* Info section showing current mode and limits */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {isApprovedOnlyMode
            ? `Approved Videos (${selectedVideos.length})`                     // Show approved count
            : hasSimulatedPremium
              ? "All Videos (Premium) 💎"                                      // Show premium status
              : `All Videos (Free: ${Math.max(0, MAX_FREE_SELECTIONS - selectedVideos.length)} left)`  // Show remaining free selections
          }
        </Text>
      </View>
      
      {/* Video list */}
      <FlatList
        data={filteredVideos}                                   // Videos to display
        renderItem={renderVideoItem}                            // Function to render each video
        keyExtractor={item => item.id}                          // Use video ID as unique key
        contentContainerStyle={styles.videosList}              // Styling for list container
        ListEmptyComponent={                                    // What to show when list is empty
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No videos to show.</Text>
          </View>
        }
        extraData={{ selectedVideos, currentlyPlaying, videoErrors }}  // Extra data to trigger re-renders
        initialNumToRender={4}                                  // Render 4 items initially
        maxToRenderPerBatch={4}                                 // Render 4 items per batch
        windowSize={8}                                          // Keep 8 items in memory
      />
    </SafeAreaView>
  );
};

// Styles for all components (StyleSheet creates optimized styles)
const styles = StyleSheet.create({
  // Main container style
  container: { 
    flex: 1,                                                    // Take full screen
    backgroundColor: '#f8f8f8'                                  // Light gray background
  },
  
  // Header section style
  header: { 
    flexDirection: 'row',                                       // Arrange children horizontally
    justifyContent: 'space-between',                            // Space items evenly
    alignItems: 'center',                                       // Center items vertically
    paddingHorizontal: 15,                                      // Horizontal padding
    paddingVertical: 10,                                        // Vertical padding
    borderBottomWidth: 1,                                       // Bottom border width
    borderBottomColor: '#f0f0f0',                               // Bottom border color
    backgroundColor: '#fff'                                     // White background
  },
  
  // App title style
  appTitle: { 
    fontSize: 20,                                               // Font size
    fontWeight: 'bold',                                         // Bold text
    color: '#333'                                               // Dark gray color
  },
  
  // Loading container style
  loadingContainer: { 
    flex: 1,                                                    // Take full screen
    justifyContent: 'center',                                   // Center vertically
    alignItems: 'center',                                       // Center horizontally
    padding: 20,                                                // Padding around content
  },
  
  // Loading text style
  loadingText: { 
    marginTop: 10,                                              // Space above text
    fontSize: 16,                                               // Font size
    textAlign: 'center',                                        // Center text
  },
  
  // Error title style
  errorTitle: { 
    color: '#FF3B30',                                           // Red color
    fontSize: 18,                                               // Font size
    textAlign: 'center',                                        // Center text
    fontWeight: 'bold',                                         // Bold text
    marginBottom: 5,                                            // Space below
  },
  
  // Error text detail style
  errorTextDetail: { 
    color: '#FFFFFF',                                           // White color
    fontSize: 14,                                               // Font size
    textAlign: 'center',                                        // Center text
    fontWeight: '500',                                          // Medium weight
    paddingHorizontal: 10,                                      // Horizontal padding
  },
  
  // Info container style
  infoContainer: { 
    padding: 12,                                                // Padding around content
    backgroundColor: '#f0f0f0',                                 // Light gray background
    borderBottomWidth: 1,                                       // Bottom border width
    borderBottomColor: '#e0e0e0'                                // Bottom border color
  },
  
  // Info text style
  infoText: { 
    fontSize: 14,                                               // Font size
    color: '#555',                                              // Medium gray color
    fontWeight: '500'                                           // Medium weight
  },
  
  // Videos list style
  videosList: { 
    paddingBottom: 20,                                          // Bottom padding
    paddingHorizontal: 12,                                      // Horizontal padding
  },
  
  // Empty container style
  emptyContainer: { 
    flex: 1,                                                    // Take available space
    justifyContent: 'center',                                   // Center vertically
    alignItems: 'center',                                       // Center horizontally
    padding: 20,                                                // Padding around content
    marginTop: 40                                               // Top margin
  },
  
  // Empty text style
  emptyText: { 
    fontSize: 16,                                               // Font size
    color: '#999',                                              // Light gray color
    textAlign: 'center'                                         // Center text
  },
  
  // Video container style
  videoContainer: { 
    marginBottom: 16,                                           // Space below each video
    backgroundColor: '#fff',                                    // White background
    borderRadius: 12,                                           // Rounded corners
    overflow: 'hidden',                                         // Hide content outside borders
    shadowColor: '#000',                                        // Shadow color
    shadowOffset: { width: 0, height: 2 },                     // Shadow position
    shadowOpacity: 0.1,                                         // Shadow transparency
    shadowRadius: 4,                                            // Shadow blur
    elevation: 3                                                // Android shadow
  },
  
  // Video player container style
  videoPlayerContainer: { 
    position: 'relative',                                       // Allow absolute positioning of children
    backgroundColor: '#000',                                    // Black background
    overflow: 'hidden',                                         // Hide content outside borders
    aspectRatio: 16 / 9                                         // 16:9 aspect ratio
  },
  
  // Thumbnail style
  thumbnail: { 
    width: '100%',                                              // Full width
    height: '100%',                                             // Full height
    backgroundColor: '#1c1c1e',                                 // Dark background
  },
  
  // Play button style
  playButton: { 
    position: 'absolute',                                       // Position absolutely
    top: '50%',                                                 // Center vertically
    left: '50%',                                                // Center horizontally
    transform: [{ translateX: -30 }, { translateY: -30 }],     // Adjust for button size
  },
  
  // Video player style
  videoPlayer: { 
    width: '100%',                                              // Full width
    height: '100%',                                             // Full height
    backgroundColor: '#000',                                    // Black background
  },
  
  // Controls overlay style
  controlsOverlay: { 
    position: 'absolute',                                       // Position absolutely
    top: 0,                                                     // Align to top
    left: 0,                                                    // Align to left
    right: 0,                                                   // Align to right
    bottom: 0,                                                  // Align to bottom
    flexDirection: 'row',                                       // Arrange children horizontally
    justifyContent: 'space-between',                            // Space items apart
    alignItems: 'flex-start',                                   // Align to top
    padding: 8,                                                 // Padding around content
    pointerEvents: 'box-none',                                  // Allow touches to pass through
  },
  
  // Duration text style
  duration: { 
    backgroundColor: 'rgba(0,0,0,0.6)',                         // Semi-transparent black background
    color: '#fff',                                              // White text
    paddingVertical: 4,                                         // Vertical padding
    paddingHorizontal: 8,                                       // Horizontal padding
    borderRadius: 4,                                            // Rounded corners
    fontSize: 12,                                               // Font size
    fontWeight: '500',                                          // Medium weight
  },
  
  // Select button style
  selectButton: { 
    backgroundColor: 'rgba(0,0,0,0.3)',                         // Semi-transparent black background
    borderRadius: 8,                                            // Rounded corners
    padding: 4                                                  // Padding around content
  },
  
  // Video info container style
  videoInfoContainer: { 
    padding: 12,                                                // Padding around content
    flexDirection: 'row',                                       // Arrange children horizontally
    justifyContent: 'space-between',                            // Space items apart
    alignItems: 'center'                                        // Center items vertically
  },
  
  // Video title style
  videoTitle: { 
    fontSize: 15,                                               // Font size
    fontWeight: '500',                                          // Medium weight
    color: '#333',                                              // Dark gray color
    flex: 1,                                                    // Take available space
    marginRight: 8,                                             // Right margin
  },
  
  // Play/pause button style
  playPauseButton: { 
    marginLeft: 10                                              // Left margin
  },
  
  // Error overlay style
  errorOverlay: { 
    position: 'absolute',                                       // Position absolutely
    top: 0,                                                     // Align to top
    left: 0,                                                    // Align to left
    right: 0,                                                   // Align to right
    bottom: 0,                                                  // Align to bottom
    backgroundColor: 'rgba(0,0,0,0.75)',                        // Semi-transparent black background
    justifyContent: 'center',                                   // Center vertically
    alignItems: 'center',                                       // Center horizontally
    padding: 15                                                 // Padding around content
  },
  
  // Retry button style
  retryButton: { 
    backgroundColor: '#007AFF',                                 // Blue background
    paddingHorizontal: 20,                                      // Horizontal padding
    paddingVertical: 8,                                         // Vertical padding
    borderRadius: 20,                                           // Rounded corners
    flexDirection: 'row',                                       // Arrange children horizontally
    alignItems: 'center',                                       // Center items vertically
    justifyContent: 'center',                                   // Center items horizontally
    marginTop: 12,                                              // Top margin
  },
  
  // Retry text style
  retryText: { 
    color: '#fff',                                              // White color
    fontSize: 14,                                               // Font size
    fontWeight: '500',                                          // Medium weight
    marginLeft: 5                                               // Left margin
  },
  
  // Max retries text style
  maxRetriesText: { 
    color: '#bbb',                                              // Light gray color
    fontSize: 12,                                               // Font size
    marginTop: 8,                                               // Top margin
    textAlign: 'center',                                        // Center text
  }
});

// Export component so it can be used in other files
export default ForYouScreen;