use sha2::{Digest, Sha256};

/// Salt baked into the binary. Combined with the user-typed password
/// it produces a SHA256 hash compared against `DEV_PASSWORD_HASH` baked
/// at build time from `.gole-dev-password-hash`. Both salt and hash
/// give nothing useful by themselves; only knowing the password unlocks.
const DEV_SALT: &str = "gole.coutoapps.dev-gate.v2.b14fa7e2c9d6";

/// Baked at build time. Empty in any public build (no `.gole-dev-password-hash`
/// in the source tree at compile time).
const DEV_PASSWORD_HASH: &str = env!("GOLE_DEV_PWD_HASH");

fn ct_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() { return false; }
    let mut diff: u8 = 0;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(DEV_SALT.as_bytes());
    hasher.update(b"|");
    hasher.update(password.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Verifies the supplied password against the baked hash. Returns false
/// if the build has no baked hash (public release) regardless of input.
#[tauri::command]
pub fn verify_dev_password(password: String) -> bool {
    if DEV_PASSWORD_HASH.is_empty() {
        return false;
    }
    let computed = hash_password(&password);
    ct_eq(computed.as_bytes(), DEV_PASSWORD_HASH.as_bytes())
}

/// Returns the SHA256 of (salt|password) so the developer can bake it
/// once into `.gole-dev-password-hash`. Useful during setup only.
#[tauri::command]
pub fn compute_dev_password_hash(password: String) -> String {
    hash_password(&password)
}

/// Whether this build has any baked password at all. Used by the UI
/// to decide if the secret unlock affordance should even be reachable.
#[tauri::command]
pub fn dev_gate_available() -> bool {
    !DEV_PASSWORD_HASH.is_empty()
}
