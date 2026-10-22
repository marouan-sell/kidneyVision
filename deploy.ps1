param (
    [string]$Message = ""
)

if ($Message -ne "") {
    python deploy_to_azure.py -m "$Message"
} else {
    python deploy_to_azure.py
}
