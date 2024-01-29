@echo OFF

powershell (Import-Certificate -FilePath "crt\CA.crt" -CertStoreLocation Cert:\LocalMachine\Root)

