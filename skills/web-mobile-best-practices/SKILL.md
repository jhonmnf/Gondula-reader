---
name: web-mobile-best-practices
description: Guia de melhores práticas para desenvolvimento de sites e web apps mobile, focando em performance, acessibilidade, responsividade e UX moderna.
---

# Melhores Práticas Web & Mobile

Esta skill fornece diretrizes para garantir que sites e web apps mobile sejam performáticos, acessíveis e ofereçam a melhor experiência de usuário (UX).

## Escopo de Atuação

- Revisão de interfaces (UI) e fluxos de usuário (UX).
- Otimização de performance (Web Vitals).
- Implementação de acessibilidade (WCAG).
- Estratégias de responsividade e Mobile-First.

## Diretrizes Principais

### 1. Performance & Core Web Vitals
- **LCP (Largest Contentful Paint):** Otimize imagens (WebP, AVIF), utilize carregamento crítico de CSS e evite render-blocking resources.
- **FID (First Input Delay):** Minimize o JavaScript principal, utilize code-splitting e evite tarefas longas na main thread.
- **CLS (Cumulative Layout Shift):** Defina dimensões explícitas para imagens e vídeos; evite inserções de conteúdo dinâmico acima do fold.

### 2. Responsividade & Mobile-First
- **Abordagem Mobile-First:** Projete primeiro para a menor tela e expanda a complexidade para telas maiores.
- **Touch Targets:** Garanta que elementos clicáveis tenham no mínimo 44x44px para facilitar a interação tátil.
- **Fluid Layouts:** Use unidades relativas (`rem`, `em`, `%`, `vw`, `vh`) em vez de pixels fixos.

### 3. Acessibilidade (a11y)
- **Semântica HTML:** Use tags semânticas (`<main>`, `<nav>`, `<section>`, `<footer>`) para facilitar a navegação por leitores de tela.
- **Contraste de Cores:** Garanta que o contraste entre texto e fundo siga as normas WCAG AA (mínimo 4.5:1).
- **Atributos ARIA:** Utilize `aria-label`, `aria-expanded` e `role` apenas quando o HTML semântico não for suficiente.

### 4. Experiência do Usuário (UX) Mobile
- **Navegação Intuitiva:** Implemente menus acessíveis com o polegar (bottom navigation para mobile).
- **Feedback Visual:** Forneça respostas imediatas para interações (estados de hover, active, loading skeletons).
- **Redução de Fricção:** Simplifique formulários, utilize inputs específicos (`type="email"`, `type="tel"`) e evite pop-ups intrusivos.

## Fluxo de Validação

1. **Análise de Estrutura:** Verifique se o HTML é semântico e acessível.
2. **Check de Responsividade:** Valide o layout em múltiplos viewports (320px a 1920px).
3. **Auditoria de Performance:** Utilize Lighthouse ou PageSpeed Insights para validar Web Vitals.
4. **Teste de Usabilidade:** Avalie a facilidade de navegação e a clareza dos fluxos.
