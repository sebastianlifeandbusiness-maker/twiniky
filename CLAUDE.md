# Twiniky — Contexto del Proyecto

## Qué es Twiniky
Marketplace de moda chileno con probador virtual 3D. Los usuarios crean un avatar 3D exacto de su cuerpo desde fotos y lo usan para probarse ropa de marcas reales antes de comprar.

**Pitch:** "Twiniky: tu cuerpo exacto en 3D. Pruébate todo, devuelve nada."

**Fundador:** Sebastian Córdova — sin experiencia en programación, pero con buena noción de informática. Prefiere explicaciones simples y paso a paso.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Backend | FastAPI + Python 3.12 + SQLAlchemy async + Alembic |
| Base de datos | PostgreSQL 16 (usuario: `user`, contraseña: `password`, DB: `twiniky`) |
| Frontend | Next.js 15 + TypeScript + Zustand |
| Estilos | CSS inline (sin Tailwind — incompatibilidad resuelta así) |
| Auth | JWT con python-jose + bcrypt |
| Repositorio | github.com/sebastianlifeandbusiness-maker/twiniky |

## Cómo levantar el proyecto localmente

```powershell
# Backend (desde twiniky/backend/)
.\.venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (desde twiniky/frontend/)
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- API docs: http://localhost:8000/docs

---

## Lo que está construido

- ✅ Landing page
- ✅ Registro y login con JWT
- ✅ Catálogo de productos con filtros por talla, precio y categoría
- ✅ Carrito de compras persistente (Zustand + localStorage)
- ✅ Checkout con formulario de datos personales y dirección de envío
- ✅ Página de confirmación de pedido
- ✅ 12 productos seed en 6 categorías

## Pendientes (en orden de prioridad)

1. **Guest checkout** — permitir compra sin login. El `checkout.py` del backend requiere auth obligatoria, debe ser opcional. El frontend redirige a login si no hay token, debe eliminarse ese bloqueo.
2. **Precios en CLP** — actualmente en USD, cambiar a pesos chilenos reales.
3. **Panel de marcas** — sección donde tiendas pueden subir su catálogo.
4. **Probador 3D** — integración con Meshcapade API (acceso pendiente de respuesta por email).

---

## Decisiones de diseño importantes

- **CSS inline** en vez de Tailwind: Next.js no compilaba Tailwind correctamente, se resolvió con estilos inline en todos los componentes.
- **`<img>` en vez de `<Image>` de Next.js**: Unsplash bloqueaba las peticiones del proxy de Next.js, se usa `<img>` estándar.
- **Moneda**: CLP (pesos chilenos). Rangos de precios reales: camisetas $15.990–$29.990, pantalones $29.990–$59.990, vestidos $39.990–$89.990, chaquetas $49.990–$99.990, zapatos $39.990–$79.990, accesorios $9.990–$29.990.
- **Mercado objetivo**: Chile primero, luego escala regional.

---

## Externos pendientes

- Solicitud AWS Activate enviada (créditos $1.000 USD, revisión 7–10 días hábiles)
- Email enviado a Meshcapade pidiendo acceso a su API de avatares 3D
