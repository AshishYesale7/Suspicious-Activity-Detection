import unittest
from pathlib import Path
from config import BASE_DIR, MODELS_DIR, DATA_DIR, DB_PATH, MODEL_PATH

class TestConfig(unittest.TestCase):
    def test_paths(self):
        self.assertTrue(isinstance(BASE_DIR, Path))
        self.assertTrue(isinstance(MODELS_DIR, Path))
        self.assertTrue(isinstance(DATA_DIR, Path))
        self.assertTrue(isinstance(DB_PATH, Path))
        self.assertTrue(isinstance(MODEL_PATH, Path))

if __name__ == '__main__':
    unittest.main()
