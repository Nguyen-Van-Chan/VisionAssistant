import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CameraViewProps {
  hasPermission: boolean | null;
  cameraRef: React.RefObject<any>;
  type: 'front' | 'back';
  flashMode: 'on' | 'off' | 'auto';
  isRecognizing: boolean;
  recognitionResult: string;
  lastImageUri: string | null;
  isCameraReady: boolean;
  onCameraReady: () => void;
  onToggleCameraType: () => void;
  onToggleFlash: () => void;
  onTakePicture: () => void;
  onStartRealtimeRecognition: () => void;
  onStopRealtimeRecognition: () => void;
  isRealtimeActive: boolean;
  onRequestPermissions?: () => void;
}

const CameraViewComponent: React.FC<CameraViewProps> = ({
  hasPermission,
  cameraRef,
  type,
  flashMode,
  isRecognizing,
  recognitionResult,
  lastImageUri,
  isCameraReady,
  onCameraReady,
  onToggleCameraType,
  onToggleFlash,
  onTakePicture,
  onStartRealtimeRecognition,
  onStopRealtimeRecognition,
  isRealtimeActive,
  onRequestPermissions,
}) => {
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4AA3F2" />
        <Text style={styles.text}>Đang yêu cầu quyền truy cập camera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-outline" size={64} color="#FF6B6B" />
        <Text style={styles.text}>Không có quyền truy cập camera</Text>
        <Text style={styles.subText}>
          Vui lòng cấp quyền truy cập camera trong cài đặt ứng dụng
        </Text>
        {onRequestPermissions && (
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={onRequestPermissions}
          >
            <Text style={styles.permissionButtonText}>Thử lại</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={type}
          flash={flashMode}
          onCameraReady={onCameraReady}
        >
          {isRecognizing && (
            <View style={styles.recognizingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.recognizingText}>Đang nhận diện...</Text>
            </View>
          )}
        </CameraView>
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Kết quả nhận diện:</Text>
          <Text style={styles.resultText}>{recognitionResult || 'Chưa có kết quả'}</Text>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={onToggleFlash}
          >
            <Ionicons 
              name={flashMode === 'off'
                ? 'flash-off' 
                : 'flash'} 
              size={28} 
              color="white" 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.captureButton}
            onPress={onTakePicture}
            disabled={isRecognizing || !isCameraReady}
          >
            <View style={[
              styles.captureButtonInner, 
              (isRecognizing || !isCameraReady) && styles.captureButtonDisabled
            ]} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={onToggleCameraType}
          >
            <Ionicons name="camera-reverse-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[
            styles.realtimeButton, 
            isRealtimeActive && styles.realtimeButtonActive
          ]}
          onPress={isRealtimeActive ? onStopRealtimeRecognition : onStartRealtimeRecognition}
        >
          <Text style={styles.realtimeButtonText}>
            {isRealtimeActive ? 'Dừng nhận diện tự động' : 'Bắt đầu nhận diện tự động'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 20,
    margin: 16,
    marginBottom: 8,
  },
  camera: {
    flex: 1,
  },
  recognizingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recognizingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 8,
  },
  controlsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  resultContainer: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultTitle: {
    color: '#4AA3F2',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    color: 'white',
    fontSize: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlButton: {
    backgroundColor: '#333333',
    borderRadius: 40,
    height: 60,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 40,
    height: 80,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    backgroundColor: 'white',
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  realtimeButton: {
    backgroundColor: '#4AA3F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  realtimeButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  realtimeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  text: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  subText: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  permissionButton: {
    backgroundColor: '#4AA3F2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraViewComponent; 