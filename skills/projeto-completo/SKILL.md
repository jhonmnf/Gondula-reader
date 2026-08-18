# Skill: Gôndula Reader Completo
Este guia define o caminho para transformar o Gôndula Reader de um protótipo de conferência em uma ferramenta profissional de auditoria de varejo, baseando-se em padrões de projetos como [torba-retail](https://github.com/torba-lab/torba-retail), [AuditM-Field](https://github.com/nigdanil/AuditM-Field) e [ScanRecord](https://github.com/Malachi216/barcodeScanner).

## 🎯 Objetivos de Implementação

### 1. Gestão de Dados e Relatórios (Exportação)
Atualmente, os dados ficam presos no `localStorage`. Para tornar o app produtivo:
- **Exportação CSV/Excel**: Implementar a conversão da lista de `conferencias` para formato `.csv` para que o gestor possa abrir no Excel.
- **Sincronização em Lote**: Em vez de salvar um por um, criar uma fila de "pendentes" que podem ser enviados ao servidor de uma vez ao final da auditoria.

### 2. Enriquecimento da Auditoria (Provas e Contexto)
Um erro de preço precisa de evidências:
- **Foto de Evidência**: Integrar a câmera para tirar uma foto da etiqueta divergente e salvar o caminho/base64 junto ao registro.
- **Tag de Localização**: Adicionar campos para "Loja", "Corredor" e "Prateleira" no início da sessão de conferência.
- **Validação de Planograma**: Permitir que o usuário marque se o produto está na posição correta da gôndula.

### 3. Experiência do Operador (UX/UI)
Tornar o processo mais rápido e menos cansativo:
- **Dashboard de Progresso**: Exibir no topo da tela: `Total Verificado | % Corretos | % Divergentes`.
- **Sons de Feedback**: Adicionar bipes curtos (sucesso/erro) ao escanear, para que o operador não precise olhar para a tela a cada produto.
- **Modo Noturno/Claro Adaptativo**: Sincronizar o tema com a preferência do sistema.

### 4. Robustez Técnica (PWA & Offline)
Garantir que o app funcione em corredores sem sinal de Wi-Fi:
- **Offline First**: Usar `IndexedDB` em vez de `localStorage` para armazenar volumes maiores de dados e fotos.
- **Sincronização em Background**: Usar a `Background Sync API` para enviar os dados automaticamente assim que a conexão for restaurada.

## 🛠️ Roadmap de Implementação Sugerido

1. **Fase 1 (Essencial)**: Exportação de CSV + Histórico de Conferências.
2. **Fase 2 (Qualidade)**: Captura de Fotos + Identificação de Corredor/Loja.
3. **Fase 3 (Performance)**: Dashboard de métricas em tempo real + Feedback Sonoro.
4. **Fase 4 (Infra)**: Migração para IndexedDB + Sincronização Offline Robusta.

## 🔍 Referências Técnicas
- **Sincronização**: Padrões de PWA (Progressive Web Apps).
- **Exportação**: Biblioteca `xlsx` ou implementação manual de CSV.
- **Câmera**: `MediaDevices API` para captura de fotos.
