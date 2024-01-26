#!/bin/sh

openssl req -new -key crt/pkey.pem -subj "/C=CN/ST=GD/L=GZ/O=flomesh/OU=IT/CN=$1/emailAddress=it@flomesh.io" -addext "subjectAltName=DNS:$1" | openssl x509 -req -copy_extensions copyall -CA crt/CA.crt -CAkey crt/CA.key -text

