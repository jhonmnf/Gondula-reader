# Gôndula Reader

Aplicação web para conferir etiquetas de gôndola por câmera ou busca manual.

## Histórico de conferências

Use **Ver conferências realizadas** na tela principal ou acesse `conferencias.html` após fazer login. O histórico consulta os registros sincronizados no Supabase, com filtro por resultado e páginas de 20 registros, ordenados pela data mais recente. Registros offline aparecem quando forem enviados ao servidor.

A consulta usa as tabelas existentes `conferences` e `products`, sem exigir alterações no banco. O nome exibido é o cadastro atual do produto; preço e nome históricos não são armazenados na conferência atual.

O filtro de período oferece todas as datas, hoje, ontem, últimos 7 dias e últimos 30 dias. As datas seguem o fuso `America/Sao_Paulo` (horário de Brasília), inclusive na exibição dos registros. Os últimos 7 e 30 dias incluem hoje e usam dias de calendário, não uma janela de horas. Período e resultado podem ser combinados; alterar qualquer filtro retorna à primeira página. A filtragem acontece no Supabase antes da contagem e da paginação.

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
