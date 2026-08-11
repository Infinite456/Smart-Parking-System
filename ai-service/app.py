from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np
import random

app = FastAPI(
    title="PARKAI Computer Vision Service",
    description="YOLO/OpenCV-based occupancy and overlapping detection service",
    version="1.0.0"
)

# Enable CORS for cross-origin dashboard requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "PARKAI CV Inference",
        "model": "YOLOv8-Mock-Segmentor",
        "gpu_available": False
    }

@app.post("/detect-slots")
async def detect_slots(file: UploadFile = File(None)):
    """
    Receives a parking lot camera frame.
    Processes the image using OpenCV to crop slot zones and calculate pixel intensity averages.
    Returns occupancy state lists.
    """
    # 1. Define coordinate zones for slots (conceptual layout mapping)
    # Each coordinate represents [slotNumber, x1, y1, x2, y2] bounding boxes
    slot_bounds = [
        {"slot": "A-01", "box": (10, 10, 50, 80)},
        {"slot": "A-02", "box": (60, 10, 100, 80)},
        {"slot": "B-01", "box": (10, 90, 50, 160)},
        {"slot": "C-01", "box": (10, 170, 50, 240)},
    ]

    detections = []

    # 2. Process image if uploaded
    if file:
        try:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                raise ValueError("Could not decode image bytes")

            # Convert to grayscale for pixel intensity calculation
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            for item in slot_bounds:
                slot_num = item["slot"]
                x1, y1, x2, y2 = item["box"]

                # Crop slot area
                crop = gray[y1:y2, x1:x2]
                if crop.size == 0:
                    status = "Available"
                else:
                    # Calculate mean intensity (mocking occupancy check)
                    mean_val = np.mean(crop)
                    # If mean intensity is high, mock classification
                    status = "Occupied" if mean_val > 100 else "Available"
                
                detections.append({
                    "slotNumber": slot_num,
                    "status": status,
                    "confidence": round(float(random.uniform(0.88, 0.98)), 2),
                    "intensity": round(float(mean_val), 1)
                })

        except Exception as e:
            # Fallback to simulated detections if image processing fails
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to parse camera feed. Fell back to simulation.",
                "detections": generate_simulated_slots()
            }
    else:
        # No file sent - return full mock detections list for our 50 slots
        detections = generate_simulated_slots()

    # 3. Detect violations (Overlap Check Simulation)
    # Check if a vehicle is bounding box overlapping two slots
    violations = []
    if file and random.choice([True, False, False]):
        violations.append({
            "registrationNumber": "MH-12-AB-1234",
            "slotNumber": "A-02",
            "type": "Overlapping Parking",
            "confidence": 0.91
        })

    return {
        "success": True,
        "processed_file": file.filename if file else "none (simulated)",
        "detections": detections,
        "violations": violations
    }

def generate_simulated_slots():
    """Generates simulated statuses for all 50 slots in Rows A to E."""
    rows = ['A', 'B', 'C', 'D', 'E']
    detections = []
    
    for row in rows:
        for col in range(1, 11):
            slot_num = f"{row}-{col:02d}"
            # Randomize states
            states = ["Available", "Occupied", "Reserved"]
            weights = [0.65, 0.25, 0.1]
            status = random.choices(states, weights=weights)[0]
            
            detections.append({
                "slotNumber": slot_num,
                "status": status,
                "confidence": round(random.uniform(0.85, 0.99), 2)
            })
            
    return detections

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
