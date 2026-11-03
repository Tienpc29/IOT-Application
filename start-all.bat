@echo off
chcp 65001 > nul
echo ===================================================
echo     KHỞI ĐỘNG HỆ THỐNG IOT PTIT (FULL SYSTEM)
echo ===================================================
echo.

echo [1/3] Đang mở Mosquitto Broker (cổng 1884)...
start "Mosquitto MQTT Broker" cmd /k "mosquitto -p 1884 -v"

timeout /t 2 > nul

echo [2/3] Đang mở Spring Boot Backend (cổng 8080)...
start "Spring Boot Backend" cmd /k "cd backend && mvn spring-boot:run"

timeout /t 3 > nul

echo [3/3] Đang mở React Frontend (cổng 5173)...
start "React Frontend" cmd /k "npm run dev"

echo.
echo ===================================================
echo  TẤT CẢ CÁC DỊCH VỤ ĐÃ ĐƯỢC MỞ THÀNH CÔNG!
echo  - Frontend React:  http://localhost:5173
echo  - Backend API:     http://localhost:8080
echo  - Mosquitto Broker: cổng 1884
echo ===================================================
echo.
pause

