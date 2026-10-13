
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps

# =========================================================
# CAMINHOS DO PROJETO
# =========================================================

ASSETS = Path("src/assets")
DESTINO = ASSETS / "carrossel"

# =========================================================
# FOTOGRAFIAS DOS PRODUTOS
# =========================================================

ARQUIVOS = [
    # Pé de Moça no Pote
    "dpedemoca-optimized.webp",
    "dpedemoca2-optimized.webp",
    "dpedemoca3-optimized.webp",

    # Brownies
    "baoleite.png",
    "bbranco.png",
    "bdoce.png",
    "bfaoleite-optimized.webp",
    "bfbranco-optimized.webp",
    "bfdoce-optimized.webp",
    "bfruta-optimized.webp",
    "bnaoleite-optimized.webp",
    "bnbranco-optimized.webp",
    "bndoce-optimized.webp",
    "bnozes-optimized.webp",
    "bsem.png",

    # Cookies
    "ckinder.png",
    "ckinder2.png",
    "ckinder3.png",
    "cnutella.png",
    "cnutella2.png",
    "cnutella3.png",
    "cnutella4.png",

    # Tortas
    "banoffe.jpeg",
    "tortinha.jpeg",
    "TMEembalda.png",
    "TMElado.png",
    "TMEmetade.png",

    # Bebidas
    "agua.webp",
    "aguagas.webp",
    "coca.webp",
    "cocazero.webp",

    # Produtos antigos
    "mcafe-optimized.webp",
    "mcafe2-optimized.webp",
    "mcafe3-optimized.webp",
    "moreo-optimized.webp",
    "tiramisu.jpeg",
]

# =========================================================
# CONFIGURAÇÕES
# =========================================================

LARGURA = 1200
ALTURA = 800

# Azul da paleta Pé de Moça (#CDE3E8)
COR_FUNDO = (205, 227, 232, 255)

DESTINO.mkdir(parents=True, exist_ok=True)

# =========================================================
# PROCESSAMENTO DAS IMAGENS
# =========================================================

for nome in ARQUIVOS:
    origem = ASSETS / nome

    if not origem.is_file():
        print(f"Arquivo não encontrado: {origem}")
        continue

    with Image.open(origem) as original:
        imagem = ImageOps.exif_transpose(original).convert("RGBA")

    # Corrige áreas transparentes usando o azul da marca
    base = Image.new("RGBA", imagem.size, COR_FUNDO)
    base.alpha_composite(imagem)

    foto = base.convert("RGB")

    # Fundo desfocado preenchendo o quadro inteiro
    fundo = ImageOps.fit(
        foto,
        (LARGURA, ALTURA),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )

    fundo = fundo.filter(
        ImageFilter.GaussianBlur(radius=35)
    )

    # Foto principal sem distorção ou cortes
    frente = ImageOps.contain(
        foto,
        (LARGURA, ALTURA),
        method=Image.Resampling.LANCZOS,
    )

    # Centralização
    x = (LARGURA - frente.width) // 2
    y = (ALTURA - frente.height) // 2

    fundo.paste(frente, (x, y))

    # Salva em WebP otimizado
    saida = DESTINO / f"{origem.stem}-carousel.webp"

    fundo.save(
        saida,
        "WEBP",
        quality=90,
        method=6,
    )

    print(f"Imagem gerada: {saida}")

print("Processamento concluído!")
