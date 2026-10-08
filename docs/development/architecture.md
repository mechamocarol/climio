# Arquitetura

O Climio utiliza uma arquitetura feature-based, com separação clara entre apresentação, orquestração da aplicação, regras de domínio e integrações externas.

O objetivo é manter as regras de negócio independentes de React Native e das APIs externas, facilitar testes unitários e permitir que a interface evolua sem carregar responsabilidades que pertencem ao domínio ou à infraestrutura.

## Visão geral

```text
Presentation
      ↓
Application
      ↓
Domain
      ↓
Infrastructure
```

As camadas representam responsabilidades, não necessariamente diretórios físicos isolados. Cada feature organiza seus próprios arquivos de acordo com a responsabilidade exercida.

### Presentation

Responsável pela interface e pela interação com o usuário.

Inclui:

- telas e composição de telas;
- Bottom Sheets;
- componentes específicos de uma feature;
- estados visuais de loading, erro, vazio e sucesso;
- navegação entre as rotas do aplicativo;
- leitura do estado necessário para renderização.

A Presentation não deve:

- calcular regras meteorológicas;
- escolher a melhor janela;
- conter pesos, thresholds ou regras específicas de atividades;
- acessar APIs externas diretamente.

### Application

Responsável por conectar a interface aos casos de uso e ao estado da aplicação.

Inclui:

- hooks de feature;
- orquestração de chamadas entre Plan, repositories e domínio;
- providers;
- estado de seleção do usuário quando necessário.

Um exemplo é o fluxo de recomendação:

```text
Plan
  ↓
Forecast input
  ↓
Weather Query
  ↓
Activity Rules
  ↓
Recommendation Engine
  ↓
Recommendation Result
  ↓
Presentation
```

A Application coordena esse fluxo, mas não deve reproduzir as regras de negócio do domínio.

### Domain

Contém as regras e modelos que representam o comportamento do produto.

As funções de domínio devem ser determinísticas e independentes de React Native, TanStack Query e APIs externas sempre que possível.

No Climio, o principal exemplo é o **Recommendation Engine**, responsável por transformar dados meteorológicos normalizados e regras da atividade em uma recomendação.

O engine é organizado em etapas:

```text
C3 → C4 → C5 → C6 → C7
```

- **C3** — analisa períodos horários, calcula fatores, score, status e condições de bloqueio;
- **C4** — constrói janelas candidatas;
- **C5** — seleciona a melhor janela;
- **C6** — seleciona alternativas não sobrepostas;
- **C7** — agrega fatores e constrói a explicação estruturada.

O engine não conhece telas, componentes, APIs ou mecanismos de estado da aplicação.

Ele recebe entradas já resolvidas, como `activityId`, dados meteorológicos e regras da atividade. Resolução de linguagem natural, obtenção de dados externos e composição da interface acontecem fora do domínio.

### Infrastructure

Responsável pelas fronteiras externas da aplicação.

Inclui:

- cliente HTTP;
- integração com Open-Meteo;
- DTOs;
- schemas Zod para validação das respostas externas;
- mappers;
- repositories;
- configuração do TanStack Query.

O fluxo de uma integração externa é:

```text
External API
     ↓
DTO
     ↓
Zod validation
     ↓
Mapper
     ↓
Domain model
     ↓
Repository
     ↓
Application / Query hook
     ↓
Presentation
```

A infraestrutura não expõe o payload externo diretamente para a UI ou para o domínio.

---

## Arquitetura orientada a features

As features concentram o código relacionado a cada contexto do produto:

```text
src/
├── app/
├── features/
│   ├── activity/
│   ├── location/
│   ├── onboarding/
│   ├── plan/
│   ├── recommendation/
│   └── weather/
├── infrastructure/
│   └── api/
├── providers/
└── shared/
    ├── theme/
    └── ui/
```

### `features/activity`

Define as atividades suportadas pelo Climio e os identificadores utilizados pelas regras de recomendação.

### `features/location`

Responsável pela obtenção e representação das localizações selecionadas pelo usuário.

Há dois caminhos, ambos terminando no mesmo modelo de domínio `Location` e no mesmo `Plan.setLocation`:

```text
Busca manual
  → Open-Meteo Geocoding
  → Location

Usar minha localização
  → getCurrentDeviceLocation (expo-location)
  → reverseGeocodeAsync ∥ resolveOpenMeteoTimezone (timezone=auto)
  → Location
```

Detalhes do caminho GPS:

- permissão, fix GPS e reverse geocoding via `expo-location`;
- timezone IANA via Open-Meteo (`timezone=auto`) para alinhar ao forecast;
- após latitude/longitude, reverse geocode e timezone rodam em paralelo (`Promise.allSettled`);
- id sintético determinístico (`gps:latitude,longitude`);
- não existe tipo `CurrentLocation` separado;
- falhas de permissão, GPS, reverse geocode e timezone são tratadas na Presentation;
- o Recommendation Engine não foi alterado para suportar GPS — ele só recebe `Location`.

### `features/plan`

Representa a seleção atual do usuário:

```text
Activity + Location + Date
```

O estado do Plan é mantido com Zustand porque precisa sobreviver à navegação entre as etapas do fluxo.

O Plan não conhece APIs nem implementa regras de recomendação.

Também existem helpers para verificar se o plano possui os dados necessários para consultar o forecast e executar a recomendação.

### `features/weather`

Responsável pelo contrato de dados meteorológicos utilizado pelo aplicativo e pela integração correspondente.

A resposta do Open-Meteo é validada e transformada no modelo de domínio `HourlyWeather`.

### `features/recommendation`

Contém o Recommendation Engine e seus módulos de domínio relacionados.

O engine permanece independente da UI e da infraestrutura, permitindo que suas regras sejam testadas sem depender de React Native ou de chamadas de rede.

---

## Estado da aplicação

O projeto separa estado de servidor de estado do cliente.

### TanStack Query

É utilizado para server state, incluindo:

- busca de localizações;
- forecast horário;
- lifecycle das requisições;
- cache;
- loading e error states.

A tela Summary inicia a mesma query de forecast (`useHourlyForecast`) assim que o Plan tem latitude, longitude e date. O Result reutiliza esse cache — não há uma segunda implementação de forecast.

### Zustand

É utilizado para client state relacionado ao plano atual:

```ts
type PlanState = {
  activityId: ActivityId | null;
  location: Location | null;
  date: string;
};
```

O Zustand não substitui o TanStack Query e não armazena dados de servidor.

---

## Injeção de dependências

Os repositories são disponibilizados por meio de providers.

```text
RepositoriesProvider
       ↓
Feature hooks
       ↓
Repository
       ↓
API
```

Isso mantém os hooks e o restante da aplicação desacoplados de uma implementação específica de infraestrutura e facilita a substituição por mocks durante os testes.

O projeto utiliza uma abordagem simples de Dependency Injection por Context, em vez de introduzir um container genérico de DI para o MVP.

---

## Fluxo de recomendação

O fluxo completo conecta as diferentes camadas sem transferir regras de negócio para a interface:

```text
User selection
    ↓
Plan (Zustand)
    ↓
Application hook
    ↓
TanStack Query
    ↓
Weather Repository
    ↓
Open-Meteo
    ↓
HourlyWeather
    ↓
Activity Rules
    ↓
Recommendation Engine
    ↓
RecommendationResult
    ↓
Result Screen
```

A tela de resultado é responsável por apresentar o estado da operação.

Ela não calcula score, não escolhe horários e não interpreta diretamente os dados meteorológicos para decidir a recomendação.

---

## Tempo e timezone

A data selecionada pelo usuário é representada como uma data de calendário no formato `YYYY-MM-DD`.

Como o forecast do Open-Meteo utiliza o timezone da localização selecionada, o Climio preserva os timestamps horários como o horário local da própria localização.

`Location.timezone` é preenchido de acordo com a origem da localização:

- busca manual — timezone retornado pelo Open-Meteo Geocoding;
- GPS — timezone IANA resolvido via Open-Meteo `timezone=auto` para as coordenadas do dispositivo.

Para a data atual, a aplicação resolve o horário atual utilizando o `Location.timezone` e fornece esse valor ao Recommendation Engine.

Isso permite excluir períodos que já passaram na localização selecionada sem introduzir `Date.now()` ou acesso ao relógio diretamente no domínio.

O resultado é um domínio determinístico e testável:

```text
Application
    ↓
current time + location timezone
    ↓
LocalWallClockTime
    ↓
Recommendation Engine
```

---

## Rotas

O Expo Router utiliza `src/app` como camada de rotas.

A estrutura atual é:

```text
src/app/
├── _layout.tsx
├── index.tsx
├── home.tsx
├── summary.tsx
└── result.tsx
```

As rotas representam composição e navegação. Providers, features, regras de domínio e infraestrutura permanecem fora de `src/app`.

### Fluxo de navegação

```text
/
 ↓
/home
 ↓
/summary
 ↓
/result
```

A rota inicial apresenta o Welcome quando necessário e direciona o usuário para o fluxo principal.

Na Home, atividade, localização e data são selecionadas por Bottom Sheets.

A tela de Summary apresenta o plano e já dispara o prefetch do forecast horário quando latitude, longitude e date estão disponíveis.

A tela de Result apresenta os estados de loading, erro, recomendação e ausência de recomendação, reutilizando o cache do TanStack Query quando o prefetch do Summary já concluiu.

Quando não existe uma recomendação adequada, o usuário pode retornar à Home e ajustar o plano.

---

## UI compartilhada e tema

Componentes reutilizáveis que não pertencem a uma única feature ficam em:

```text
src/shared/ui/
```

Atualmente, essa camada concentra primitives visuais do produto, como o `ClimioIcon` e o `ThemeToggle`.

Os tokens e configurações de tema ficam em:

```text
src/shared/theme/
```

O tema suporta Light e Dark Mode e é consumido pelas telas e componentes compartilhados.

A camada compartilhada não contém regras de negócio específicas do Recommendation Engine.

---

## Princípios arquiteturais

As principais regras que orientam a implementação são:

1. **UI não contém regra de negócio.**
2. **Recommendation Engine não depende de React Native.**
3. **Domínio não acessa APIs externas.**
4. **Payloads externos são validados antes de entrar no domínio.**
5. **Server state fica no TanStack Query.**
6. **Client state do plano fica no Zustand.**
7. **Repositories isolam integrações externas.**
8. **Hooks de aplicação orquestram os fluxos sem duplicar regras de domínio.**
9. **Features mantêm o código relacionado ao mesmo contexto próximo.**
10. **Regras importantes devem ser determinísticas e testáveis.**

Essa separação permite que mudanças de UI, API ou infraestrutura sejam feitas sem reescrever o núcleo das regras de recomendação.
