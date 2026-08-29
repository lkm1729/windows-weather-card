// Weather Card 桌面客户端入口
// 前端（../ 纯静态文件）通过 fetch 直接访问 Open-Meteo / Wikipedia API，
// 无需任何 Rust 侧命令 —— WebView2 自带完整网络栈。
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")] // 双击运行不弹控制台

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
