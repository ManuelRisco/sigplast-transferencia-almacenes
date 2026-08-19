import struct
import zlib
import math

def create_png_rgba(width, height, get_pixel_func):
    # Genera un archivo PNG RGBA válido
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_data.extend([int(r), int(g), int(b), int(a)])
    
    compressed = zlib.compress(bytes(raw_data), 9)
    
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack(">I", len(data)) + c + struct.pack(">I", crc)
    
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    # IHDR chunk
    png.extend(chunk(b'IHDR', struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)))
    # IDAT chunk
    png.extend(chunk(b'IDAT', compressed))
    # IEND chunk
    png.extend(chunk(b'IEND', b''))
    return bytes(png)

def draw_cube_icon(x, y, w, h):
    # Proporción normalizada 0..1
    nx = x / (w - 1)
    ny = y / (h - 1)
    
    # Esquinas redondeadas del fondo
    # Radio = 0.25
    r_corner = 0.22
    # Distancia a los bordes
    dx = min(nx, 1.0 - nx)
    dy = min(ny, 1.0 - ny)
    
    is_inside_corner = True
    if dx < r_corner and dy < r_corner:
        dist = math.sqrt((r_corner - dx)**2 + (r_corner - dy)**2)
        if dist > r_corner:
            return 0, 0, 0, 0 # Transparente fuera de las esquinas redondeadas
            
    # Fondo con gradiente de #003a6c a #0d9488
    # #003a6c = (0, 58, 108), #0d9488 = (13, 148, 136)
    t = (nx + ny) / 2.0
    bg_r = int(0 * (1 - t) + 13 * t)
    bg_g = int(58 * (1 - t) + 148 * t)
    bg_b = int(108 * (1 - t) + 136 * t)
    bg_a = 255
    
    # Coordenadas relativas para el cubo centrado (en un grid 24x24 estándar)
    # M20 7 l-8-4 -8 4 m16 0 l-8 4 m8-4 v10 l-8 4 m0-10 L4 7 m8 4 v10 M4 7 v10 l8 4
    # Puntos del cubo en 24x24 (margen 2.5):
    # Top: (12, 3)
    # Right: (20, 7)
    # Left: (4, 7)
    # Center: (12, 11)
    # Bottom: (12, 21)
    # Bottom-Right: (20, 17)
    # Bottom-Left: (4, 17)
    
    # Transformar x, y a escala 24x24
    gx = nx * 24.0
    gy = ny * 24.0
    
    # Lista de segmentos del cubo: (x1, y1, x2, y2)
    segments = [
        # Top diamond:
        (12, 3.5, 20, 7.5),
        (20, 7.5, 12, 11.5),
        (12, 11.5, 4, 7.5),
        (4, 7.5, 12, 3.5),
        # Vertical lines:
        (4, 7.5, 4, 16.5),
        (20, 7.5, 20, 16.5),
        (12, 11.5, 12, 20.5),
        # Bottom lines:
        (4, 16.5, 12, 20.5),
        (12, 20.5, 20, 16.5),
    ]
    
    # Calcular distancia mínima de (gx, gy) a cualquier segmento
    min_d = 999.0
    for (x1, y1, x2, y2) in segments:
        dx_s = x2 - x1
        dy_s = y2 - y1
        l2 = dx_s*dx_s + dy_s*dy_s
        if l2 == 0:
            d = math.sqrt((gx - x1)**2 + (gy - y1)**2)
        else:
            t_s = max(0, min(1, ((gx - x1)*dx_s + (gy - y1)*dy_s) / l2))
            proj_x = x1 + t_s * dx_s
            proj_y = y1 + t_s * dy_s
            d = math.sqrt((gx - proj_x)**2 + (gy - proj_y)**2)
        if d < min_d:
            min_d = d
            
    # Grosor de línea ~ 1.1 en grid de 24
    line_thickness = 1.15
    if min_d < line_thickness:
        # Antialiasing suave
        alpha_stroke = 1.0 - (min_d / line_thickness)**2
        r = int(255 * alpha_stroke + bg_r * (1 - alpha_stroke))
        g = int(255 * alpha_stroke + bg_g * (1 - alpha_stroke))
        b = int(255 * alpha_stroke + bg_b * (1 - alpha_stroke))
        return r, g, b, 255
        
    return bg_r, bg_g, bg_b, bg_a

def create_ico(png_32, png_48, png_64):
    # Crea un contenedor ICO con múltiples tamaños PNG
    images = [
        (32, 32, png_32),
        (48, 48, png_48),
        (64, 64, png_64)
    ]
    
    ico_header = struct.pack("<HHH", 0, 1, len(images)) # Reserved, Type=1 (ICO), Count
    entries = bytearray()
    image_data = bytearray()
    
    offset = 6 + len(images) * 16
    for w, h, data in images:
        size = len(data)
        # width, height, colors(0), reserved(0), planes(1), bpp(32), size, offset
        entry = struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, size, offset)
        entries.extend(entry)
        image_data.extend(data)
        offset += size
        
    return ico_header + bytes(entries) + bytes(image_data)

png_32 = create_png_rgba(32, 32, draw_cube_icon)
png_48 = create_png_rgba(48, 48, draw_cube_icon)
png_64 = create_png_rgba(64, 64, draw_cube_icon)

ico_data = create_ico(png_32, png_48, png_64)

# Escribir archivos a public y src
paths_ico = [
    "frontend/public/favicon.ico",
]
paths_png = [
    "frontend/public/favicon.png",
]

for p in paths_ico:
    with open(p, "wb") as f:
        f.write(ico_data)
    print(f"Escrito: {p} ({len(ico_data)} bytes)")

for p in paths_png:
    with open(p, "wb") as f:
        f.write(png_64)
    print(f"Escrito: {p} ({len(png_64)} bytes)")
