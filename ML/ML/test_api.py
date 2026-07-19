import requests
import sys

# Replace with the path to a test image on your computer
if len(sys.argv) > 1:
    image_path = sys.argv[1]
else:
    print("Please provide an image path. Example: python test_api.py path/to/image.jpg")
    sys.exit(1)

url = "http://127.0.0.1:5000/predict"

try:
    with open(image_path, 'rb') as img_file:
        files = {'image': img_file}
        response = requests.post(url, files=files)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success!")
            print(f"Prediction: {result['prediction']}")
            print(f"Confidence: {result['confidence'] * 100:.2f}%")
        else:
            print(f"❌ Failed with status code: {response.status_code}")
            print(response.text)
except FileNotFoundError:
    print(f"❌ Could not find the image at: {image_path}")
except Exception as e:
    print(f"❌ Error: {e}")
