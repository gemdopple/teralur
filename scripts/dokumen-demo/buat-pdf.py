# Pipeline dokumen demo (2/3 — buat PDF): satu PDF "Lembar Informasi Paket
# Pekerjaan" per proyek dari scripts/dokumen-demo/proyek.json.
# Jalankan: python scripts/dokumen-demo/buat-pdf.py  (butuh: pip install reportlab)
# Urutan lengkap: ambil-data.mts -> buat-pdf.py -> unggah.mts
# Membuat satu PDF "lembar informasi paket pekerjaan" per proyek demo (A4, 1 halaman).
# Sumber data: scripts/dokumen-demo/proyek.json (dump DB). Keluaran: scripts/dokumen-demo/pdf/<slug>.pdf
from __future__ import annotations

import json
from datetime import date

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

GELAP = "#1B1917"
ABU = "#5B5652"
GARIS = "#B9B3AC"

STYLE_KICKER = ParagraphStyle(
    "kicker", fontName="Helvetica-Bold", fontSize=8.5, leading=11,
    textColor=ABU, tracking=0,
)
STYLE_JUDUL = ParagraphStyle(
    "judul", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=GELAP,
    spaceBefore=6,
)
STYLE_SEL = ParagraphStyle(
    "sel", fontName="Helvetica", fontSize=9.5, leading=13, textColor=GELAP,
)
STYLE_SEL_KUNCI = ParagraphStyle(
    "kunci", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=ABU,
)
STYLE_TTD_PERAN = ParagraphStyle(
    "ttd", fontName="Helvetica", fontSize=9.5, leading=13, textColor=GELAP,
)
STYLE_TTD_NAMA = ParagraphStyle(
    "ttd2", fontName="Helvetica-Bold", fontSize=9.5, leading=13, textColor=GELAP,
)


def rupiah(n: int) -> str:
    return "Rp " + f"{n:,}".replace(",", ".")


def paragraf_aman(teks: str, font: str, ukuran: float, lebar: float) -> Paragraph:
    # ReportLab tidak memotong kata panjang otomatis di semua font — aman karena
    # nilai dari seed pendek; fungsi tetap dipakai agar tabel selalu Paragraph.
    return Paragraph(teks, STYLE_SEL if font == "normal" else STYLE_SEL_KUNCI)


def buat_pdf(proyek: dict, jalur: str) -> None:
    papan = proyek["papan"]
    record = proyek["record"]
    satuan_kerja = papan.get("satuan_kerja") or "Dinas Pekerjaan Umum"
    nomor_kontrak = papan.get("nomor_kontrak") or "-"
    paket = record["nama_paket"]
    penyedia = record.get("penyedia") or papan.get("penyedia") or "-"
    nilai = int(record.get("nilai_kontrak") or 0)
    tanggal_kontrak = record.get("tanggal_kontrak") or "-"
    masa_hari = papan.get("masa_hari")
    lokasi = papan.get("lokasi_teks") or "-"
    sumber_dana = papan.get("sumber_dana") or "APBD"
    tahun = papan.get("tahun_anggaran") or "-"

    doc = SimpleDocTemplate(
        jalur,
        pagesize=A4,
        leftMargin=22 * mm,
        rightMargin=22 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        title=f"Lembar Informasi Paket — {paket}",
        author=satuan_kerja,
        subject="Lembar informasi paket pekerjaan",
        creator=satuan_kerja,
    )
    lebar = A4[0] - doc.leftMargin - doc.rightMargin

    cerita = [
        Paragraph(satuan_kerja.upper(), STYLE_KICKER),
        Paragraph("LEMBAR INFORMASI PAKET PEKERJAAN", STYLE_JUDUL),
        Paragraph(f"Nomor: {nomor_kontrak}", STYLE_SEL),
        Spacer(1, 4 * mm),
    ]

    baris = [
        ("Nama paket", paket),
        ("Penyedia", penyedia),
        ("Nilai kontrak", rupiah(nilai)),
        ("Nomor kontrak", nomor_kontrak),
        ("Tanggal kontrak", tanggal_kontrak),
        ("Masa pelaksanaan", f"{masa_hari} hari kalender" if masa_hari else "-"),
        ("Lokasi pekerjaan", lokasi),
        ("Sumber dana", f"{sumber_dana} · Tahun anggaran {tahun}"),
    ]
    tabel = Table(
        [[paragraf_aman(k, "kunci", 9.5, lebar * 0.28), paragraf_aman(v, "normal", 9.5, lebar * 0.72)] for k, v in baris],
        colWidths=[lebar * 0.28, lebar * 0.72],
        hAlign="CENTER",
    )
    tabel.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, -2), 0.4, GARIS),
                ("LINEBELOW", (0, -1), (-1, -1), 0.8, GELAP),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    cerita += [tabel, Spacer(1, 7 * mm)]

    ringkas = (
        f"Paket pada lembar ini telah ditetapkan dengan {penyedia} sesuai nomor dan "
        f"tanggal kontrak di atas. Penyedia melaksanakan pekerjaan dalam masa "
        f"pelaksanaan tercatat dan wajib memasang papan informasi proyek di lokasi."
    )
    cerita += [Paragraph(ringkas, STYLE_SEL), Spacer(1, 14 * mm)]

    kotak = lebar * 0.46
    ttd = Table(
        [
            [
                Paragraph("PIHAK PERTAMA,<br/>" + satuan_kerja, STYLE_TTD_PERAN),
                Paragraph("PIHAK KEDUA,<br/>" + penyedia, STYLE_TTD_PERAN),
            ],
            [Spacer(1, 16 * mm), Spacer(1, 16 * mm)],
            [
                Paragraph("..........................................", STYLE_TTD_NAMA),
                Paragraph("..........................................", STYLE_TTD_NAMA),
            ],
        ],
        colWidths=[kotak, kotak],
        hAlign="CENTER",
    )
    ttd.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    cerita += [ttd, Spacer(1, 8 * mm)]

    dicetak = record.get("snapshot_tanggal") or date.today().isoformat()
    footer = ParagraphStyle(
        "footer", fontName="Helvetica-Oblique", fontSize=8, leading=10, textColor=ABU,
    )
    cerita += [
        Paragraph(
            f"Dokumen ini merupakan salinan elektronik yang tercantum dalam catatan resmi per {dicetak}. "
            "Lembar informasi paket pekerjaan — " + satuan_kerja + ".",
            footer,
        )
    ]

    doc.build(cerita)


with open("scripts/dokumen-demo/proyek.json", encoding="utf-8") as f:
    daftar = json.load(f)

import os

os.makedirs("scripts/dokumen-demo/pdf", exist_ok=True)
for p in daftar:
    jalur = f"scripts/dokumen-demo/pdf/{p['slug']}.pdf"
    buat_pdf(p, jalur)
    print(jalur)
print("selesai:", len(daftar))
