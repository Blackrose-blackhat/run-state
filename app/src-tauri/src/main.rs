use std::io::BufRead;
use std::process::{Child, Command};
use std::sync::Mutex;

use tauri::{Manager, State};

struct EngineState {
    child: Mutex<Option<Child>>,
    port: Mutex<Option<u16>>,
}

#[tauri::command]
fn get_engine_port(state: State<EngineState>) -> Option<u16> {
    *state.port.lock().unwrap()
}

#[tauri::command]
async fn kill_process(state: State<'_, EngineState>, pid: u32) -> Result<(), String> {
    let port = {
        let guard = state.port.lock().unwrap();
        guard.ok_or("Engine port not found")?
    };

    let client = reqwest::Client::new();
    let res = client
        .post(format!("http://127.0.0.1:{}/kill", port))
        .json(&serde_json::json!({ "pid": pid }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(res
            .text()
            .await
            .unwrap_or_else(|_| "Unknown error".to_string()));
    }

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(EngineState {
            child: Mutex::new(None),
            port: Mutex::new(None),
        })
        .setup(|app| {
            let engine_path = app
                .path()
                .resolve("bin/portwatch-engine", tauri::path::BaseDirectory::Resource)
                .expect("engine binary not found");

            // Run the engine with elevated privileges using pkexec
            // This allows the engine to access socket info for all processes
            let mut child = Command::new("pkexec")
                .arg(&engine_path)
                .stdout(std::process::Stdio::piped())
                .spawn()
                .expect("failed to start engine (pkexec may have been cancelled)");

            let stdout = child.stdout.take().expect("Failed to take stdout");
            let handle = app.handle().clone();

            std::thread::spawn(move || {
                let reader = std::io::BufReader::new(stdout);

                for line in reader.lines().flatten() {
                    if line.starts_with("PORT=") {
                        if let Ok(port) = line[5..].parse::<u16>() {
                            let state = handle.state::<EngineState>();
                            *state.port.lock().unwrap() = Some(port);
                            break;
                        }
                    }
                }
            });

            let state = app.state::<EngineState>();
            *state.child.lock().unwrap() = Some(child);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_engine_port, kill_process])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let state = window.state::<EngineState>();

                let child = {
                    let mut guard = state.child.lock().unwrap();
                    guard.take()
                };

                if let Some(mut child) = child {
                    let _ = child.kill();
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error building tauri app")
        .run(|app_handle, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                if let Some(mut child) = app_handle
                    .state::<EngineState>()
                    .child
                    .lock()
                    .unwrap()
                    .take()
                {
                    let _ = child.kill();
                }
            }
        });
}
