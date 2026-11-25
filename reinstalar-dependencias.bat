@echo off
REM Reinstala o node_modules do zero (use quando o Expo der "Unable to resolve module" ou "Cannot find module").
cd /d "%~dp0"
echo Apagando node_modules...
if exist node_modules rmdir /s /q node_modules
echo Verificando o cache do npm...
call npm cache verify
echo Instalando dependencias...
call npm install
if errorlevel 1 goto erro
echo Conferindo versoes com o Expo SDK...
call npx expo install --check
echo.
echo Pronto! Agora rode: npx expo start -c
pause
exit /b 0
:erro
echo.
echo A instalacao falhou. Feche o VS Code/terminais que usam a pasta, desative o antivirus para esta pasta e tente de novo.
pause
exit /b 1
