import { useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CameraViewComponent from '../components/CameraView';
// Sử dụng mock API thay vì API thực
//import { recognizeImageRealtime } from '../utils/mockVisionApi';
import { recognizeImageRealtime, updateApiConfig } from '../utils/visionApi';

export default function Home() {
  // Cập nhật cấu hình API với địa chỉ IP đúng 
  // Thay đổi giá trị này thành địa chỉ IP của máy tính chạy server
  useEffect(() => {
    updateApiConfig({
      baseURL: "http://<IP Host>:8080", // Sử dụng localhost với port 8080 thông qua adb reverse
      requestTimeout: 30000, // Tăng timeout để phòng mạng chậm
    });
  }, []);

  // Sử dụng hook ở cấp cao nhất của component
  const [permission, requestPermission] = useCameraPermissions();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'on' | 'off' | 'auto'>('off');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState('');
  const [lastImageUri, setLastImageUri] = useState<string | null>(null);
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  
  const cameraRef = useRef<any>(null);
  const recognitionInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hàm xin quyền truy cập camera
  const handleRequestPermissions = async () => {
    console.log('Yêu cầu quyền truy cập camera...');
    try {
      const result = await requestPermission();
      setHasPermission(result.granted);
      
      if (!result.granted) {
        Alert.alert(
          'Cần quyền truy cập',
          'Ứng dụng cần quyền truy cập vào camera để hoạt động.',
          [{ text: 'Đã hiểu' }]
        );
      }
    } catch (error) {
      console.error('Lỗi khi yêu cầu quyền:', error);
      Alert.alert('Lỗi', 'Không thể yêu cầu quyền truy cập camera.');
    }
  };

  // Xử lý quyền truy cập
  useEffect(() => {
    const checkPermission = async () => {
      // Kiểm tra nếu đã có thông tin quyền
      if (permission) {
        console.log('Trạng thái quyền:', permission.granted ? 'Đã cấp' : 'Chưa cấp');
        setHasPermission(permission.granted);
        
        // Nếu chưa được cấp quyền, yêu cầu
        if (!permission.granted) {
          await handleRequestPermissions();
        }
      }
    };
    
    checkPermission();
    
    // Đọc thông điệp chào mừng
    const welcomeMessage = 'Chào mừng đến với Trợ lý Thị giác. Ứng dụng sẽ giúp bạn nhận diện đối tượng xung quanh.';
    setTimeout(() => {
      Speech.speak(welcomeMessage, {
        language: 'vi-VN',
        pitch: 1.0,
        rate: 0.9,
      });
    }, 1000);
    
    // Dọn dẹp khi unmount
    return () => {
      if (recognitionInterval.current) {
        clearInterval(recognitionInterval.current);
      }
      Speech.stop();
    };
  }, [permission, requestPermission]);

  const handleCameraReady = () => {
    setIsCameraReady(true);
  };

  const handleToggleCameraType = () => {
    setType(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleToggleFlash = () => {
    setFlashMode(current => (current === 'off' ? 'on' : 'off'));
  };

  const handleTakePicture = async () => {
    if (!cameraRef.current || !isCameraReady) return;
    
    try {
      setIsRecognizing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: false,
      });
      
      setLastImageUri(photo.uri);
      
      // Nhận diện hình ảnh
      await recognizeImageRealtime(photo.uri, (result) => {
        setRecognitionResult(result);
        
        // Đọc kết quả
        Speech.stop();
        Speech.speak(result, {
          language: 'vi-VN',
          pitch: 1.0,
          rate: 0.9,
        });
      });
    } catch (error) {
      console.error('Lỗi khi chụp ảnh:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleStartRealtimeRecognition = () => {
    setIsRealtimeActive(true);
    
    // Thông báo cho người dùng
    Speech.speak('Đã bật chế độ nhận diện tự động', {
      language: 'vi-VN',
      pitch: 1.0,
      rate: 0.9,
    });
    
    // Thiết lập khoảng thời gian chụp ảnh và nhận diện
    recognitionInterval.current = setInterval(async () => {
      if (!cameraRef.current || !isCameraReady || isRecognizing) return;
      
      try {
        setIsRecognizing(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          skipProcessing: true,
        });
        
        setLastImageUri(photo.uri);
        
        // Nhận diện hình ảnh
        await recognizeImageRealtime(photo.uri, (result) => {
          if (result !== recognitionResult) {
            setRecognitionResult(result);
            
            // Đọc kết quả mới
            Speech.stop();
            Speech.speak(result, {
              language: 'vi-VN',
              pitch: 1.0,
              rate: 0.9,
            });
          }
        });
      } catch (error) {
        console.error('Lỗi nhận diện thời gian thực:', error);
      } finally {
        setIsRecognizing(false);
      }
    }, 5000); // 5 giây một lần
  };

  const handleStopRealtimeRecognition = () => {
    setIsRealtimeActive(false);
    if (recognitionInterval.current) {
      clearInterval(recognitionInterval.current);
      recognitionInterval.current = null;
    }
    
    // Thông báo cho người dùng
    Speech.speak('Đã tắt chế độ nhận diện tự động', {
      language: 'vi-VN',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <CameraViewComponent
        hasPermission={hasPermission}
        cameraRef={cameraRef}
        type={type}
        flashMode={flashMode}
        isRecognizing={isRecognizing}
        recognitionResult={recognitionResult}
        lastImageUri={lastImageUri}
        isCameraReady={isCameraReady}
        onCameraReady={handleCameraReady}
        onToggleCameraType={handleToggleCameraType}
        onToggleFlash={handleToggleFlash}
        onTakePicture={handleTakePicture}
        onStartRealtimeRecognition={handleStartRealtimeRecognition}
        onStopRealtimeRecognition={handleStopRealtimeRecognition}
        isRealtimeActive={isRealtimeActive}
        onRequestPermissions={handleRequestPermissions}
      />
    </SafeAreaProvider>
  );
} 