import gradio as gr
from fastapi_app import app as fastapi_app

# Create a dummy Gradio interface to satisfy Hugging Face's UI requirements
demo = gr.Interface(
    fn=lambda: "Treasure Hunt ML API is running in the background!",
    inputs=None,
    outputs="text",
    title="Treasure Hunt ML API (FastAPI backend)"
)

# Mount our custom FastAPI app directly onto the Gradio interface
# Hugging Face Spaces will automatically find this 'app' variable and run it on port 7860
app = gr.mount_gradio_app(fastapi_app, demo, path="/")
