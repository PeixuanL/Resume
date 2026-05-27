# FactVerse AI Agent — Installation Guide
# FactVerse AI Agent — 安装指南
# FactVerse AI Agent — インストールガイド
# FactVerse AI Agent — 安裝指南

---

## 🇺🇸 English

### Prerequisites

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Ubuntu 22.04 / CentOS 8+ | Ubuntu 22.04 LTS |
| CPU | 4 cores | 8 cores |
| RAM | 16 GB | 32 GB |
| Disk | 100 GB SSD | 500 GB SSD |
| Docker | 24.0+ | Latest stable |

### Quick Install (Online)

```bash
# 1. Clone or download installer
git clone https://github.com/jieseattle/factverse-ai-agent.git
cd factverse-ai-agent

# 2. Run installer
bash deploy/installer/install.sh
```

### Offline Install

```bash
# 1. On a machine with internet access, build the offline bundle
bash deploy/installer/package-offline.sh

# 2. Transfer factverse-offline-<version>.tar.gz to target server
scp factverse-offline-*.tar.gz user@your-server:/tmp/

# 3. On target server, extract and install
mkdir /tmp/factverse-offline
tar -xzf /tmp/factverse-offline-*.tar.gz -C /tmp/factverse-offline
bash /tmp/factverse-offline/install.sh --offline=/tmp/factverse-offline/images
```

### Configuration

During installation, you will be prompted for:

- **Domain** — Your server's domain or IP (e.g., `factverse.yourcompany.com`)
- **Admin password** — Default: `admin123` (change this!)
- **License JWT** — For on-premise license. Leave empty for SaaS mode.
- **OpenAI API Key** — Optional. Enables AI Advisor features.

### Upgrade

```bash
bash deploy/installer/upgrade.sh
```

Automatically backs up data, pulls new images, performs rolling update, and rolls back on failure.

### Uninstall

```bash
# Remove everything (including data)
bash deploy/installer/uninstall.sh

# Remove software only, keep data
bash deploy/installer/uninstall.sh --keep-data
```

### Access

After installation:
- URL: `https://your-domain`
- Default login: `admin` / `admin123`
- Logs: `docker compose -f deploy/installer/docker-compose.yml logs -f`

### Post-Install Operations

```bash
# Daily backup (2 AM, 7-day retention)
echo "0 2 * * * /opt/factverse/scripts/backup.sh >> /var/log/factverse-backup.log 2>&1" | sudo crontab -

# Health check every 5 minutes (auto-restart on failure)
echo "*/5 * * * * /opt/factverse/scripts/healthcheck.sh >> /var/log/factverse-health.log 2>&1" | sudo crontab -

# Restore from backup
zcat /data/backups/factverse-YYYYMMDD.sql.gz | docker exec -i fv-postgres psql -U postgres factverse
```

### Demo Mode

Pages using simulated data show a "Demo Data" badge. After connecting real sensors:

```bash
# Check current state
bash deploy/demo-mode.sh status

# Disable demo badges (after real sensor connection)
bash deploy/demo-mode.sh off

# Re-enable if needed
bash deploy/demo-mode.sh on
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend not starting | `docker compose logs fv-backend` — check for migration errors |
| Database connection failed | Verify `POSTGRES_PASSWORD` in `.env` |
| Port 80/443 in use | Stop existing web server or change port in `docker-compose.yml` |
| Disk full | `docker system prune -f` to free space |
| License error | Check `LICENSE_JWT` in `.env` — must be a valid JWT |
| Demo badges won't hide | Run `bash deploy/demo-mode.sh off` |

---

## 🇨🇳 简体中文

### 系统要求

| 组件 | 最低配置 | 推荐配置 |
|------|---------|---------|
| 操作系统 | Ubuntu 22.04 / CentOS 8+ | Ubuntu 22.04 LTS |
| CPU | 4 核 | 8 核 |
| 内存 | 16 GB | 32 GB |
| 磁盘 | 100 GB SSD | 500 GB SSD |
| Docker | 24.0+ | 最新稳定版 |

### 在线快速安装

```bash
# 1. 克隆或下载安装包
git clone https://github.com/jieseattle/factverse-ai-agent.git
cd factverse-ai-agent

# 2. 运行安装脚本
bash deploy/installer/install.sh
```

### 离线安装（适用于无公网环境）

```bash
# 1. 在有网络的机器上打包离线镜像
bash deploy/installer/package-offline.sh

# 2. 将 factverse-offline-<版本>.tar.gz 传输到目标服务器
scp factverse-offline-*.tar.gz user@your-server:/tmp/

# 3. 在目标服务器上解压并安装
mkdir /tmp/factverse-offline
tar -xzf /tmp/factverse-offline-*.tar.gz -C /tmp/factverse-offline
bash /tmp/factverse-offline/install.sh --offline=/tmp/factverse-offline/images
```

### 配置说明

安装过程中，脚本会提示输入以下信息：

- **域名** — 服务器域名或 IP（例如：`factverse.yourcompany.com`）
- **管理员密码** — 默认为 `admin123`，**建议修改**
- **License JWT** — 私有化部署的授权密钥，SaaS 模式留空
- **OpenAI API Key** — 可选，启用 AI Advisor 功能

### 升级

```bash
bash deploy/installer/upgrade.sh
```

自动备份数据 → 拉取新镜像 → 滚动更新 → 失败自动回滚。

### 卸载

```bash
# 完全卸载（含数据）
bash deploy/installer/uninstall.sh

# 仅删除软件，保留数据
bash deploy/installer/uninstall.sh --keep-data
```

### 访问

安装完成后：
- 访问地址：`https://你的域名`
- 默认账号：`admin` / `admin123`
- 查看日志：`docker compose -f deploy/installer/docker-compose.yml logs -f`

### 安装后运维

```bash
# 每日凌晨 2 点自动备份（保留 7 天）
echo "0 2 * * * /opt/factverse/scripts/backup.sh >> /var/log/factverse-backup.log 2>&1" | sudo crontab -

# 每 5 分钟健康检查（异常自动重启）
echo "*/5 * * * * /opt/factverse/scripts/healthcheck.sh >> /var/log/factverse-health.log 2>&1" | sudo crontab -

# 从备份恢复
zcat /data/backups/factverse-YYYYMMDD.sql.gz | docker exec -i fv-postgres psql -U postgres factverse
```

### 演示模式

使用模拟数据的页面会显示"演示数据"提示。接入真实传感器后：

```bash
bash deploy/demo-mode.sh status   # 查看当前状态
bash deploy/demo-mode.sh off      # 关闭演示标注
bash deploy/demo-mode.sh on       # 重新开启
```

### 故障排查

| 问题 | 解决方案 |
|------|---------|
| 后端无法启动 | `docker compose logs fv-backend` — 检查 migration 错误 |
| 数据库连接失败 | 检查 `.env` 中的 `POSTGRES_PASSWORD` |
| 端口 80/443 被占用 | 停止已有 Web 服务，或修改 `docker-compose.yml` 中的端口 |
| 磁盘空间不足 | 执行 `docker system prune -f` 释放空间 |
| License 错误 | 检查 `.env` 中的 `LICENSE_JWT`，必须是有效的 JWT 格式 |
| 演示标注不消失 | 执行 `bash deploy/demo-mode.sh off` |

---

## 🇹🇼 繁體中文

### 系統需求

| 元件 | 最低配置 | 建議配置 |
|------|---------|---------|
| 作業系統 | Ubuntu 22.04 / CentOS 8+ | Ubuntu 22.04 LTS |
| CPU | 4 核 | 8 核 |
| 記憶體 | 16 GB | 32 GB |
| 磁碟 | 100 GB SSD | 500 GB SSD |
| Docker | 24.0+ | 最新穩定版 |

### 線上快速安裝

```bash
# 1. 克隆或下載安裝包
git clone https://github.com/jieseattle/factverse-ai-agent.git
cd factverse-ai-agent

# 2. 執行安裝腳本
bash deploy/installer/install.sh
```

### 離線安裝（適用於無公網環境）

```bash
# 1. 在有網路的機器上打包離線映像檔
bash deploy/installer/package-offline.sh

# 2. 將 factverse-offline-<版本>.tar.gz 傳輸到目標伺服器
scp factverse-offline-*.tar.gz user@your-server:/tmp/

# 3. 在目標伺服器上解壓縮並安裝
mkdir /tmp/factverse-offline
tar -xzf /tmp/factverse-offline-*.tar.gz -C /tmp/factverse-offline
bash /tmp/factverse-offline/install.sh --offline=/tmp/factverse-offline/images
```

### 設定說明

安裝過程中，腳本會提示輸入以下資訊：

- **網域** — 伺服器網域或 IP（例如：`factverse.yourcompany.com`）
- **管理員密碼** — 預設為 `admin123`，**建議修改**
- **License JWT** — 私有化部署的授權金鑰，SaaS 模式留空
- **OpenAI API Key** — 選填，啟用 AI Advisor 功能

### 升級

```bash
bash deploy/installer/upgrade.sh
```

自動備份資料 → 拉取新映像檔 → 滾動更新 → 失敗自動回滾。

### 解除安裝

```bash
# 完全解除安裝（含資料）
bash deploy/installer/uninstall.sh

# 僅刪除軟體，保留資料
bash deploy/installer/uninstall.sh --keep-data
```

### 存取

安裝完成後：
- 存取網址：`https://你的網域`
- 預設帳號：`admin` / `admin123`
- 查看日誌：`docker compose -f deploy/installer/docker-compose.yml logs -f`

### 安裝後運維

```bash
# 每日凌晨 2 點自動備份（保留 7 天）
echo "0 2 * * * /opt/factverse/scripts/backup.sh >> /var/log/factverse-backup.log 2>&1" | sudo crontab -

# 每 5 分鐘健康檢查（異常自動重啟）
echo "*/5 * * * * /opt/factverse/scripts/healthcheck.sh >> /var/log/factverse-health.log 2>&1" | sudo crontab -
```

### 演示模式

使用模擬資料的頁面會顯示「演示資料」提示。接入真實感測器後：

```bash
bash deploy/demo-mode.sh off      # 關閉演示標注
```

### 故障排除

| 問題 | 解決方案 |
|------|---------|
| 後端無法啟動 | `docker compose logs fv-backend` — 檢查 migration 錯誤 |
| 資料庫連線失敗 | 檢查 `.env` 中的 `POSTGRES_PASSWORD` |
| 連接埠 80/443 被占用 | 停止已有 Web 服務，或修改 `docker-compose.yml` 中的連接埠 |
| 磁碟空間不足 | 執行 `docker system prune -f` 釋放空間 |
| License 錯誤 | 檢查 `.env` 中的 `LICENSE_JWT`，必須是有效的 JWT 格式 |
| 演示標注不消失 | 執行 `bash deploy/demo-mode.sh off` |

---

## 🇯🇵 日本語

### システム要件

| コンポーネント | 最小要件 | 推奨 |
|-------------|---------|------|
| OS | Ubuntu 22.04 / CentOS 8+ | Ubuntu 22.04 LTS |
| CPU | 4コア | 8コア |
| メモリ | 16 GB | 32 GB |
| ディスク | 100 GB SSD | 500 GB SSD |
| Docker | 24.0+ | 最新安定版 |

### オンラインインストール

```bash
# 1. リポジトリのクローンまたはインストーラーのダウンロード
git clone https://github.com/jieseattle/factverse-ai-agent.git
cd factverse-ai-agent

# 2. インストーラーの実行
bash deploy/installer/install.sh
```

### オフラインインストール（インターネット非接続環境向け）

```bash
# 1. インターネット接続可能なマシンでオフラインバンドルを作成
bash deploy/installer/package-offline.sh

# 2. factverse-offline-<バージョン>.tar.gz をターゲットサーバーに転送
scp factverse-offline-*.tar.gz user@your-server:/tmp/

# 3. ターゲットサーバーで展開してインストール
mkdir /tmp/factverse-offline
tar -xzf /tmp/factverse-offline-*.tar.gz -C /tmp/factverse-offline
bash /tmp/factverse-offline/install.sh --offline=/tmp/factverse-offline/images
```

### 設定

インストール中に以下の情報を入力するプロンプトが表示されます：

- **ドメイン** — サーバーのドメインまたはIP（例：`factverse.yourcompany.com`）
- **管理者パスワード** — デフォルト：`admin123`（変更を推奨）
- **License JWT** — オンプレミスライセンス用。SaaSモードの場合は空欄
- **OpenAI APIキー** — 任意。AI Advisor機能を有効化

### アップグレード

```bash
bash deploy/installer/upgrade.sh
```

データの自動バックアップ → 新しいイメージの取得 → ローリングアップデート → 失敗時の自動ロールバック。

### アンインストール

```bash
# 完全アンインストール（データ含む）
bash deploy/installer/uninstall.sh

# ソフトウェアのみ削除、データ保持
bash deploy/installer/uninstall.sh --keep-data
```

### アクセス

インストール完了後：
- URL：`https://your-domain`
- デフォルトログイン：`admin` / `admin123`
- ログ確認：`docker compose -f deploy/installer/docker-compose.yml logs -f`

### インストール後の運用

```bash
# 毎日午前2時に自動バックアップ（7日間保持）
echo "0 2 * * * /opt/factverse/scripts/backup.sh >> /var/log/factverse-backup.log 2>&1" | sudo crontab -

# 5分ごとのヘルスチェック（異常時自動再起動）
echo "*/5 * * * * /opt/factverse/scripts/healthcheck.sh >> /var/log/factverse-health.log 2>&1" | sudo crontab -
```

### デモモード

シミュレーションデータを使用するページには「デモデータ」バッジが表示されます。実センサー接続後：

```bash
bash deploy/demo-mode.sh off      # デモバッジを非表示
```

### トラブルシューティング

| 問題 | 解決策 |
|------|-------|
| バックエンドが起動しない | `docker compose logs fv-backend` — migrationエラーを確認 |
| データベース接続失敗 | `.env` の `POSTGRES_PASSWORD` を確認 |
| ポート80/443が使用中 | 既存のWebサーバーを停止、または `docker-compose.yml` のポートを変更 |
| ディスク容量不足 | `docker system prune -f` で空き容量を確保 |
| Licenseエラー | `.env` の `LICENSE_JWT` を確認。有効なJWT形式であること |
| デモバッジが消えない | `bash deploy/demo-mode.sh off` を実行 |

---

*FactVerse AI Agent — © DataMesh Inc. All rights reserved.*
