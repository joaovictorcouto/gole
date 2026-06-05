import fs from 'fs';
import path from 'path';

// Pega a versão informada no argumento da linha de comando
const version = process.argv[2];

if (!version) {
  console.error('Erro: Por favor, informe a versão. Exemplo: node scripts/set-version.mjs 1.0.1');
  process.exit(1);
}

// Valida o formato da versão (ex: 1.0.0 ou 1.0.0-beta.1)
const versionRegex = /^\d+\.\d+\.\d+(-\w+(\.\d+)?)?$/;
if (!versionRegex.test(version)) {
  console.error(`Erro: Formato de versão inválido "${version}". Deve seguir o padrão semver (ex: 1.0.1).`);
  process.exit(1);
}

const rootDir = process.cwd();

// 1. Atualizar package.json
const packageJsonPath = path.join(rootDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    pkg.version = version;
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✓ package.json atualizado para a versão ${version}`);
  } catch (err) {
    console.error(`Erro ao atualizar package.json: ${err.message}`);
  }
} else {
  console.error('Aviso: package.json não encontrado.');
}

// 2. Atualizar tauri.conf.json
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  try {
    const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
    tauriConf.version = version;
    fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
    console.log(`✓ tauri.conf.json atualizado para a versão ${version}`);
  } catch (err) {
    console.error(`Erro ao atualizar tauri.conf.json: ${err.message}`);
  }
} else {
  console.error('Aviso: tauri.conf.json não encontrado.');
}

// 3. Atualizar Cargo.toml
const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
if (fs.existsSync(cargoTomlPath)) {
  try {
    let cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
    
    // Expressão regular para substituir version = "..." apenas na seção [package]
    // A seção [package] geralmente está no início do Cargo.toml
    const newCargoContent = cargoContent.replace(
      /(\[package\][\s\S]*?^version\s*=\s*")([^"]+)(")/m,
      `$1${version}$3`
    );
    
    fs.writeFileSync(cargoTomlPath, newCargoContent);
    console.log(`✓ src-tauri/Cargo.toml atualizado para a versão ${version}`);
  } catch (err) {
    console.error(`Erro ao atualizar Cargo.toml: ${err.message}`);
  }
} else {
  console.error('Aviso: Cargo.toml não encontrado.');
}

console.log(`\nSucesso! Versão atualizada para ${version} em todos os arquivos de configuração.`);
