from fastapi import FastAPI

app = FastAPI(title="Сніжинка - Інтернет-магазин теплого одягу")

@app.get("/")
def read_root():
    return {"message": "Ласкаво просимо до інтернет-магазину Сніжинка!"}