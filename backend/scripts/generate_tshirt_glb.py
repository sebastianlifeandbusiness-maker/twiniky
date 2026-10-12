"""
Genera backend/uploads/avatars/tshirt_3d.glb: una polera de prueba para el
probador 3D.

El cuerpo y las mangas se construyen con las primitivas propias de trimesh
(`creation.revolve` / `creation.cylinder`) en vez de geometría paramétrica
hecha a mano: son las funciones que trimesh usa internamente para sus
cilindros "de verdad", con triangulación de cierre ya probada, así que no
dependemos de acertarle a mano al índice que cierra el anillo en 360°. El
lado visible de cada cara lo resuelve el visor (GarmentGLB en
TryOnViewer.tsx usa `side: THREE.DoubleSide`), así que no hace falta
duplicar caras con normales invertidas aquí.

Coordenadas del avatar: pies en y=0, altura total 1.74m.

Uso:
    .venv\\Scripts\\python.exe scripts\\generate_tshirt_glb.py
"""
from pathlib import Path

import numpy as np
import trimesh

# ── Medidas del avatar (entregadas por el usuario) ──────────────────────────
WAIST_Y = 1.02     # base de la polera (cintura)
SHOULDER_Y = 1.38  # borde superior (hombros)
TORSO_HALF_WIDTH = 0.20   # eje X, medio ancho del torso
TORSO_HALF_DEPTH = 0.11   # eje Z, medio profundo del torso

# La polera queda un poco más holgada que el cuerpo (si no, se hunde en el avatar).
EASE = 1.08
BODY_RX = TORSO_HALF_WIDTH * EASE
BODY_RZ = TORSO_HALF_DEPTH * EASE

SLEEVE_RADIUS = 0.06
SLEEVE_FORWARD = 0.18   # desplazamiento en +X (o -X en la manga izquierda) desde el hombro
SLEEVE_DROP = 0.08      # caída en -Y desde el hombro (brazo en reposo)
SLEEVE_SECTIONS = 16

NECK_MAJOR_RADIUS = 0.075
NECK_MINOR_RADIUS = 0.018
NECK_FLATTEN_Z = BODY_RZ / BODY_RX  # mismo achatado que el torso, para que calce con la forma del cuerpo

BODY_SECTIONS = 32
NECK_SECTIONS_MINOR = 16

OUT_PATH = Path(__file__).resolve().parent.parent / "uploads" / "avatars" / "tshirt_3d.glb"


def open_elliptical_tube(rx: float, rz: float, y_bottom: float, y_top: float, sections: int = BODY_SECTIONS) -> trimesh.Trimesh:
    """Tubo abierto (sin tapas) de sección elíptica, construido revolviendo
    un perfil de 2 puntos con `trimesh.creation.revolve` — la misma función
    que usa internamente `trimesh.creation.cylinder` para sus cilindros
    circulares, así que el cierre en 360° ya viene resuelto y probado por
    trimesh en vez de por índices calculados a mano."""
    half = (y_top - y_bottom) / 2.0
    # Ambos puntos del perfil están al mismo radio (no tocan el eje x=0),
    # así revolve() no genera tapas — solo la pared lateral del tubo.
    tube = trimesh.creation.revolve(linestring=[[1.0, -half], [1.0, half]], sections=sections, cap=False)

    # revolve() gira en torno al eje Z; lo reorientamos a Y (nuestro eje
    # vertical) y aplanamos el círculo unitario a la elipse deseada.
    tube.apply_transform(trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0]))
    tube.apply_transform(np.diag([rx, 1, rz, 1]))
    tube.apply_transform(trimesh.transformations.translation_matrix([0, y_bottom + half, 0]))
    return tube


def build_sleeve(side: int) -> trimesh.Trimesh:
    """side = +1 (manga derecha, hacia +X) o -1 (manga izquierda, hacia -X).
    Cilindro sólido entre el punto de anclaje en el hombro y el punto donde
    termina la manga, tal como lo arma `trimesh.creation.cylinder` a partir
    de un segmento — sin rotar/trasladar nada a mano."""
    chest_w = side * BODY_RX
    point_a = np.array([chest_w, SHOULDER_Y, 0.0])
    point_b = np.array([chest_w + side * SLEEVE_FORWARD, SHOULDER_Y - SLEEVE_DROP, 0.0])
    return trimesh.creation.cylinder(radius=SLEEVE_RADIUS, segment=[point_a, point_b], sections=SLEEVE_SECTIONS)


def neck_torus(
    major_r: float,
    minor_r: float,
    flatten_z: float,
    center_y: float,
    sections_major: int = BODY_SECTIONS,
    sections_minor: int = NECK_SECTIONS_MINOR,
) -> trimesh.Trimesh:
    """Toroide achatado con el eje del agujero vertical (Y), como el cuello
    de una polera visto desde arriba."""
    u = np.linspace(0, 2 * np.pi, sections_major, endpoint=False)
    v = np.linspace(0, 2 * np.pi, sections_minor, endpoint=False)
    uu, vv = np.meshgrid(u, v, indexing="ij")

    radial = major_r + minor_r * np.cos(vv)
    x = radial * np.cos(uu)
    z = radial * np.sin(uu) * flatten_z
    y = minor_r * np.sin(vv) + center_y

    vertices = np.stack([x.ravel(), y.ravel(), z.ravel()], axis=1)

    faces = []
    for i in range(sections_major):
        i_next = (i + 1) % sections_major
        for j in range(sections_minor):
            j_next = (j + 1) % sections_minor
            a = i * sections_minor + j
            b = i_next * sections_minor + j
            c = i_next * sections_minor + j_next
            d = i * sections_minor + j_next
            faces.append([a, b, c])
            faces.append([a, c, d])

    return trimesh.Trimesh(vertices=vertices, faces=np.array(faces), process=False)


def build_tshirt() -> trimesh.Trimesh:
    body = open_elliptical_tube(BODY_RX, BODY_RZ, WAIST_Y, SHOULDER_Y)
    sleeve_right = build_sleeve(+1)
    sleeve_left = build_sleeve(-1)
    neck = neck_torus(NECK_MAJOR_RADIUS, NECK_MINOR_RADIUS, NECK_FLATTEN_Z, SHOULDER_Y - 0.005)

    # Las mangas arrancan justo en la superficie del tubo del cuerpo (mismo
    # radio BODY_RX) y el cuello se apoya en su borde superior, así se ven
    # conectadas aunque sean piezas separadas.
    return trimesh.util.concatenate([body, sleeve_right, sleeve_left, neck])


def main():
    mesh = build_tshirt()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    mesh.export(OUT_PATH.as_posix(), file_type="glb")
    print(f"OK: {OUT_PATH} ({OUT_PATH.stat().st_size} bytes) — {len(mesh.vertices)} vertices, {len(mesh.faces)} caras")


if __name__ == "__main__":
    main()
