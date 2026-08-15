from decimal import Decimal

from app.core.config import settings

_BRAND_COLOR = "#111111"
_BG = "#fafaf8"
_BORDER = "#ebebeb"


def _clp(value: Decimal | int | float) -> str:
    return f"${int(round(float(value))):,}".replace(",", ".")


def _wrapper(title: str, body_html: str) -> str:
    return f"""
    <html>
      <body style="margin:0;padding:0;background-color:{_BG};font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{_BG};padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid {_BORDER};max-width:600px;width:100%;">
                <tr>
                  <td style="padding:28px 32px;border-bottom:1px solid {_BORDER};">
                    <span style="font-size:14px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:{_BRAND_COLOR};">Twiniky</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    {body_html}
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid {_BORDER};color:#999;font-size:11px;">
                    Twiniky — Marketplace de moda con probador virtual 3D<br/>
                    Este es un correo automático, por favor no respondas a esta dirección.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    """


def _order_items_table(items: list[dict]) -> str:
    rows = ""
    for item in items:
        rows += f"""
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid {_BORDER};font-size:13px;color:#111;">{item['name']}</td>
          <td style="padding:10px 0;border-bottom:1px solid {_BORDER};font-size:13px;color:#666;text-align:center;">{item.get('size') or '-'}</td>
          <td style="padding:10px 0;border-bottom:1px solid {_BORDER};font-size:13px;color:#666;text-align:center;">×{item['quantity']}</td>
          <td style="padding:10px 0;border-bottom:1px solid {_BORDER};font-size:13px;color:#111;text-align:right;">{_clp(item['price'])}</td>
        </tr>
        """
    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      <tr>
        <td style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#999;padding-bottom:8px;border-bottom:1px solid {_BORDER};">Producto</td>
        <td style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#999;padding-bottom:8px;border-bottom:1px solid {_BORDER};text-align:center;">Talla</td>
        <td style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#999;padding-bottom:8px;border-bottom:1px solid {_BORDER};text-align:center;">Cant.</td>
        <td style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#999;padding-bottom:8px;border-bottom:1px solid {_BORDER};text-align:right;">Precio</td>
      </tr>
      {rows}
    </table>
    """


def buyer_confirmation_email(
    order_number: str,
    items: list[dict],
    total: Decimal | int | float,
    shipping_address: dict,
) -> str:
    address_line = f"{shipping_address.get('street', '')}, {shipping_address.get('city', '')}, {shipping_address.get('region', '')}"

    body = f"""
    <h1 style="margin:0 0 8px;font-size:20px;color:{_BRAND_COLOR};">¡Gracias por tu compra!</h1>
    <p style="margin:0 0 20px;font-size:13px;color:#666;">Tu pedido en Twiniky fue confirmado. Aquí está el resumen:</p>

    <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em;">N° de orden</p>
    <p style="margin:0 0 16px;font-size:14px;color:#111;font-weight:600;">{order_number}</p>

    {_order_items_table(items)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr>
        <td style="font-size:14px;font-weight:700;color:{_BRAND_COLOR};padding-top:8px;">Total</td>
        <td style="font-size:14px;font-weight:700;color:{_BRAND_COLOR};padding-top:8px;text-align:right;">{_clp(total)}</td>
      </tr>
    </table>

    <p style="margin:24px 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em;">Dirección de envío</p>
    <p style="margin:0;font-size:13px;color:#333;">{shipping_address.get('full_name', '')}<br/>{address_line}<br/>{shipping_address.get('zip', '')}</p>

    <p style="margin:24px 0 0;font-size:13px;color:#666;">Te contactaremos cuando tu pedido esté en camino.</p>
    """
    return _wrapper("¡Tu pedido en Twiniky está confirmado!", body)


def brand_order_notification_email(
    order_number: str,
    product_name: str,
    size: str | None,
    quantity: int,
    price: Decimal | int | float,
    shipping_address: dict,
) -> str:
    address_line = f"{shipping_address.get('street', '')}, {shipping_address.get('city', '')}, {shipping_address.get('region', '')}, {shipping_address.get('zip', '')}"

    body = f"""
    <h1 style="margin:0 0 8px;font-size:20px;color:{_BRAND_COLOR};">Tienes un nuevo pedido</h1>
    <p style="margin:0 0 20px;font-size:13px;color:#666;">Un cliente compró uno de tus productos en Twiniky.</p>

    <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em;">N° de orden</p>
    <p style="margin:0 0 16px;font-size:14px;color:#111;font-weight:600;">{order_number}</p>

    <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em;">Producto</p>
    <p style="margin:0 0 16px;font-size:13px;color:#333;">{product_name} — Talla {size or '-'} — Cantidad: {quantity}</p>

    <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em;">Precio de venta</p>
    <p style="margin:0 0 16px;font-size:14px;color:{_BRAND_COLOR};font-weight:700;">{_clp(price)}</p>

    <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em;">Dirección de envío del cliente</p>
    <p style="margin:0;font-size:13px;color:#333;">{shipping_address.get('full_name', '')}<br/>{address_line}</p>

    <p style="margin:24px 0 0;font-size:13px;color:#666;">Recuerda preparar el pedido para despacho.</p>
    """
    return _wrapper("¡Nuevo pedido recibido en Twiniky!", body)


def stock_alert_email(
    product_name: str,
    size: str,
    product_id: str,
    image_url: str | None = None,
) -> str:
    product_url = f"{settings.FRONTEND_URL}/marketplace/{product_id}"
    image_html = (
        f'<img src="{image_url}" alt="{product_name}" style="width:100%;max-width:240px;display:block;margin:0 0 20px;border:1px solid {_BORDER};" />'
        if image_url
        else ""
    )

    body = f"""
    <h1 style="margin:0 0 8px;font-size:20px;color:{_BRAND_COLOR};">El producto que querías ya está disponible</h1>
    {image_html}
    <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em;">Producto</p>
    <p style="margin:0 0 16px;font-size:14px;color:#111;font-weight:600;">{product_name}</p>

    <p style="margin:0 0 4px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:0.08em;">Talla disponible</p>
    <p style="margin:0 0 24px;font-size:14px;color:#111;">{size}</p>

    <a href="{product_url}" style="display:inline-block;padding:14px 28px;background-color:{_BRAND_COLOR};color:#ffffff;font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;text-decoration:none;">Comprar ahora</a>
    """
    return _wrapper(f"¡Ya está disponible! {product_name}", body)
