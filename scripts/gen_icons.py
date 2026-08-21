import struct, zlib, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
os.makedirs(OUT, exist_ok=True)

BG = (28, 27, 25)       # ink
ACCENT = (201, 98, 42)  # terracotta accent

def make_png(path, size, maskable=False):
    px = [[BG for _ in range(size)] for _ in range(size)]
    cx, cy = size / 2, size / 2
    # outer radius smaller for maskable safe zone
    r_outer = size * (0.34 if maskable else 0.30)
    r_ring = r_outer * 0.62
    for y in range(size):
        for x in range(size):
            dx, dy = x - cx, y - cy
            d = (dx * dx + dy * dy) ** 0.5
            if r_ring <= d <= r_outer:
                px[y][x] = ACCENT
            elif d < r_ring * 0.34:
                px[y][x] = ACCENT

    raw = bytearray()
    for row in px:
        raw.append(0)
        for (r, g, b) in row:
            raw += bytes((r, g, b))

    def chunk(tag, data):
        return struct.pack('!I', len(data)) + tag + data + struct.pack('!I', zlib.crc32(tag + data))

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('!IIBBBBB', size, size, 8, 2, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)
    png = sig + chunk(b'IHDR', ihdr) + chunk(b'IDAT', idat) + chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)

make_png(os.path.join(OUT, 'icon-192.png'), 192)
make_png(os.path.join(OUT, 'icon-512.png'), 512)
make_png(os.path.join(OUT, 'icon-512-maskable.png'), 512, maskable=True)
print('done')
