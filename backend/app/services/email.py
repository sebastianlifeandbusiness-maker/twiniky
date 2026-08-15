import logging

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)

resend.api_key = settings.RESEND_API_KEY


async def send_email(to: str, subject: str, html: str) -> None:
    if not settings.RESEND_API_KEY:
        logger.warning("[EMAIL] RESEND_API_KEY no configurada, se omite envío a %s: %s", to, subject)
        return

    try:
        resend.Emails.send(
            {
                "from": settings.EMAIL_FROM,
                "to": [to],
                "subject": subject,
                "html": html,
            }
        )
    except Exception:
        logger.exception("[EMAIL] Error enviando email a %s: %s", to, subject)


async def send_stock_notification(
    user_email: str,
    product_name: str,
    size: str,
    product_id: str,
    image_url: str | None = None,
) -> None:
    from app.services.email_templates import stock_alert_email

    await send_email(
        to=user_email,
        subject=f"¡Ya está disponible! {product_name} 🔔",
        html=stock_alert_email(
            product_name=product_name,
            size=size,
            product_id=product_id,
            image_url=image_url,
        ),
    )
