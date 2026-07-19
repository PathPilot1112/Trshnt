# Use an official lightweight Python image
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all files from the ML folder into the container
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Command to run the FastAPI server when the container starts
CMD ["uvicorn", "fastapi_app:app", "--host", "0.0.0.0", "--port", "5000"]
