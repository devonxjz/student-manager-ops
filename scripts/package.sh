#!/usr/bin/env bash
set -euo pipefail

# Script đóng gói ứng dụng cho AWS Elastic Beanstalk
# Cách dùng: bash scripts/package.sh [version]
# Ví dụ: bash scripts/package.sh v1

VERSION="${1:-v1}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
OUTPUT_ZIP="$DIST_DIR/student-manager-$VERSION.zip"

echo "=========================================="
echo "  ĐÓNG GÓI ỨNG DỤNG CHO ELASTIC BEANSTALK"
echo "  Phiên bản: $VERSION"
echo "=========================================="

cd "$ROOT_DIR"

# 1. Build frontend React
echo "-> [1/4] Build frontend React..."
npm --prefix client run build

if [ ! -f "$ROOT_DIR/client/dist/index.html" ]; then
  echo "Lỗi: Không tìm thấy client/dist/index.html sau khi build!" >&2
  exit 1
fi

# 2. Chuẩn bị thư mục dist
echo "-> [2/4] Chuẩn bị thư mục xuất file dist/..."
mkdir -p "$DIST_DIR"
rm -f "$OUTPUT_ZIP"

# 3. Tạo file nén zip
echo "-> [3/4] Đang nén các thành phần cần thiết vào $OUTPUT_ZIP..."
zip -r -q "$OUTPUT_ZIP" \
  Procfile \
  package.json \
  .ebextensions \
  server \
  client/dist \
  -x "server/node_modules/*" \
  -x "server/.env*" \
  -x "server/env*" \
  -x "server/tests/*" \
  -x "*.git*" \
  -x "*.DS_Store"

# 4. Kiểm tra kết quả
echo "-> [4/4] Kiểm tra gói triển khai..."
if [ -f "$OUTPUT_ZIP" ]; then
  SIZE=$(du -h "$OUTPUT_ZIP" | cut -f1)
  echo ""
  echo "=========================================="
  echo "  THÀNH CÔNG!"
  echo "  Tệp nén: $OUTPUT_ZIP"
  echo "  Dung lượng: $SIZE"
  echo "=========================================="
  echo ""
  echo "Các tệp chính trong gói zip:"
  unzip -l "$OUTPUT_ZIP" || true
else
  echo "Lỗi: Đóng gói thất bại!" >&2
  exit 1
fi
