"""
KidneyVision AI — Microservice Entry Point.
Serves prediction inference and health checks for renal ultrasound scans.
"""
from app import create_app

app = create_app()

if __name__ == '__main__':
    # Used for local development and direct container execution
    app.run(host='0.0.0.0', port=5000, debug=False)
