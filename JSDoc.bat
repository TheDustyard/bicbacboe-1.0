@echo off
where jsdoc >nul 2>nul
if %errorlevel%==1 (
    echo JSDoc not installed!
    echo Type "npm i -g jsdoc" in an Administrator CMD to install JSDoc!
    goto end
)
rmdir /S /Q "out/"
echo Generating a JSDoc
call jsdoc client.js utils.js
echo Finished
echo If no error has occured, you can open "out/index.html".
goto end
:end
pause