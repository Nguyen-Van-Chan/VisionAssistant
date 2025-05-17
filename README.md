# VisionAssistant - Trợ lý Thị giác

## 🌏 English | [Tiếng Việt](#tiếng-việt)

## Introduction

VisionAssistant is a mobile application built with Expo/React Native that helps users recognize objects and scenes through computer vision. The app captures images from the camera and uses a language model (LLM) to provide descriptions of what's being seen, making it particularly useful for visually impaired users.

## System Requirements

- Node.js v18.19.1 or later
- Expo CLI
- Android/iOS device or emulator
- LLama server running locally (for inference)

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the LLama server (must be done before running the app)

   ```bash
   # Navigate to your LLama server directory and run:
   .\llama-server.exe -hf ngxson/Vintern-1B-v3_5-GGUF --chat-template vicuna --host 0.0.0.0
   ```

   This will start the LLama server on port 8080

3. Connect your device using ADB (if testing on a physical device)

   ```bash
   # Set up port forwarding to allow your device to communicate with the local server
   adb reverse tcp:8080 tcp:8080
   ```

4. Start the Expo app

   ```bash
   npx expo run:android
   npx expo start --dev-client
   npx expo start
   ```

5. Open the app on your device:
   - Scan the QR code with Expo Go (iOS) or Camera app (Android)
   - Press 'a' to open on Android emulator
   - Press 'i' to open on iOS simulator

## Key Features

- Real-time object and scene recognition
- Voice feedback with text-to-speech
- Support for both front and back cameras
- Flash control for low-light environments
- Automatic recognition mode

## Troubleshooting

- If you encounter connection issues when testing on a physical device, ensure that:
  - The ADB port forwarding command is correctly executed
  - The LLama server is running on port 8080
  - Your device is properly connected to your development machine

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)

---

# <a name="tiếng-việt"></a>Tiếng Việt

## Giới thiệu

VisionAssistant là ứng dụng di động được xây dựng bằng Expo/React Native giúp người dùng nhận diện đối tượng và cảnh vật thông qua thị giác máy tính. Ứng dụng chụp ảnh từ camera và sử dụng mô hình ngôn ngữ (LLM) để cung cấp mô tả về những gì đang được nhìn thấy, đặc biệt hữu ích cho người khiếm thị.

## Yêu cầu hệ thống

- Node.js v18.19.1 trở lên
- Expo CLI
- Thiết bị hoặc giả lập Android/iOS
- Server LLama chạy cục bộ (cho việc suy luận)

## Bắt đầu

1. Cài đặt các thư viện phụ thuộc

   ```bash
   npm install
   ```

2. Khởi động server LLama (phải thực hiện trước khi chạy ứng dụng)

   ```bash
   # Di chuyển đến thư mục server LLama của bạn và chạy:
   .\llama-server.exe -hf ngxson/Vintern-1B-v3_5-GGUF --chat-template vicuna --host 0.0.0.0

   ```

   Lệnh này sẽ khởi động server LLama trên cổng 8080

3. Kết nối thiết bị của bạn bằng ADB (nếu kiểm tra trên thiết bị thật)

   ```bash
   # Thiết lập chuyển tiếp cổng để cho phép thiết bị của bạn giao tiếp với server cục bộ
   adb reverse tcp:8080 tcp:8080
   ```

4. Khởi động ứng dụng Expo

   ```bash
   npx expo run:android
   npx expo install expo-dev-client 
   npx expo start
   ```

5. Mở ứng dụng trên thiết bị của bạn:
   - Quét mã QR bằng Expo Go (iOS) hoặc ứng dụng Camera (Android)
   - Nhấn 'a' để mở trên giả lập Android
   - Nhấn 'i' để mở trên giả lập iOS

## Tính năng chính

- Nhận diện đối tượng và cảnh vật theo thời gian thực
- Phản hồi bằng giọng nói với chức năng chuyển văn bản thành giọng nói
- Hỗ trợ cả camera trước và sau
- Điều khiển đèn flash cho môi trường ánh sáng yếu
- Chế độ nhận diện tự động

## Xử lý sự cố

- Nếu bạn gặp vấn đề kết nối khi kiểm tra trên thiết bị thật, hãy đảm bảo rằng:
  - Lệnh chuyển tiếp cổng ADB được thực hiện chính xác
  - Server LLama đang chạy trên cổng 8080
  - Thiết bị của bạn được kết nối đúng cách với máy tính phát triển của bạn

## Tìm hiểu thêm

- [Tài liệu Expo](https://docs.expo.dev/)
- [Tài liệu React Native](https://reactnative.dev/docs/getting-started)