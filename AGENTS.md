# Guia de colaboração

Este arquivo define como pessoas e agentes devem trabalhar neste projeto.

## Princípios

- Faça mudanças pequenas, objetivas e fáceis de revisar.
- Preserve decisões e alterações existentes que não tenham relação com a tarefa.
- Prefira soluções simples, legíveis e sustentáveis a atalhos complexos.
- Não presuma requisitos: quando uma decisão mudar escopo, comportamento ou dados do usuário, confirme antes.
- Mantenha a interface, os textos e a documentação em português do Brasil, salvo quando o contexto técnico exigir inglês.

## Antes de alterar

1. Leia os arquivos relevantes e identifique convenções já usadas no projeto.
2. Verifique o estado do Git e não sobrescreva alterações de outra pessoa.
3. Para tarefas maiores, descreva brevemente o plano e os impactos esperados.
4. Não adicione dependências, serviços externos ou mudanças de arquitetura sem necessidade clara.

## Implementação

- Mantenha funções, componentes e módulos coesos; evite duplicação.
- Dê nomes claros e mantenha estilos e padrões já adotados pelo repositório.
- Trate erros, estados vazios e casos de borda relevantes para a funcionalidade.
- Não inclua segredos, chaves, tokens ou dados pessoais no código, commits ou documentação.
- Atualize documentação e exemplos quando o comportamento público mudar.

## Qualidade e validação

- Execute os testes, lint, typecheck ou build disponíveis e compatíveis com a mudança.
- Quando não houver automação aplicável, faça uma verificação manual proporcional ao risco e informe o que foi validado.
- Inclua ou atualize testes quando corrigir bugs ou adicionar comportamento verificável.
- Não declare uma tarefa concluída com falhas conhecidas sem explicá-las claramente.

## Git e arquivos

- Não use comandos destrutivos, como `git reset --hard` ou remoções em massa, sem autorização explícita.
- Não reverta nem formate arquivos não relacionados à tarefa.
- Faça commits pequenos e semânticos, quando solicitado. Use mensagens curtas no imperativo, por exemplo: `Adiciona filtro de produtos`.
- Nunca versione arquivos de ambiente, credenciais, artefatos gerados ou dependências instaladas, a menos que o projeto já determine isso.

## Comunicação de entrega

Ao concluir uma tarefa, informe de forma breve:

- o que foi alterado;
- quais arquivos foram afetados;
- como foi validado;
- qualquer limitação, decisão pendente ou próximo passo relevante.

## Prioridade de instruções

Em caso de conflito, siga esta ordem:

1. Instruções explícitas do usuário para a tarefa atual;
2. Este arquivo;
3. Convenções e documentação específicas do repositório;
4. Boas práticas gerais.
