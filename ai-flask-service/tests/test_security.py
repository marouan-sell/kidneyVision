"""
Security and Token Verification Tests for KidneyVision AI Flask Microservice.
"""
import io
import unittest
from PIL import Image
from app import create_app
from app.config import INTERNAL_SERVICE_TOKEN

class FlaskSecurityTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()

    def test_health_check_open_for_orchestrator(self):
        response = self.client.get('/health')
        self.assertIn(response.status_code, [200, 503])
        data = response.get_json()
        self.assertIn('status', data)

    def test_predict_rejects_missing_token(self):
        response = self.client.post('/predict')
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertFalse(data.get('success', True))
        self.assertIn('token', data.get('error', '').lower())

    def test_predict_rejects_invalid_token(self):
        response = self.client.post('/predict', headers={'X-Internal-Token': 'wrong_invalid_secret_token'})
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertFalse(data.get('success', True))

    def test_predict_accepts_valid_service_token_and_validates_payload(self):
        # Valid token with missing image should pass auth and return 400 (Bad Request: No image)
        response = self.client.post('/predict', headers={'X-Internal-Token': INTERNAL_SERVICE_TOKEN})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertIn('error', data)
        self.assertIn('image', data['error'].lower())

if __name__ == '__main__':
    unittest.main()
