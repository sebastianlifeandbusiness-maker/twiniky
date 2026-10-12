import base64
import logging
from pathlib import Path

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

SEGMIND_URL = "https://api.segmind.com/v1/idm-vton"
HTTP_TIMEOUT = httpx.Timeout(120.0)


class TryOnError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _read_user_photo_b64(user_photo_path: Path) -> str:
    if not user_photo_path.is_file():
        raise TryOnError(
            "No se encontró tu foto. Sube tu selfie en Configurar Avatar para usar esta función.", 400
        )
    return base64.b64encode(user_photo_path.read_bytes()).decode("utf-8")


async def _download_image_b64(url: str) -> str:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            response = await client.get(url)
        except httpx.HTTPError:
            logger.exception("[IDM_VTON] Error de red descargando imagen de la prenda")
            raise TryOnError("No se pudo descargar la imagen de la prenda.")

    if response.status_code != 200:
        logger.error("[IDM_VTON] descarga de prenda falló (%s)", response.status_code)
        raise TryOnError("No se pudo descargar la imagen de la prenda.")

    return base64.b64encode(response.content).decode("utf-8")


async def generate_tryon(user_photo_path: Path, garment_image_url: str, garment_description: str) -> str:
    if not settings.SEGMIND_API_KEY:
        raise TryOnError("Segmind no está configurado (falta SEGMIND_API_KEY).", 503)

    human_img_b64 = _read_user_photo_b64(user_photo_path)
    garm_img_b64 = await _download_image_b64(garment_image_url)

    payload = {
        "human_img": human_img_b64,
        "garm_img": garm_img_b64,
        "garment_des": garment_description or "prenda de ropa",
        "is_checked": True,
        "is_checked_crop": False,
        "denoise_steps": 30,
        "seed": 42,
    }

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            response = await client.post(
                SEGMIND_URL,
                headers={"x-api-key": settings.SEGMIND_API_KEY},
                json=payload,
            )
        except httpx.HTTPError:
            logger.exception("[IDM_VTON] Error de red llamando a Segmind")
            raise TryOnError("No se pudo conectar con el servicio de prueba virtual.")

    if response.status_code != 200:
        logger.error("[IDM_VTON] Segmind falló (%s): %s", response.status_code, response.text[:500])
        raise TryOnError("El servicio de prueba virtual no pudo generar la imagen. Intenta de nuevo.")

    content_type = response.headers.get("content-type", "")
    if "application/json" in content_type:
        data = response.json()
        image_b64 = data.get("image") or data.get("output") or data.get("result")
        if not image_b64:
            raise TryOnError("El servicio de prueba virtual no devolvió una imagen válida.")
        return image_b64

    # Segmind normalmente devuelve la imagen directamente como binario.
    return base64.b64encode(response.content).decode("utf-8")
