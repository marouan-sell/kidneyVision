"""
Flask application factory for KidneyVision AI microservice.
"""
import logging
from flask import Flask
from app.inference.model_loader import load_model

def create_app() -> Flask:
    """Initialize and configure Flask microservice."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)

    app = Flask(__name__)

    # Preload model at application startup
    load_model()

    # Register blueprints
    from app.routes.health import health_bp
    from app.routes.predict import predict_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(predict_bp)

    logger.info("KidneyVision AI microservice initialized.")
    return app
