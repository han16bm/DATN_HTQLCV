#!/usr/bin/env bash
# Chạy full dự án: Postgres (Docker) → migration → seed → Gateway + 4 service → FE (http mode).
# Dùng: ./run.sh            (Git Bash)
#       ./run.sh --reset    (xoá dữ liệu nghiệp vụ và seed lại)
# Ctrl+C để tắt tất cả. Log BE ở ./logs/*.log
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
BE="$ROOT/BE"; FE="$ROOT/FE"; LOGS="$ROOT/logs"
mkdir -p "$LOGS"
PORTS="3000 5000 5101 5102 5103 5104"   # FE, Gateway, Identity, Projects, Tasks, Analytics
PIDS=()

# Kill process đang giữ các port của dự án (lần chạy trước bị tắt ngang vẫn còn sót)
free_ports() {
  for port in $PORTS; do
    for pid in $(netstat -ano | awk -v p=":$port" '$2 ~ p"$" && /LISTENING/ {print $5}' | sort -u); do
      taskkill //F //T //PID "$pid" >/dev/null 2>&1 || true
    done
  done
}

cleanup() {
  trap - EXIT INT TERM
  echo; echo "Đang tắt..."
  for p in "${PIDS[@]}"; do
    # dotnet run / npm sinh process con: kill cả cây qua taskkill
    w=$(cat /proc/$p/winpid 2>/dev/null || true)
    [[ -n "$w" ]] && taskkill //F //T //PID "$w" >/dev/null 2>&1 || true
  done
  free_ports
}
trap cleanup EXIT INT TERM
free_ports

# 1. Cấu hình BE (gitignore). Máy mới: trỏ vào Postgres Docker cục bộ.
if [[ ! -f "$BE/appsettings.Shared.json" ]]; then
  echo "Tạo BE/appsettings.Shared.json trỏ vào Postgres Docker cục bộ (localhost:55432)"
  key=$(head -c 48 /dev/urandom | base64 | tr -d '\n/+=')
  cat > "$BE/appsettings.Shared.json" <<EOF
{
  "ConnectionStrings": { "DefaultConnection": "Host=localhost;Port=55432;Database=datn;Username=datn;Password=datn_dev_only" },
  "Jwt": { "SigningKey": "$key" },
  "CentralConfig": { "ReloadSeconds": 30 }
}
EOF
fi

# 2. DB: chỉ bật Docker khi config trỏ vào localhost:55432 (nếu dùng Neon thì bỏ qua)
if grep -q "55432" "$BE/appsettings.Shared.json"; then
  docker compose -f "$ROOT/docker-compose.yml" up -d db
  echo -n "Chờ Postgres"
  until docker exec datn-postgres pg_isready -U datn >/dev/null 2>&1; do echo -n "."; sleep 1; done; echo " OK"
fi

# 3. Build + migration + seed
cd "$BE"
echo "Build BE..."
dotnet build DATN.slnx -v q -nologo -clp:ErrorsOnly
echo "Áp migration (log: logs/setup.log)..."
dotnet ef database update --no-build --project Shared/Shared.Entities --startup-project Services/Identity.Api --context ApplicationDbContext > "$LOGS/setup.log" 2>&1 \
  || { tail -20 "$LOGS/setup.log"; exit 1; }
if [[ "${1:-}" == "--reset" ]]; then
  dotnet run --no-build --project Tools/DataSeeder -- --reset >> "$LOGS/setup.log" 2>&1 || { tail -20 "$LOGS/setup.log"; exit 1; }
  echo "Đã seed lại dữ liệu."
else
  dotnet run --no-build --project Tools/DataSeeder >> "$LOGS/setup.log" 2>&1 && echo "Đã seed dữ liệu mẫu." || echo "Seed bỏ qua: DB đã có dữ liệu (dùng --reset để nạp lại)."
fi

# 4. BE services (port theo launchSettings: Gateway 5000, Identity 5101, Projects 5102, Tasks 5103, Analytics 5104)
for proj in Services/Identity.Api Services/Projects.Api Services/Tasks.Api Services/Analytics.Api Gateway; do
  name=$(basename "$proj")
  dotnet run --no-build --project "$proj" > "$LOGS/$name.log" 2>&1 &
  PIDS+=($!)
  echo "▶ $name  (log: logs/$name.log)"
done

# 5. FE ở chế độ http → Gateway
cd "$FE"
if [[ ! -f .env ]]; then
  cp .env.example .env
fi
sed -i 's|^NEXT_PUBLIC_API_MODE=.*|NEXT_PUBLIC_API_MODE=http|; s|^NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api|' .env
[[ -d node_modules ]] || npm install --no-fund --no-audit

echo "▶ FE: http://localhost:3000   |   Gateway: http://localhost:5000"
npm run dev &
PIDS+=($!)
wait
