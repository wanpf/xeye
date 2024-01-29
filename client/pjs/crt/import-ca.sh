#!/bin/zsh

# install CA 
security authorizationdb write com.apple.trust-settings.admin allow >/dev/null 2>&1
security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain CA.crt >/dev/null 2>&1
security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain crt/CA.crt >/dev/null 2>&1

