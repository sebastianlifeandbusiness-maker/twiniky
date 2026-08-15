import asyncio
import io
import json
import logging
import uuid
import zipfile
from pathlib import Path

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "avatars"

HTTP_TIMEOUT = httpx.Timeout(30.0)

MAX_COMPUTE_WAIT_S = 120
COMPUTE_POLL_INTERVAL_S = 3
MAX_EXPORT_WAIT_S = 60
EXPORT_POLL_INTERVAL_S = 2

DONE_STATUSES = {"Completed"}
FAILED_STATUSES = {"Failed", "Timed Out"}


class AvatarSDKError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


async def get_access_token() -> str:
    # TEMP DEBUG — quitar después de diagnosticar
    print(
        f"[DEBUG avatar_sdk] AVATAR_SDK_CLIENT_ID={'<set, len=' + str(len(settings.AVATAR_SDK_CLIENT_ID)) + '>' if settings.AVATAR_SDK_CLIENT_ID else '<VACÍO>'} "
        f"AVATAR_SDK_CLIENT_SECRET={'<set, len=' + str(len(settings.AVATAR_SDK_CLIENT_SECRET)) + '>' if settings.AVATAR_SDK_CLIENT_SECRET else '<VACÍO>'} "
        f"BASE_URL={settings.AVATAR_SDK_BASE_URL}"
    )

    if not settings.AVATAR_SDK_CLIENT_ID or not settings.AVATAR_SDK_CLIENT_SECRET:
        print("[DEBUG avatar_sdk] Faltan credenciales -> AvatarSDKError 503 antes de llamar a Avatar SDK")
        raise AvatarSDKError("Avatar SDK no está configurado (faltan credenciales).", 503)

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            response = await client.post(
                f"{settings.AVATAR_SDK_BASE_URL}/o/token/",
                data={
                    "grant_type": "client_credentials",
                    "client_id": settings.AVATAR_SDK_CLIENT_ID,
                    "client_secret": settings.AVATAR_SDK_CLIENT_SECRET,
                },
            )
        except httpx.HTTPError as e:
            print(f"[DEBUG avatar_sdk] Error de red llamando a /o/token/: {e!r}")
            logger.exception("[AVATAR_SDK] Error de red autenticando con Avatar SDK")
            raise AvatarSDKError("No se pudo conectar con Avatar SDK.")

    print(f"[Avatar SDK Auth] Status: {response.status_code}")
    print(f"[Avatar SDK Auth] Response: {response.text}")

    if response.status_code != 200:
        logger.error("[AVATAR_SDK] Auth falló (%s): %s", response.status_code, response.text)
        raise AvatarSDKError("No se pudo autenticar con Avatar SDK.")

    token = response.json().get("access_token")
    if not token:
        raise AvatarSDKError("Avatar SDK no devolvió un token de acceso válido.")
    return token


def _auth_headers(access_token: str) -> dict:
    return {"Authorization": f"Bearer {access_token}"}


async def create_player(access_token: str) -> str:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            response = await client.post(
                f"{settings.AVATAR_SDK_BASE_URL}/players/",
                headers=_auth_headers(access_token),
            )
        except httpx.HTTPError:
            logger.exception("[AVATAR_SDK] Error de red creando player")
            raise AvatarSDKError("No se pudo conectar con Avatar SDK.")

    if response.status_code not in (200, 201):
        logger.error("[AVATAR_SDK] create_player falló (%s): %s", response.status_code, response.text)
        raise AvatarSDKError("No se pudo crear el jugador en Avatar SDK.")

    player_code = response.json().get("code")
    if not player_code:
        raise AvatarSDKError("Avatar SDK no devolvió un player code válido.")
    return player_code


async def create_avatar(
    access_token: str, player_code: str, photo_bytes: bytes, filename: str, pipeline_subtype: str = "female"
) -> str:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            response = await client.post(
                f"{settings.AVATAR_SDK_BASE_URL}/avatars/",
                headers=_auth_headers(access_token),
                data={
                    "name": f"avatar-{uuid.uuid4().hex[:12]}",
                    "player": player_code,
                    "pipeline": settings.AVATAR_SDK_PIPELINE,
                    "pipeline_subtype": pipeline_subtype,
                },
                files={"photo": (filename or "selfie.jpg", photo_bytes, "image/jpeg")},
            )
        except httpx.HTTPError:
            logger.exception("[AVATAR_SDK] Error de red creando avatar")
            raise AvatarSDKError("No se pudo conectar con Avatar SDK.")

    if response.status_code not in (200, 201):
        logger.error("[AVATAR_SDK] create_avatar falló (%s): %s", response.status_code, response.text)
        raise AvatarSDKError("No se pudo crear el avatar en Avatar SDK. Verifica la foto e intenta de nuevo.")

    avatar_code = response.json().get("code")
    if not avatar_code:
        raise AvatarSDKError("Avatar SDK no devolvió un avatar code válido.")
    return avatar_code


async def get_avatar_status(access_token: str, avatar_code: str) -> str:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            response = await client.get(
                f"{settings.AVATAR_SDK_BASE_URL}/avatars/{avatar_code}/",
                headers=_auth_headers(access_token),
            )
        except httpx.HTTPError:
            logger.exception("[AVATAR_SDK] Error de red consultando status")
            raise AvatarSDKError("No se pudo conectar con Avatar SDK.")

    if response.status_code != 200:
        logger.error("[AVATAR_SDK] get_avatar_status falló (%s): %s", response.status_code, response.text)
        raise AvatarSDKError("No se pudo consultar el estado del avatar.")

    status = response.json().get("status")
    if not status:
        raise AvatarSDKError("Avatar SDK no devolvió un estado válido.")
    return status


async def _wait_for_avatar_completion(access_token: str, avatar_code: str) -> None:
    elapsed = 0
    while elapsed < MAX_COMPUTE_WAIT_S:
        status = await get_avatar_status(access_token, avatar_code)
        if status in DONE_STATUSES:
            return
        if status in FAILED_STATUSES:
            raise AvatarSDKError(f"La generación del avatar falló (estado: {status}).")
        await asyncio.sleep(COMPUTE_POLL_INTERVAL_S)
        elapsed += COMPUTE_POLL_INTERVAL_S
    raise AvatarSDKError("Tiempo de espera agotado generando el avatar.", 504)


async def get_avatar_export_url(access_token: str, avatar_code: str) -> str:
    create_url = f"{settings.AVATAR_SDK_BASE_URL}/avatars/{avatar_code}/exports/"
    export_params = json.dumps({"format": "glb", "embed": True, "lod": "LOD1"})

    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            # TEMP DEBUG — quitar después de diagnosticar
            print(f"[Avatar SDK Export] POST {create_url}")
            print(f"[Avatar SDK Export] body: {{'parameters': {export_params!r}}}")
            create_response = await client.post(
                create_url,
                headers=_auth_headers(access_token),
                json={"parameters": export_params},
            )
        except httpx.HTTPError:
            logger.exception("[AVATAR_SDK] Error de red creando export")
            raise AvatarSDKError("No se pudo conectar con Avatar SDK.")

    print(f"[Avatar SDK Export] Status: {create_response.status_code}")
    print(f"[Avatar SDK Export] Response: {create_response.text}")

    if create_response.status_code not in (200, 201):
        logger.error("[AVATAR_SDK] create export falló (%s): %s", create_response.status_code, create_response.text)
        raise AvatarSDKError("No se pudo exportar el avatar generado.")

    export_data = create_response.json()
    export_code = export_data.get("code")
    if not export_code:
        raise AvatarSDKError("Avatar SDK no devolvió un export code válido.")

    export_status_url = f"{settings.AVATAR_SDK_BASE_URL}/avatars/{avatar_code}/exports/{export_code}/"

    elapsed = 0
    while elapsed < MAX_EXPORT_WAIT_S:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            try:
                print(f"[Avatar SDK Export] GET {export_status_url}")
                status_response = await client.get(export_status_url, headers=_auth_headers(access_token))
            except httpx.HTTPError:
                logger.exception("[AVATAR_SDK] Error de red consultando export")
                raise AvatarSDKError("No se pudo conectar con Avatar SDK.")

        print(f"[Avatar SDK Export] Status: {status_response.status_code}")
        print(f"[Avatar SDK Export] Response: {status_response.text}")

        if status_response.status_code != 200:
            logger.error(
                "[AVATAR_SDK] export status falló (%s): %s",
                status_response.status_code,
                status_response.text,
            )
            raise AvatarSDKError("No se pudo consultar el estado del export.")

        data = status_response.json()
        status = data.get("status")
        if status in DONE_STATUSES:
            files = data.get("files") or []
            if not files:
                raise AvatarSDKError("El export terminó pero no generó archivos.")
            file_url = files[0].get("url") or files[0].get("file")
            if not file_url:
                raise AvatarSDKError("Avatar SDK no devolvió una URL de descarga válida.")
            return file_url
        if status in FAILED_STATUSES:
            raise AvatarSDKError(f"El export del avatar falló (estado: {status}).")

        await asyncio.sleep(EXPORT_POLL_INTERVAL_S)
        elapsed += EXPORT_POLL_INTERVAL_S

    raise AvatarSDKError("Tiempo de espera agotado exportando el avatar.", 504)


async def download_and_save_glb(export_file_url: str, access_token: str, user_id: uuid.UUID) -> str:
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        try:
            response = await client.get(export_file_url, headers=_auth_headers(access_token))
        except httpx.HTTPError:
            logger.exception("[AVATAR_SDK] Error de red descargando GLB")
            raise AvatarSDKError("No se pudo descargar el archivo del avatar.")

    if response.status_code != 200:
        logger.error("[AVATAR_SDK] download glb falló (%s)", response.status_code)
        raise AvatarSDKError("No se pudo descargar el archivo del avatar.")

    content_type = response.headers.get("content-type", "")
    print(f"[Avatar SDK Export] download content-type={content_type!r} bytes={len(response.content)}")

    glb_bytes = response.content
    if "zip" in content_type or response.content[:2] == b"PK":
        # Avatar SDK entrega el export como un .zip (modelo + texturas), aunque se pida embed=true.
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            glb_names = [n for n in zf.namelist() if n.lower().endswith(".glb")]
            if not glb_names:
                raise AvatarSDKError("El export de Avatar SDK no contiene un archivo .glb.")
            glb_bytes = zf.read(glb_names[0])

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_path = UPLOAD_DIR / f"{user_id}.glb"
    file_path.write_bytes(glb_bytes)

    return f"/uploads/avatars/{user_id}.glb"


async def generate_avatar_for_user(
    user_id: uuid.UUID, photo_bytes: bytes, filename: str, pipeline_subtype: str = "female"
) -> str:
    access_token = await get_access_token()
    player_code = await create_player(access_token)
    avatar_code = await create_avatar(access_token, player_code, photo_bytes, filename, pipeline_subtype)

    await _wait_for_avatar_completion(access_token, avatar_code)

    export_file_url = await get_avatar_export_url(access_token, avatar_code)
    return await download_and_save_glb(export_file_url, access_token, user_id)
