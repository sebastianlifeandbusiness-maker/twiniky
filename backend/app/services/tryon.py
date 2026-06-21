import uuid
from pathlib import Path

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "tryon"


class TryOnService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_session(self, product_id: uuid.UUID, user_photo: UploadFile) -> dict:
        # TODO: upload photo to S3, call 3D rendering service, persist session
        return {
            "session_id": str(uuid.uuid4()),
            "product_id": str(product_id),
            "status": "processing",
            "result_url": None,
        }

    async def get_session(self, session_id: uuid.UUID) -> dict:
        # TODO: query session status from DB or 3D service
        return {"session_id": str(session_id), "status": "pending"}

    async def save_photos(self, user_id: uuid.UUID, photos: list[UploadFile]) -> dict:
        session_id = uuid.uuid4()
        user_dir = UPLOAD_DIR / str(user_id) / str(session_id)
        user_dir.mkdir(parents=True, exist_ok=True)

        labels = ["frontal", "perfil_izq", "perfil_der", "espalda"]
        saved = 0
        for label, photo in zip(labels, photos):
            content = await photo.read()
            if not content:
                continue
            suffix = Path(photo.filename or "photo.jpg").suffix or ".jpg"
            (user_dir / f"{label}{suffix}").write_bytes(content)
            saved += 1

        # TODO: Conectar aquí con Meshcapade API cuando esté disponible.
        # Las fotos están guardadas en user_dir. Meshcapade las procesará
        # para generar el avatar 3D personalizado y devolver medidas reales.

        return {
            "session_id": str(session_id),
            "status": "stored",
            "photos_saved": saved,
            "measurements": None,
            "message": "Fotos guardadas. Usando medidas promedio por ahora.",
        }
