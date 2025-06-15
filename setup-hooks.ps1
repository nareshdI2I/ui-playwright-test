# Create pre-push hook that calls our PowerShell script
$hookContent = @"
#!/bin/sh
pwsh.exe -NoProfile -ExecutionPolicy Bypass -File ".git/hooks/pre-push.ps1"
"@

# Ensure the hooks directory exists
if (-not (Test-Path ".git/hooks")) {
    New-Item -ItemType Directory -Path ".git/hooks" -Force
}

# Write the hook file
$hookContent | Out-File -FilePath ".git/hooks/pre-push" -Encoding ASCII -NoNewline

# Make the hook executable (though Windows doesn't really need this)
if (Test-Path ".git/hooks/pre-push") {
    Write-Host "Git pre-push hook installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Failed to install Git pre-push hook!" -ForegroundColor Red
    exit 1
}

Write-Host "Setup complete. The login tests will now run automatically when pushing to develop branch." 