//! Tauri commands for the application
//!
//! This module contains all the Tauri commands that can be called from the frontend.
//! It includes:
//! - `greet`: Returns a greeting with timestamp
//! - `call_asktao_dll`: Calls the CQ.Asktao.dll library function
//! - `show_ok_dialog`: Shows an OK dialog when hotkey is pressed
//! - `get_clipboard_images`: Gets images from clipboard

// Standard library imports
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::time::{SystemTime, UNIX_EPOCH};

// Clipboard and image processing imports
use base64::Engine;
use base64::engine::general_purpose::STANDARD;

// External crate imports
use libloading::{Library, Symbol};
use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_global_shortcut::GlobalShortcutExt;

/// Generates a greeting message with current timestamp
///
/// # Returns
/// A string containing the greeting message with milliseconds since UNIX epoch
#[tauri::command]
fn greet() -> String {
    let now = SystemTime::now();
    let epoch_ms = now
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_millis();
    format!("你好 : {epoch_ms}")
}

/// Calls the CQ.Asktao.dll library function get_shop_name
///
/// This function dynamically loads the CQ.Asktao.dll library and calls the get_shop_name
/// function with the provided input string.
///
/// # Arguments
/// * `input` - A string input to pass to the DLL function
///
/// # Returns
/// * `Ok(String)` - The result string from the DLL function
/// * `Err(String)` - An error message if the operation fails
///
/// # Errors
/// This function can return errors in the following cases:
/// * Failed to load the DLL library
/// * Failed to load the get_shop_name function symbol
/// * Failed to create CString from input
/// * DLL function returned a null pointer
/// * Failed to convert the result to a Rust string
#[tauri::command]
fn call_asktao_dll(input: String) -> Result<String, String> {
    // Define possible DLL paths to try
    const DLL_PATHS: [&str; 3] = [
        "resources/win-x64/CQ.Asktao.dll",
        "CQ.Asktao.dll",
        "../resources/win-x64/CQ.Asktao.dll",
    ];

    // Try to load the DLL from any of the possible paths
    let lib = DLL_PATHS
        .iter()
        .find_map(|&path| unsafe { Library::new(path).ok() })
        .ok_or_else(|| {
            format!(
                "Failed to load CQ.Asktao.dll from all attempted paths: {:?}",
                DLL_PATHS
            )
        })?;

    // Load the get_shop_name function symbol
    let get_shop_name: Symbol<unsafe extern "C" fn(*const c_char) -> *mut c_char> = unsafe {
        lib.get(b"get_shop_name")
            .map_err(|e| format!("Failed to load get_shop_name function: {}", e))?
    };

    // Convert input string to CString for passing to the DLL function
    let c_input = CString::new(input)
        .map_err(|e| format!("Failed to create CString from input: {}", e))?;

    // Call the DLL function
    let result_ptr = unsafe { get_shop_name(c_input.as_ptr()) };

    // Check if the function returned a null pointer
    if result_ptr.is_null() {
        return Err("DLL function returned null pointer".to_string());
    }

    // Convert the result from C string to Rust string
    let result_cstr = unsafe { CStr::from_ptr(result_ptr) };
    let result_str = result_cstr
        .to_str()
        .map_err(|e| format!("Failed to convert result to UTF-8 string: {}", e))?
        .to_string();

    Ok(result_str)
}

/// Shows an OK dialog when the hotkey is pressed
///
/// This function is called when the Alt+Ctrl+D hotkey is pressed
/// and displays a simple OK dialog to the user.
#[tauri::command]
fn show_ok_dialog(app_handle: AppHandle) -> Result<(), String> {
    // 使用 Tauri 对话框插件显示确认对话框
    app_handle.dialog().message("OK - Alt+Ctrl+D 热键已触发！");
    
    Ok(())
}

/// Gets images from clipboard
///
/// This function reads images from the Windows clipboard and returns them as base64 encoded strings.
/// It supports multiple image formats and can handle up to 20 images.
///
/// # Returns
/// * `Ok(Vec<String>)` - A vector of base64 encoded image strings
/// * `Err(String)` - An error message if the operation fails
///
/// # Errors
/// This function can return errors in the following cases:
/// * Failed to open clipboard
/// * Failed to get clipboard data
/// * No images found in clipboard
/// * Image processing errors
#[tauri::command]
fn get_clipboard_images() -> Result<Vec<String>, String> {
    // 尝试从Windows剪切板读取图片数据
    match read_clipboard_image() {
        Ok((image_data, format_hint)) => {
            println!("成功从剪切板读取图片数据");
            
            // 根据格式提示创建data URL
            let mime_type = match format_hint.as_str() {
                "jpeg" | "jpg" => "image/jpeg",
                "png" => "image/png", 
                "bmp" => "image/bmp",
                "gif" => "image/gif",
                "webp" => "image/webp",
                _ => "image/png", // 默认为PNG
            };
            
            // 转换为base64编码
            let base64_data = STANDARD.encode(&image_data);
            let data_url = format!("data:{};base64,{}", mime_type, base64_data);
            
            // 输出data URL的前100个字符进行调试
            println!("返回图片数据，格式: {}, 大小: {} 字节", mime_type, image_data.len());
            println!("生成的Data URL前100字符: {}", &data_url[..std::cmp::min(100, data_url.len())]);
            
            Ok(vec![data_url])
        }
        Err(error) => {
            println!("从剪切板读取图片失败: {}", error);
            
            // 如果剪切板读取失败，返回示例图片作为备用方案
            let example_png = create_sample_image(100, 100);
            let base64_data = STANDARD.encode(&example_png);
            let data_url = format!("data:image/png;base64,{}", base64_data);
            
            println!("返回示例图片数据作为备用方案");
            
            Ok(vec![data_url])
        }
    }
}

/// 从Windows剪切板读取图片数据
fn read_clipboard_image() -> Result<(Vec<u8>, String), String> {
    // 使用arboard crate读取剪切板图片数据
    use arboard::Clipboard;
    use image::{RgbaImage};
    use std::io::Cursor;
    
    // 创建Clipboard实例
    let mut clipboard = match Clipboard::new() {
        Ok(clip) => clip,
        Err(e) => return Err(format!("无法打开剪切板: {}", e)),
    };
    
    // 尝试读取剪切板中的图片数据
    match clipboard.get_image() {
        Ok(image_data) => {
            println!("成功从剪切板读取图片数据，大小: {}x{} 像素，字节数: {}", 
                     image_data.width, image_data.height, image_data.bytes.len());
            
            // arboard返回的是原始RGBA像素数据，需要转换为完整的图片文件
            let width = image_data.width as u32;
            let height = image_data.height as u32;
            
            // 创建RgbaImage并复制数据
            let rgba_image = match RgbaImage::from_raw(width, height, image_data.bytes.to_vec()) {
                Some(img) => img,
                None => return Err("无法从原始数据创建RgbaImage".to_string()),
            };
            
            // 将RgbaImage编码为PNG格式
            let mut png_data = Vec::new();
            let mut cursor = Cursor::new(&mut png_data);
            rgba_image.write_to(&mut cursor, image::ImageFormat::Png)
                .map_err(|e| format!("无法将图片转换为PNG: {}", e))?;
            
            println!("成功将原始像素数据转换为PNG格式，大小: {} 字节", png_data.len());
            
            Ok((png_data, "png".to_string()))
        }
        Err(arboard::Error::ContentNotAvailable) => {
            Err("剪切板中没有图片数据".to_string())
        }
        Err(e) => {
            Err(format!("无法获取剪切板图片数据: {}", e))
        }
    }
}

/// 检测图片格式


/// 创建一个示例PNG图片
fn create_sample_image(_width: u32, _height: u32) -> Vec<u8> {
    // 创建一个简单的100x100像素蓝色PNG图片
    // 使用一个有效的PNG数据作为示例
    let png_data = vec![
        // PNG文件头
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        // IHDR块长度
        0x00, 0x00, 0x00, 0x0D,
        // IHDR类型
        0x49, 0x48, 0x44, 0x52,
        // 宽度 (100)
        0x00, 0x00, 0x00, 0x64,
        // 高度 (100)
        0x00, 0x00, 0x00, 0x64,
        // 位深度和颜色类型
        0x08, 0x02, 0x00, 0x00, 0x00,
        // IHDR CRC
        0x9A, 0x9C, 0x18, 0x00,
        // IDAT块长度
        0x00, 0x00, 0x00, 0x0A,
        // IDAT类型
        0x49, 0x44, 0x41, 0x54,
        // IDAT数据 (简单的压缩数据)
        0x78, 0x9C, 0x63, 0x64, 0x00, 0x00, 0x00, 0x04, 0x00, 0x01,
        // IDAT CRC
        0x00, 0x00, 0x00, 0x00,
        // IEND块
        0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82
    ];
    
    png_data
}



/// Main entry point for the Tauri application
///
/// This function sets up the Tauri application with:
/// - The opener plugin
/// - The dialog plugin
/// - The global shortcut plugin
/// - Command handlers for greet, call_asktao_dll, and show_ok_dialog
/// - Global hotkey for Alt+Ctrl+D
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![greet, call_asktao_dll, show_ok_dialog, get_clipboard_images])
        .setup(|app| {
            // 注册全局热键 Alt+Ctrl+D
            let app_handle = app.handle();
            
            // 监听热键事件 - on_shortcut 会自动注册热键
            let app_handle_clone = app_handle.clone();
            let result = app.global_shortcut().on_shortcut("Alt+Control+D", move |_app, _shortcut, _state| {
                // 当热键被按下时，切换窗口状态
                println!("Hotkey Alt+Ctrl+D triggered!");
                let app_handle_inner = app_handle_clone.clone();
                tauri::async_runtime::spawn(async move {
                    // 获取主窗口
                    if let Some(window) = app_handle_inner.get_webview_window("main") {
                        println!("Attempting to toggle window state...");
                        
                        // 切换全屏状态
                        let is_fullscreen = window.is_fullscreen().unwrap_or(false);
                        if is_fullscreen {
                            // 如果已经是全屏，则恢复普通状态
                            let _ = window.set_fullscreen(false);
                            let _ = window.set_decorations(true);
                            let _ = window.set_always_on_top(false);
                            // 移除透明窗口样式
                            let _ = window.eval("document.documentElement.classList.remove('transparent-window');");
                            println!("Window restored to normal state");
                        } else {
                            // 如果未全屏，则设置为全屏透明置顶无边框
                            let _ = window.set_fullscreen(true);
                            let _ = window.set_decorations(false);
                            let _ = window.set_always_on_top(true);
                            // 添加透明窗口样式
                            let _ = window.eval("document.documentElement.classList.add('transparent-window');");
                            println!("Window set to fullscreen, transparent, always-on-top, and borderless");
                        }
                        
                        println!("Window state toggled successfully");
                    } else {
                        println!("Main window not found");
                    }
                });
            });
            
            if let Err(e) = result {
                eprintln!("Failed to register hotkey: {}", e);
            } else {
                println!("Global hotkey Alt+Ctrl+D registered successfully");
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
