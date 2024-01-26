@echo off

set HOMEFOLDER=%LocalAppData%\desktop-accelerator

tasklist /fi "imagename eq pipy.exe" |find ":" > nul
if errorlevel 0 (
	pushd "%CD%"
	CD /D "%HOMEFOLDER%
	START "终端网络加速器" /B pipy.exe pjs\main.js
	popd
	exit /B
)