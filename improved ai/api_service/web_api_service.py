import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from flask import Flask, request, jsonify
from kidneyvision_sota_engine import get_engine

app = Flask(__name__)

# Native CORS Support for React & Laravel frontends
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

# Initialize Engine at startup
engine = get_engine()

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "KidneyVision SOTA Multi-Pathology AI Microservice",
        "model": engine.model_name,
        "device": str(engine.device),
        "supported_pathologies": engine.classes,
        "status": "ready",
        "documentation": {
            "health_check": "GET /api/health",
            "prediction": "POST /api/predict (form-data: 'image' or 'file' or 'scan', optional 'auto_mask'=true)"
        }
    })

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "model": engine.model_name,
        "classes": engine.classes,
        "device": str(engine.device),
        "gpu_available": str(engine.device).startswith("cuda")
    })

@app.route("/api/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return "", 200

    # Look for uploaded file in common field names
    file_obj = None
    for field in ["image", "scan", "file", "photo"]:
        if field in request.files:
            file_obj = request.files[field]
            break

    if file_obj is None or file_obj.filename == "":
        # Check raw body bytes
        if request.data:
            image_bytes = request.data
        else:
            return jsonify({
                "success": False,
                "error": "Aucun fichier image trouvé dans la requête. Envoyez un fichier sous le champ 'image' ou 'scan'."
            }), 400
    else:
        image_bytes = file_obj.read()

    # Parse auto_mask option (default to True)
    auto_mask_val = request.form.get("auto_mask", request.args.get("auto_mask", "true")).lower()
    auto_mask = auto_mask_val in ["true", "1", "yes"]

    try:
        result = engine.predict(image_bytes, auto_mask=auto_mask)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Erreur lors de l'analyse IA : {str(e)}"
        }), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n=======================================================")
    print(f" KidneyVision SOTA Medical AI Web Service Started!")
    print(f" Ready for React / Laravel integration on http://localhost:{port}")
    print(f" Model Engine: {engine.model_name}")
    print(f" Endpoint: POST http://localhost:{port}/api/predict")
    print(f"=======================================================\n")
    app.run(host="0.0.0.0", port=port, debug=False)
