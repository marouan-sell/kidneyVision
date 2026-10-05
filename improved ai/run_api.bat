@echo off
title KidneyVision AI - Master Medical API Service
echo =========================================================================
echo               KidneyVision AI - Master 4-Class API Service
echo         Architecture: ConvNeXt-Tiny SOTA ^| Dataset: 15,810 CT Scans
echo =========================================================================
echo.
echo [INFO] Demarrage de l'API Flask sur http://localhost:5000/api/predict ...
python api_service\web_api_service.py
pause
