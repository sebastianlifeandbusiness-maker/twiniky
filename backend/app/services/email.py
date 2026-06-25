import logging

logger = logging.getLogger(__name__)


async def send_stock_notification(user_email: str, product_name: str, size: str) -> None:
    # TODO: Integrar con Resend o SendGrid cuando esté listo
    logger.info(
        "[STOCK ALERT] Email a %s: '%s' talla %s ya está disponible.",
        user_email,
        product_name,
        size,
    )
    print(f"[STOCK ALERT] → {user_email}: '{product_name}' talla {size} disponible.")
