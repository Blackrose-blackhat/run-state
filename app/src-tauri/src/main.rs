use std::io::BufRead;
use std::process::{Child, Command};
use std::sync::Mutex;

use tauri::{Manager, State};

struct EngineState {
    child: Mutex<Option<Child>>,
    port: Mutex<Option<u16>>,
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
                .resolve("bin/runstate-engine", tauri::path::BaseDirectory::Resource)
                .expect("engine binary not found");

            let mut child = Command::new(engine_path)
                .stdout(std::process::Stdio::piped())
                .spawn()
                .expect("failed to start engine");

            let stdout = child.stdout.take().unwrap();
            let reader = std::io::BufReader::new(stdout);

            let state = app.state::<EngineState>();

            for line in reader.lines().flatten() {
                if line.starts_with("PORT=") {
                    let port: u16 = line[5..].parse().unwrap();
                    *state.port.lock().unwrap() = Some(port);
                    break;
                }
            }

            *state.child.lock().unwrap() = Some(child);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_engine_port])
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

        .run(tauri::generate_context!())
        .expect("error running tauri app");
}

#[tauri::command]
fn get_engine_port(state: State<EngineState>) -> Option<u16> {
    *state.port.lock().unwrap()
}
