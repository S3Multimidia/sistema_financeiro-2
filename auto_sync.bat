@echo off
title S3 Financeiro - Auto Sync (Git)
color 0A

:loop
cls
echo ========================================================
echo   S3 FINANCEIRO - SINCRONIZACAO AUTOMATICA (TIPO DRIVE)
echo ========================================================
echo.
echo [!] Monitorando alteracoes para enviar a nuvem...
echo.

:: Verifica se ha mudancas
git status | find "nothing to commit" > nul
if %errorlevel%==0 (
    echo [OK] Nenhuma alteracao pendente. Aguardando...
) else (
    echo [!] Alteracoes detectadas! Sincronizando...
    echo.
    git add .
    git commit -m "auto: sincronizacao automatica via script"
    git push
    echo.
    echo [SUCESSO] Alteracoes enviadas para a nuvem!
    echo Data: %date% %time%
)

:: Espera 30 segundos antes de verificar de novo
timeout /t 30 > nul
goto loop
