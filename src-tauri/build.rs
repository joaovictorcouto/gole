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

    tauri_build::build()
}
