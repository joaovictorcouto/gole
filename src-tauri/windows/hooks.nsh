# Script NSIS customizado para o Gole.
# Este arquivo injeta código na compilação do instalador do Windows.

!macro NSIS_HOOK_POSTINSTALL
  # Cria a entrada no registro do Windows para inicialização automática (autostart) com o parâmetro --hidden (inicia oculto na bandeja)
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Gole" '"$INSTDIR\Gole.exe" --hidden'
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  # Remove a entrada do registro quando o aplicativo for desinstalado
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Gole"
!macroend
