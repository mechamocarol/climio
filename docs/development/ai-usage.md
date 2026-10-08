# Uso de IA no desenvolvimento

O Climio foi desenvolvido com uso intenso de IA, principalmente por meio do Cursor, como parte do meu processo de engenharia.

A IA foi utilizada para acelerar discovery, refinamento de produto, implementação, testes, revisão e documentação. As decisões de produto, arquitetura, regras de negócio, trade-offs e validação final permaneceram sob minha responsabilidade.

O princípio que guiou o processo foi:

```text
Definir o escopo
      ↓
Tomar a decisão
      ↓
Dar contexto e restrições para a IA
      ↓
Investigar / implementar
      ↓
Revisar criticamente
      ↓
Testar
      ↓
Validar fluxo e usabilidade
      ↓
Questionar edge cases
      ↓
Refinar
      ↓
Consolidar a decisão
```

A IA foi tratada como uma ferramenta de engenharia, e não como a fonte de verdade do projeto.

---

## Minhas decisões

Antes de delegar a implementação de uma parte para a IA, eu procurei definir o comportamento esperado e os limites daquela parte.

As principais decisões que permaneceram sob minha responsabilidade foram:

- resultado que o produto deveria entregar;
- fluxo principal do usuário;
- escopo do MVP;
- funcionalidades fora do MVP;
- arquitetura;
- separação de responsabilidades;
- contratos entre camadas;
- modelo de domínio;
- regras de recomendação;
- thresholds e condições de bloqueio;
- critérios para escolha da melhor janela;
- comportamento das alternativas;
- estratégia de estado;
- estratégia de integração com APIs;
- tratamento de timezone;
- critérios de teste;
- trade-offs técnicos;
- aceitação ou rejeição das implementações geradas.

A IA podia sugerir alternativas, mas a decisão final precisava ser coerente com o produto e com a arquitetura definida.

---

## Processo de desenvolvimento

O projeto foi desenvolvido de forma incremental. Dividi o trabalho em partes que podiam ser definidas, implementadas e validadas isoladamente.

A evolução seguiu aproximadamente esta ordem:

```text
Case requirements
      ↓
Product flow
      ↓
Domain model
      ↓
Business rules
      ↓
Architecture
      ↓
Infrastructure
      ↓
Plan / state
      ↓
UI flow
      ↓
Recommendation Engine integration
      ↓
Testing
      ↓
Audit
      ↓
Cleanup
      ↓
Documentation
```

Essa abordagem foi importante para evitar que decisões de implementação fossem tomadas antes das decisões de produto e domínio.

---

## Discovery

No início, usei IA para decompor o case do teste e explorar possibilidades.

O objetivo era entender:

- qual era o problema real proposto pelo case;
- qual deveria ser o fluxo mínimo;
- quais informações o usuário precisava fornecer;
- quais dados a API disponibilizava;
- quais decisões precisavam ser tomadas pelo produto;
- quais riscos e edge cases poderiam existir;
- o que deveria ficar fora do MVP.

Um dos principais resultados foi transformar a proposta de "mostrar previsão do tempo" em uma experiência de decisão.

O fluxo central passou a ser:

```text
Activity
    ↓
Location
    ↓
Date
    ↓
Forecast
    ↓
Analysis
    ↓
Best time
    ↓
Explanation
```

A pergunta que orientou a experiência foi:

> "When is the best time to do this?"

A IA foi usada para explorar alternativas e questionar decisões, mas o recorte final do produto foi definido antes da implementação.

---

## Refinamento de produto

A IA também foi usada como parceira de discussão para transformar o requisito aberto em um MVP mais concreto.

Foram refinados:

- atividades suportadas;
- seleção de atividade;
- busca de localização;
- seleção de data;
- recomendação principal;
- alternativas;
- loading;
- error state;
- empty state;
- Light/Dark Mode;
- fluxo de navegação;
- funcionalidades fora do MVP.

Também foi uma decisão consciente não tentar implementar tudo que poderia existir no produto.

Ficaram fora do MVP:

- entrada de atividade em linguagem natural;
- voz / microfone;
- login;
- histórico;
- favoritos;
- notificações;
- personalização avançada;
- atividades customizadas;
- critérios meteorológicos customizados.

A localização atual do dispositivo (**Usar minha localização**) entrou no MVP depois do recorte inicial, usando `expo-location` + timezone Open-Meteo e convergindo para o mesmo `Location` da busca manual.

A prioridade foi construir uma experiência verticalmente completa e confiável.

---

## Arquitetura

A arquitetura foi discutida antes e durante a implementação.

A estrutura escolhida foi baseada em features e separação de responsabilidades:

```text
Presentation
      ↓
Application
      ↓
Domain
      ↓
Infrastructure
```

As principais decisões foram:

### TanStack Query para server state

Utilizado para:

- location search;
- weather forecast;
- cache;
- loading;
- error state;
- lifecycle das requisições;
- prefetch do forecast no Summary (mesma query reutilizada pelo Result).

### Zustand para client state

Utilizado para manter o plano atual:

```text
Activity + Location + Date
```

O Plan não conhece API nem Recommendation Engine.

### Repository boundaries

As APIs externas ficam atrás de repositories.

```text
API
 ↓
DTO
 ↓
Zod
 ↓
Mapper
 ↓
Domain model
 ↓
Repository
 ↓
Application
```

Isso impede que o domínio e a UI dependam diretamente do formato da API externa.

### Recommendation Engine independente da UI

O Recommendation Engine foi mantido como domínio puro.

Ele não conhece:

- React;
- React Native;
- TanStack Query;
- Zustand;
- componentes;
- telas;
- API externa.

Essa separação foi uma decisão arquitetural importante para permitir testes determinísticos e facilitar a evolução do produto.

---

## Implementação

O Cursor foi utilizado principalmente para transformar decisões e contratos já definidos em implementação.

Entre as tarefas em que a IA foi utilizada:

- criação de arquivos;
- scaffolding;
- implementação de tipos;
- implementação de funções de domínio;
- DTOs;
- schemas Zod;
- mappers;
- repositories;
- hooks;
- Zustand store;
- componentes React Native;
- Bottom Sheets;
- tema;
- integração das telas;
- testes;
- refactors localizados;
- investigação de erros;
- documentação.

Eu procurava fornecer à IA contexto suficiente para que ela implementasse uma parte específica sem precisar decidir o produto inteiro.

Um exemplo desse padrão foi a implementação de Location:

```text
Contrato do domínio
      ↓
DTO
      ↓
Schema
      ↓
Mapper
      ↓
Repository
      ↓
Query Hook
      ↓
UI
```

A IA acelerou a implementação de cada etapa, enquanto os contratos e responsabilidades eram revisados antes de seguir para a próxima.

---

## Recommendation Engine

O Recommendation Engine foi a parte do projeto em que o processo de definição → implementação → validação ficou mais explícito.

As regras foram estruturadas antes da implementação e divididas em etapas:

```text
C3 → C4 → C5 → C6 → C7
```

### C3 — análise dos períodos

Responsável por:

- score dos fatores;
- classificação;
- blocking conditions;
- activity hours;
- status do período.

### C4 — candidate windows

Transforma períodos elegíveis em janelas candidatas.

### C5 — best window

Seleciona a melhor janela de acordo com critérios determinísticos.

### C6 — alternatives

Seleciona até três alternativas não sobrepostas.

### C7 — explanation

Agrega os fatores e constrói uma explicação estruturada para a recomendação escolhida.

A IA foi utilizada para implementar e testar essas etapas, mas as regras que determinam o comportamento foram definidas e revisadas fora da implementação.

---

## Caso de decisão: C5 e o fallback de 1 hora

Durante a implementação e revisão do C5, identifiquei uma divergência entre o comportamento implementado e a regra desejada.

Uma janela de 1 hora com status `ACCEPTABLE` estava podendo se tornar a recomendação principal.

A decisão foi tornar a regra explícita:

```text
Existe janela de 2h+
    ↓
usar janela de 2h+

Não existe janela de 2h+
    ↓
permitir somente fallback de 1h IDEAL

Existe somente 1h ACCEPTABLE
    ↓
não recomendar
```

A implementação foi alterada e os testes foram ampliados para proteger essa decisão.

---

## Caso de decisão: C6 e alternativas sobrepostas

Durante os testes no dispositivo, apareceu um problema relacionado às alternativas.

A geração de candidatos permitia que alternativas selecionadas se sobrepusessem. Isso também acabou aparecendo na UI como um problema de chaves duplicadas.

Em vez de corrigir apenas o warning no React, a origem do problema foi investigada no domínio.

A solução foi:

- ordenar os candidatos de forma determinística;
- excluir a janela principal;
- impedir sobreposição com a recomendação principal;
- impedir sobreposição entre alternativas selecionadas;
- limitar a três alternativas.

A regra de intervalo utilizada foi:

```text
10:00–12:00
12:00–14:00
```

não se sobrepõem.

Já:

```text
10:00–12:00
11:00–13:00
```

se sobrepõem.

Esse foi um exemplo de uso da IA para investigar e implementar uma solução, mas com a decisão arquitetural de corrigir o comportamento no domínio em vez de mascarar o problema na UI.

---

## Caso de decisão: timezone

Uma auditoria do projeto identificou um risco relacionado ao conceito de "hoje".

A data e hora do dispositivo podem ser diferentes da data e hora da localização selecionada.

Isso significa que uma recomendação para "hoje" poderia incluir períodos que já haviam passado na localização analisada.

A solução foi manter essa preocupação fora da UI:

```text
Device time
    ↓
Location timezone
    ↓
LocalWallClockTime
    ↓
Recommendation Engine
```

A aplicação resolve o horário atual utilizando o timezone da localização e passa esse valor explicitamente para o domínio.

O Recommendation Engine continua puro porque não acessa o relógio do sistema diretamente.

Esse foi um exemplo importante de uma auditoria que levou a uma mudança arquitetural real.

No caminho GPS, o timezone também é resolvido via Open-Meteo (`timezone=auto`) para as coordenadas do dispositivo, mantendo o alinhamento com o forecast. A busca manual continua recebendo o timezone do Geocoding.

---

## Caso de decisão: GPS e percepção de performance

A localização atual do dispositivo foi adicionada ao MVP sem criar um segundo contrato de domínio: GPS e busca manual convergem para o mesmo `Location`.

O fluxo GPS:

```text
GPS → reverse geocode ∥ timezone Open-Meteo → Location → Plan → Forecast → Recommendation
```

Durante validação em dispositivo, o sheet de GPS e a entrada no Result pareciam lentos. O diagnóstico mostrou duas causas distintas:

1. reverse geocode e timezone rodavam em sequência após o GPS;
2. o forecast só começava ao montar o Result.

As correções foram pequenas e reversíveis:

- paralelizar reverse geocode e timezone com `Promise.allSettled`;
- prefetch do forecast no Summary com a mesma `useHourlyForecast` / query key do Result.

O Recommendation Engine não foi alterado.

---

## UX e validação em dispositivo

Usei IA para acelerar a tradução da referência visual para React Native e para revisar inconsistências de UI.

Entre os pontos trabalhados:

- hierarquia visual;
- espaçamento;
- cards;
- cores;
- Bottom Sheets;
- estados de loading/error/empty;
- Light/Dark Mode;
- ícones;
- componentes reutilizáveis.

A validação não ficou apenas no código.

O aplicativo foi executado em dispositivo físico durante o desenvolvimento.

Quando uma implementação estava tecnicamente correta, mas não apresentava a experiência desejada, ela era revisada.

Um exemplo foi o `ClimioIcon`, criado como um componente próprio baseado em `react-native-svg`, mantendo uma linguagem visual consistente com o produto.

---

## Testes

A IA foi utilizada para criar e expandir testes, principalmente testes unitários do domínio e das integrações.

Os testes foram usados como uma forma de tornar as regras executáveis e detectar inconsistências entre intenção e implementação.

Entre os cenários cobertos:

- factor scoring;
- blocking conditions;
- activity hours;
- candidate windows;
- best window;
- daylight preference;
- tie-breakers;
- alternatives;
- overlapping windows;
- one-hour fallback;
- timezone;
- períodos passados;
- datas futuras;
- explanation;
- determinismo.

Resultado final:

- **40 test suites**
- **406 testes passando**

Quando um teste falhava, o processo não era simplesmente alterar o código até o teste passar.

Primeiro era necessário entender qual deveria ser o comportamento correto.

---

## Code review e auditorias

Além de gerar código, usei a IA como uma segunda camada de revisão.

Em momentos importantes, pedi auditorias read-only do projeto para procurar:

- inconsistências arquiteturais;
- documentação desatualizada;
- código legado;
- rotas sem uso;
- problemas de lint;
- problemas de typecheck;
- riscos de API;
- problemas de timezone;
- gaps de testes;
- complexidade desnecessária.

Essas auditorias resultaram em mudanças reais, incluindo:

- remoção do código de template inicial do Expo que não era mais utilizado;
- remoção de rotas legadas;
- correção do Location Bottom Sheet;
- correção do empty state;
- limpeza de scaffolding vazio;
- correção de lint;
- tratamento de timezone;
- revisão do fallback do C5;
- implementação de “Usar minha localização”;
- paralelismo GPS e prefetch de forecast no Summary;
- atualização da documentação.

A IA foi útil nesse momento principalmente como uma ferramenta para perguntar:

> "O que eu posso não estar enxergando?"

---

## Documentação

A IA também foi utilizada para organizar e revisar a documentação do projeto.

Os principais documentos são:

- `README.md`;
- `docs/development/architecture.md`;
- `docs/product/mvp/business-rules.md`;
- `docs/product/mvp/refinement.md`.

A documentação de business rules teve um papel especialmente importante.

Ela serviu como referência para:

```text
Produto
   ↕
Domínio
   ↕
Implementação
   ↕
Testes
```

Isso ajudou a manter as regras de recomendação consistentes entre o que foi decidido, implementado e testado.

---

## Como eu validei o trabalho da IA

Uma implementação gerada pela IA não era considerada concluída apenas porque compilava.

A validação normalmente passava por algumas etapas:

```text
Código gerado
    ↓
Review do diff
    ↓
Typecheck
    ↓
Lint
    ↓
Testes
    ↓
Edge cases
    ↓
Device testing
    ↓
Review arquitetural
```

Dependendo da natureza da mudança, nem todas as etapas tinham o mesmo peso.

Uma alteração de domínio, por exemplo, exigia mais atenção a contratos, testes e determinismo.

Uma alteração visual exigia mais atenção ao dispositivo e à referência visual.

---

## Princípios que guiaram o uso de IA

Durante o projeto, alguns princípios foram mantidos:

1. **IA pode propor, mas não decide.**
2. **Business rules devem ser explícitas.**
3. **Contratos devem existir antes da implementação quando a fronteira é importante.**
4. **Código gerado precisa ser revisado.**
5. **Testes devem proteger decisões importantes.**
6. **Problemas de domínio devem ser corrigidos no domínio, não mascarados na UI.**
7. **Validação em dispositivo faz parte do desenvolvimento de React Native.**
8. **Auditorias devem procurar problemas além dos erros de compilação.**
9. **MVP exige priorização, não apenas capacidade de implementação.**
10. **A IA deve acelerar o processo sem substituir o raciocínio de engenharia.**

---

## Resultado

O uso de IA permitiu que eu explorasse, implementasse e revisasse uma quantidade de trabalho maior dentro do tempo disponível para o case.

Mais importante, o processo permitiu manter o foco nas decisões que considero mais relevantes para uma atuação sênior:

- entender o problema;
- transformar requisitos em produto;
- escolher uma arquitetura adequada;
- separar responsabilidades;
- modelar regras de negócio;
- antecipar edge cases;
- testar comportamento;
- validar no mundo real;
- identificar problemas;
- fazer trade-offs;
- e evoluir a solução sem perder coerência.

A IA acelerou a execução e ampliou minha capacidade de exploração e revisão.

As decisões, o raciocínio e a responsabilidade pelo resultado permaneceram comigo.
