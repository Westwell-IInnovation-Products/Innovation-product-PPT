#!/usr/bin/env bash
# render.sh <pptx-relative-path>  — converts to PDF then per-slide PNGs in output/preview/
set -e
PPTX="$1"
SOFFICE="/c/Program Files/LibreOffice/program/soffice.exe"
PDFTOPPM="/c/Users/admin/AppData/Local/Microsoft/WinGet/Packages/oschwartz10612.Poppler_Microsoft.Winget.Source_8wekyb3d8bbwe/poppler-25.07.0/Library/bin/pdftoppm"
OUT="output/preview"
mkdir -p "$OUT"
rm -f "$OUT"/slide-*.png
PROFILE="file:///C:/tmp/lo_profile_$$"
"$SOFFICE" --headless "-env:UserInstallation=$PROFILE" --convert-to pdf --outdir "$OUT" "$PPTX" >/dev/null 2>&1
PDF="$OUT/$(basename "${PPTX%.pptx}").pdf"
"$PDFTOPPM" -png -r 96 "$PDF" "$OUT/slide" >/dev/null 2>&1
ls "$OUT"/slide-*.png
