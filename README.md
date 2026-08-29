# Weather Card · iOS 风格毛玻璃天气客户端

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-0078D6.svg)]()
[![Size](https://img.shields.io/badge/Size-~3MB-success.svg)]()

轻量级 Windows 桌面天气应用：**液态玻璃拟态 UI + iOS 翻页时钟 + 全球城市实时天气 + 城市街景背景**。
零依赖、免安装、免 API 密钥，开箱即用。

> 📥 **[点此前往下载页](https://github.com/lkm1729/windows-weather-card/releases)** —— 下载 `weather-card.exe`，双击即用，无需安装。

---

## ✨ 功能特性

| | |
|---|---|
| 🪟 **液态玻璃 UI** | iOS 原生风格透明玻璃材质，低不透明度 + 高斯模糊 + 顶缘高光 |
| 🌗 **昼夜双主题** | 白天马卡龙浅色 / 夜晚深色，随所选城市的昼夜自动切换 |
| ⏰ **iOS 翻页时钟** | 纯 CSS 3D 翻页动画，秒级跳动，**钟面跟随城市时区** |
| 🌤️ **实时天气** | 温度 / 体感 / 湿度 / 风速 / 气压 + 未来 5 日预报 |
| 🌍 **全球城市** | 预置 16 座国际都市 + 全球任意城市搜索（支持中文 / 拼音 / 简繁体） |
| 🏙️ **城市街景背景** | 自动从 Wikipedia 匹配城市实景照片（1920px），旗帜类图片自动过滤 |
| 🌧️ **天气动画** | canvas 粒子特效：雨 / 雪 / 云 / 雾 / 星空流星 / 雷电，随实况切换 |
| 📦 **极轻量** | exe 仅约 3MB（Tauri 2 + 系统 WebView2，不打包浏览器内核） |

## 🚀 快速开始

### 方式一：直接下载（推荐）

1. 前往 [Releases 发布页](https://github.com/lkm1729/windows-weather-card/releases)
2. 下载最新版 `weather-card.exe`
3. 双击运行 —— 无需安装，无需配置

> **系统要求**：Windows 10/11（需 WebView2 运行时，Win11 已内置；Win10 大多已随 Edge 自动安装。若启动失败，[点此安装 WebView2](https://developer.microsoft.com/microsoft-edge/webview2/)）。

### 方式二：从源码构建

```bash
git clone https://github.com/lkm1729/windows-weather-card.git
cd windows-weather-card/packaging
cargo build --release
# 产物位于 packaging/target-release/weather-card.exe
```

构建环境：[Rust](https://rustup.rs/) + MSVC Build Tools + WebView2 SDK。

## 📁 目录结构

```
windows-weather-card/
├── download/            # ← 放编译好的 exe（本地用，不入库）
├── frontend/            # 前端源码（纯 HTML/CSS/JS，零构建）
│   ├── index.html
│   ├── css/style.css    # 毛玻璃主题 / 翻页时钟 / 响应式
│   └── js/              # 应用逻辑（api / 时钟 / 天气渲染 / 背景动画）
├── packaging/           # Tauri 2 打包工程（Rust）
│   ├── tauri.conf.json  # 窗口 / 图标 / 打包配置
│   ├── src/main.rs      # 桌面壳入口
│   └── target-release/  # 编译产物（本地，不入库）
├── LICENSE              # MIT
└── README.md
```

## 🔌 数据来源（均免费免密钥，需联网）

| 数据 | 服务 | 说明 |
|---|---|---|
| 天气实况 + 预报 | [Open-Meteo](https://open-meteo.com) | 非商业用途免费 |
| 城市地理编码 / 搜索 | Open-Meteo Geocoding | 全球城市，支持中文 |
| 城市街景背景图 | [Wikimedia Commons](https://commons.wikimedia.org) | 自动匹配、按需加载 |
| 中文拼音/简繁转换 | jsDelivr CDN（pinyin-pro / opencc-js） | 支撑中文搜索联想 |

应用不内置任何天气数据 —— 所有数据实时联网获取。断网时显示提示并回落到渐变背景。

## 🛠️ 技术栈

- **前端**：原生 HTML / CSS / JS（零框架、零构建）
- **桌面壳**：[Tauri 2](https://tauri.app)（Rust，调用系统 WebView2）
- **动画**：CSS 3D transform 翻页时钟 + Canvas 2D 粒子系统
- **字体**：MiSans（中文）/ Poppins（英文数字，Google Sans 风格）

## 📝 许可

[MIT](./LICENSE) © 2026 lkm1729

天气数据由 [Open-Meteo](https://open-meteo.com) 提供（CC BY 4.0）；
背景图片来自 Wikimedia Commons，版权归各自作者所有。
