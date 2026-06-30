use std::path::PathBuf;

fn main() {
    // Read a local-only dev password hash (gitignored). When the file is
    // missing the constant is empty and the dev module is unreachable in
    // every public build.
    let hash_path = PathBuf::from("../.gole-dev-password-hash");
    let hash = std::fs::read_to_string(&hash_path)
        .ok()
        .map(|s| s.trim().to_string())
        .unwrap_or_default();
    println!("cargo:rerun-if-changed=../.gole-dev-password-hash");
    println!("cargo:rustc-env=GOLE_DEV_PWD_HASH={}", hash);

    // Configuração de Recursos para Windows
    #[cfg(target_os = "windows")]
    {
        let mut windows = tauri_build::WindowsAttributes::new();
        // Define o idioma do recurso compilado (.rc) para Português (Brasil)
        windows = windows.append_rc_content("LANGUAGE 0x16, 0x01");

        tauri_build::try_build(
            tauri_build::Attributes::new().windows_attributes(windows)
        ).expect("failed to run tauri-build");
    }

    // Configuração para outros sistemas operacionais
    #[cfg(not(target_os = "windows"))]
    tauri_build::build()
}
