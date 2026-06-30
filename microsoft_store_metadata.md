# 💧 Dados de Publicação na Microsoft Store — GOLE

Este documento reúne todas as informações sobre o **GOLE** necessárias para preencher o cadastro no Partner Center (Microsoft Store) e para configurar o empacotamento no formato **MSIX**.

---

## 📋 1. Informações da Ficha da Loja (Store Listing)

### 🏷️ Nome do Aplicativo
*   **Nome:** `Gole` (ou `Gole — Rastreador de Hidratação` / `GOLE`)

### 📂 Categoria e Subcategoria
*   **Categoria Principal:** `Saúde e boa forma` (Health & fitness)
*   **Subcategoria:** `Estilo de vida` (Lifestyle) ou `Nutrição` (Nutrition)

### 💬 Idioma Oficial
*   **Idioma:** `Português (Brasil) - pt-BR`

### ✍️ Descrição do Aplicativo (Ficha da Loja)
*   **Descrição Curta (Resumo):**  
    Um rastreador de hidratação moderno, minimalista e 100% focado em privacidade. Calcule sua meta ideal e monitore seu consumo de água diretamente do seu desktop.
*   **Descrição Longa:**  
    O GOLE é um rastreador de hidratação desktop desenvolvido para ajudar você a manter hábitos saudáveis de hidratação diária de forma simples e eficiente. Funcionando 100% offline, o app protege totalmente sua privacidade salvando todos os dados localmente.

    **Principais Recursos:**
    * **Cálculo Personalizado:** A sua meta de hidratação é gerada sob medida usando peso, nível de atividade física e clima.
    * **Notificação Customizada Estilizada:** Uma janela exclusiva e minimalista (sem bordas/frameless) aparece no canto da tela para lembrar você de beber água com opções rápidas.
    * **Sons de Alerta Customizáveis:** Escolha entre 5 sons suaves gerados dinamicamente para lembretes confortáveis.
    * **Recipiente Dinâmico:** Configure copos, garrafas ou garrafões favoritos para acompanhar visualmente quanto falta para atingir a meta do dia.
    * **Conquistas e Gamificação:** Desbloqueie até 20 conquistas exclusivas e acompanhe seus streaks (dias consecutivos).
    * **Estatísticas Detalhadas:** Visualize seus dados de consumo através de gráficos interativos com suporte a períodos de 7, 30 e 90 dias ou intervalos personalizados.
    * **Modo Silencioso:** Fechar o aplicativo apenas o oculta na bandeja do sistema (System Tray), onde você ainda pode registrar água rapidamente.

### 🌟 Funcionalidades (Features)
*   Cálculo automático e inteligente de meta diária de água.
*   Lembretes flutuantes customizados e sons personalizados para notificações.
*   Gráficos estatísticos e histórico interativo de consumo.
*   Sistema de gamificação com 20 conquistas colecionáveis.
*   100% offline com banco de dados local SQLite.
*   Menu rápido na bandeja do sistema (System Tray).

### 🖥️ Requisitos do Sistema
*   **Sistema Operacional:** `Windows 10 versão 17763.0 ou superior` (x64)
*   **Arquitetura recomendada:** `x64`
*   **Teclado e Mouse:** Requeridos.
*   **Conexão de Internet:** Não requerida (funciona offline).

---

## 📦 2. Dados de Configuração do Instalador MSIX

Abaixo estão os dados reais do aplicativo na ordem exata solicitada pela tela de criação de novo pacote:

*   **Package name:** `CoutoApps.Gole`
*   **Package display name:** `Gole`
*   **Publisher name:** `CN=4A6B1E51-6F58-4705-9CE5-BA9C66ADDD83`
*   **Publisher display name:** `CoutoApps`
*   **Version:** `1` . `0` . `3` . `0`
*   **Package Description:** `Um rastreador de hidratação moderno, minimalista e 100% focado em privacidade.`

*(Nota: O executável de entrada interno do pacote é o `gole.exe`)*

---

## 🎨 3. Recursos de Arte da Loja (Assets)

Use as imagens localizadas na pasta do projeto para preencher os materiais visuais na loja:

1.  **Logotipo da Loja (1:1 / 300x300):** Utilize o arquivo [StoreLogo_300x300.png](file:///c:/Users/Jo%C3%A3o%20Victor/Documents/Code/gole/src-tauri/icons/StoreLogo_300x300.png).
2.  **Logotipo Grande (1080x1080):** Utilize a imagem de alta definição gerada: [app-icon-1080.png](file:///c:/Users/Jo%C3%A3o%20Victor/Documents/Code/gole/src/assets/app-icon-1080.png).
3.  **Ícones Quadrados do Pacote:**
    *   30x30: [Square30x30Logo.png](file:///c:/Users/Jo%C3%A3o%20Victor/Documents/Code/gole/src-tauri/icons/Square30x30Logo.png)
    *   44x44: [Square44x44Logo.png](file:///c:/Users/Jo%C3%A3o%20Victor/Documents/Code/gole/src-tauri/icons/Square44x44Logo.png)
    *   150x150: [Square150x150Logo.png](file:///c:/Users/Jo%C3%A3o%20Victor/Documents/Code/gole/src-tauri/icons/Square150x150Logo.png)

---

## 📝 4. Informações Adicionais (Ficha da Loja)

Abaixo estão os dados sugeridos para a seção **Informações adicionais** da Microsoft Store:

### 🔍 Palavras-chave (Keywords)
*(Pressione Enter após inserir cada uma delas. Máximo de 7 palavras-chave)*
1. `Gole`
2. `Água`
3. `Hidratação`
4. `Rastreador de água`
5. `Beba água`
6. `Saúde`
7. `Lembrete`

### 🛡️ Informações de copyright e marca registrada
*   `© 2026 CoutoApps. Todos os direitos reservados.`

### 📄 Termos adicionais de licença
*   *Pode ser deixado em branco para adotar os termos padrão da Microsoft Store, ou preencher com:*  
    `Este aplicativo é distribuído sob a Licença de Aplicativo Padrão da Microsoft Store.`

### 👤 Desenvolvido por
*   `CoutoApps`

---

## 📦 5. Empacotamento Automatizado via Linha de Comando (MSIX)

Para não precisar recriar o instalador do zero na ferramenta visual a cada atualização, configure esta estrutura de pastas uma única vez:

### Estrutura da pasta de empacotamento:
```text
GoleMSIX/
├── Assets/ (Copiar ícones do projeto de src-tauri/icons)
│   ├── Square44x44Logo.png
│   ├── Square150x150Logo.png
│   └── StoreLogo.png
├── gole.exe (Copiar novo executável de src-tauri/target/release)
└── AppxManifest.xml
```

### Arquivo `AppxManifest.xml` recomendado (Idioma padrão configurado como `pt-BR` e `PublisherDisplayName` como `CoutoApps`):
```xml
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  xmlns:desktop="http://schemas.microsoft.com/appx/manifest/desktop/windows10"
  IgnorableNamespaces="uap rescap desktop">

  <Identity
    Name="CoutoApps.Gole"
    Publisher="CN=4A6B1E51-6F58-4705-9CE5-BA9C66ADDD83"
    Version="1.0.3.0" 
    ProcessorArchitecture="x64" />

  <Properties>
    <DisplayName>Gole</DisplayName>
    <PublisherDisplayName>CoutoApps</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>

  <Resources>
    <Resource Language="pt-BR" />
  </Resources>

  <Dependencies>
    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.17763.0" MaxVersionTested="10.0.22000.0" />
  </Dependencies>

  <Applications>
    <Application Id="CoutoApps.Gole" Executable="gole.exe" EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements
        DisplayName="Gole"
        Description="Um rastreador de hidratação moderno, minimalista e 100% focado em privacidade."
        BackgroundColor="#0A4A7A"
        Square150x150Logo="Assets\Square150x150Logo.png"
        Square44x44Logo="Assets\Square44x44Logo.png">
        <uap:DefaultTile Wide310x150Logo="Assets\Square150x150Logo.png" />
        <uap:SplashScreen Image="Assets\StoreLogo.png" />
      </uap:VisualElements>
      <Extensions>
        <desktop:Extension Category="windows.startupTask" Executable="gole.exe" EntryPoint="Windows.FullTrustApplication">
          <desktop:StartupTask TaskId="CoutoApps.Gole" Enabled="true" DisplayName="Gole" />
        </desktop:Extension>
      </Extensions>
    </Application>
  </Applications>

  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
</Package>
```

### Comandos de Empacotamento e Assinatura (PowerShell):
```powershell
# 1. Empacotar a pasta em um arquivo .msix
makeappx pack /d "C:\Caminho\Para\GoleMSIX" /p "C:\Caminho\Para\CoutoApps.Gole_1.0.3.0_X64.msix"

# 2. Assinar o pacote com o seu certificado digital da loja
signtool sign /fd SHA256 /a /f "C:\Caminho\Para\seu_certificado.pfx" /p "sua_senha" "C:\Caminho\Para\CoutoApps.Gole_1.0.3.0_X64.msix"
```
