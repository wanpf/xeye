@echo OFF

pushd %~dp0
set crt_dir=%CD%
popd

set OPENSSL_CONF=%crt_dir%\openssl.cnf
set KEY=%crt_dir%\pkey.pem
set CA_KEY=%crt_dir%\CA.key
set CA_CRT=%crt_dir%\CA.crt
set OPENSSL=%crt_dir%\openssl.exe

%OPENSSL% req -new -key %KEY% -subj "/C=CN/ST=GD/L=GZ/O=flomesh/OU=IT/CN=%1/emailAddress=it@flomesh.io" -addext "subjectAltName=DNS:%1" | %OPENSSL% x509 -req -copy_extensions copyall -CA %CA_CRT% -CAkey %CA_KEY% -text
