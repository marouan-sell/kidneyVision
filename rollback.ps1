Write-Host "Reverting last commit and rolling back Azure production..." -ForegroundColor Yellow
python deploy_to_azure.py --rollback
