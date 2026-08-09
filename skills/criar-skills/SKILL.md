---
name: criar-skills
description: Crie ou atualize skills locais deste projeto, com estrutura enxuta, metadados para a interface e validação. Use quando for solicitado criar uma nova skill, padronizar uma skill existente ou transformar um processo recorrente do projeto em uma skill reutilizável.
---

# Criar Skills

Crie skills versionadas em `skills/<nome-da-skill>` para capturar processos que se repetem ou exigem instruções específicas do projeto.

## Descobrir o escopo

1. Identifique o resultado esperado, exemplos de pedidos que devem ativar a skill e os limites do que ela não deve fazer.
2. Leia `AGENTS.md` e as skills existentes em `skills/` antes de escolher nome e fluxo.
3. Peça esclarecimento apenas quando o objetivo, o local de criação ou o impacto da skill não puderem ser inferidos com segurança.
4. Use nome em `kebab-case`, curto, orientado à ação e com até 63 caracteres. Faça o nome da pasta ser idêntico ao campo `name`.

## Definir a estrutura

- Crie somente `SKILL.md` e `agents/openai.yaml` quando instruções forem suficientes.
- Adicione `scripts/` para automações repetitivas ou sensíveis a erro; execute cada script incluído.
- Adicione `references/` para conhecimento específico, extenso ou que só seja necessário em alguns casos. Referencie-o diretamente no `SKILL.md`.
- Adicione `assets/` apenas para modelos ou arquivos que serão reutilizados na entrega.
- Não crie README, guia de instalação, changelog ou arquivos de exemplo sem uso direto pela skill.

## Implementar

1. Inicialize a pasta com `init_skill.py` da skill `skill-creator`, quando ela estiver disponível. Caso contrário, crie manualmente a estrutura mínima.
2. Escreva o frontmatter com somente `name` e `description`. Na descrição, inclua a capacidade e os gatilhos de uso concretos.
3. Mantenha o corpo do `SKILL.md` conciso, em português e no imperativo. Documente o fluxo, as decisões relevantes, a validação e o uso de recursos incluídos.
4. Crie `agents/openai.yaml` com `display_name`, `short_description` (25–64 caracteres) e `default_prompt`. O prompt deve mencionar `$<nome-da-skill>`.
5. Preserve as convenções do projeto e evite dependências novas, serviços externos, segredos e instruções que conflitem com `AGENTS.md`.

## Validar e entregar

1. Execute `quick_validate.py <pasta-da-skill>` da skill `skill-creator`, quando disponível, e corrija todas as falhas.
2. Faça uma checagem de uso: confirme que a descrição ativa a skill para exemplos reais e que o fluxo permite concluir a tarefa sem contexto oculto.
3. Ao entregar, informe o caminho, os arquivos criados ou alterados, como a skill deve ser acionada e a validação executada.

## Estrutura mínima

```text
skills/
└── nome-da-skill/
    ├── SKILL.md
    └── agents/
        └── openai.yaml
```
