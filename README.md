# Gôndula Reader

Aplicação web para conferir etiquetas de gôndola por câmera ou busca manual.

## Histórico de conferências

Use **Ver conferências realizadas** na tela principal ou acesse `conferencias.html` após fazer login. O histórico consulta os registros sincronizados no Supabase, com filtro por resultado e páginas de 20 registros, ordenados pela data mais recente. Registros offline aparecem quando forem enviados ao servidor.

A consulta usa as tabelas existentes `conferences` e `products`, sem exigir alterações no banco. O nome exibido é o cadastro atual do produto; preço e nome históricos não são armazenados na conferência atual.

O filtro de período oferece todas as datas, hoje, ontem, últimos 7 dias e últimos 30 dias. As datas seguem o fuso `America/Sao_Paulo` (horário de Brasília), inclusive na exibição dos registros. Os últimos 7 e 30 dias incluem hoje e usam dias de calendário, não uma janela de horas. Período e resultado podem ser combinados; alterar qualquer filtro retorna à primeira página. A filtragem acontece no Supabase antes da contagem e da paginação.

## Foco da câmera

O leitor e `teste-camera.html` usam o mesmo controle de câmera. Ao abrir, o aplicativo solicita foco contínuo e tenta foco automático pontual quando necessário e disponível. O botão **Refocar** solicita um novo ajuste, preservando o zoom. A mensagem distingue o modo informado pela câmera de uma solicitação sem confirmação; isso não garante que a imagem esteja nítida.

O navegador seleciona a câmera traseira automaticamente. Quando não expõe controle de foco automático, o botão **Refocar** fica desabilitado e o motivo aparece na tela.

Para testar no Galaxy S22+ com Chrome, acesse `teste-camera.html` por HTTPS e experimente **Refocar**. Compare também com o aplicativo Câmera do celular, na mesma distância e iluminação, para distinguir limitações do navegador de dificuldade óptica. Após uma atualização publicada, feche as abas do aplicativo e abra novamente para ativar o novo cache.

## Leitura por fotografia

O botão **Fotografar código** oferece uma alternativa à leitura ao vivo. No celular, solicita captura de imagem pela câmera traseira com `accept="image/*"` e `capture="environment"`. A interface aberta depende do Android e do navegador; no computador, pode aparecer um seletor de arquivos.

Fotografe uma única etiqueta, com todas as barras nítidas, e confirme a foto. O app lê a imagem localmente com `BarcodeDetector` ou ZXing e consulta o produto pelo código encontrado. A foto não é enviada ao servidor nem armazenada pelo app. A câmera ao vivo é encerrada antes de abrir a captura. Cancelar permite tentar novamente; uma foto sem código mostra uma orientação para repetir ou usar a busca manual.

Fotos acima de 40 MB são recusadas; a imagem é reduzida a até 3072 pixels no maior lado para limitar o custo da leitura. O ZXing tenta as orientações horizontal e vertical. A confirmação de foco e captura nativa exige teste no aparelho físico.

Para testar no Galaxy S22+ com Chrome: atualize o app, feche e reabra, toque em **Fotografar código**, confira a nitidez na câmera, tire e confirme uma foto. Verifique se o produto correto aparece. Teste também cancelar, repetir uma captura e fotografar uma área sem código. **Abrir câmera** mantém a leitura ao vivo disponível. A versão anterior a esta alternativa é o commit `70294c3`; para voltar, reverta o commit que adiciona a fotografia e publique a reversão, preservando mudanças posteriores.

## Segurança e configuração

Configure estas variáveis de ambiente na Vercel antes de publicar:

- `SESSION_SECRET`: segredo aleatório com pelo menos 32 caracteres, usado para assinar a sessão administrativa.
- `ADMIN_USER` e `ADMIN_PASS`: credenciais do administrador.
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`: acesso exclusivo das funções de servidor ao Supabase.

Use o arquivo `.env.example` apenas como referência. Não crie ou envie credenciais ao repositório.

> A antiga `API_SECRET` não é mais usada pelo aplicativo. Caso ela tenha sido exposta em versões anteriores, faça a rotação dela e remova-a das variáveis da Vercel.

## Desenvolvimento

```bash
npm test
```

As rotas em `api/` exigem uma sessão administrativa assinada. A câmera utiliza o `BarcodeDetector` nativo quando disponível e ZXing como alternativa.
