//! Tauri commands for the application
//!
//! This module contains all the Tauri commands that can be called from the frontend.
//! It includes:
//! - `greet`: Returns a greeting with timestamp
//! - `call_asktao_dll`: Calls the CQ.Asktao.dll library function
//! - `show_ok_dialog`: Shows an OK dialog when hotkey is pressed

// Standard library imports
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::time::{SystemTime, UNIX_EPOCH};

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
        .invoke_handler(tauri::generate_handler![greet, call_asktao_dll, show_ok_dialog])
        .setup(|app| {
            // 注册全局热键 Alt+Ctrl+D
            let app_handle = app.handle();
            
            // 监听热键事件 - on_shortcut 会自动注册热键
            let app_handle_clone = app_handle.clone();
            let result = app.global_shortcut().on_shortcut("Alt+Control+D", move |_app, _shortcut, _state| {
                // 当热键被按下时，直接显示对话框
                println!("Hotkey Alt+Ctrl+D triggered!");
                let app_handle_inner = app_handle_clone.clone();
                tauri::async_runtime::spawn(async move {
                    // 使用对话框插件显示消息
                    println!("Attempting to show dialog...");
                    app_handle_inner.dialog().message("OK - Alt+Ctrl+D 热键已触发！");
                    println!("Dialog message called successfully");
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
