# Climio — Business Rules

## 1. Objetivo

O Climio transforma dados meteorológicos em uma recomendação simples e contextualizada sobre o melhor horário para realizar uma atividade ao ar livre.

A recomendação deve considerar:

- atividade;
- localização;
- data;
- temperatura;
- temperatura aparente;
- probabilidade de precipitação;
- precipitação;
- velocidade do vento;
- rajadas de vento;
- índice UV, somente quando a atividade o incluir;
- período do dia (daylight) como preferência contextual, não como fator de score.

O resultado deve ser:

- determinístico;
- explicável;
- testável;
- independente da interface;
- independente dos componentes de UI;
- baseado somente nos dados disponíveis.

---

## 2. Princípio da recomendação

O Climio não deve apenas apresentar a previsão do tempo.

A proposta é transformar dados meteorológicos em uma decisão simples:

"Qual é o melhor momento para eu fazer essa atividade?"

O sistema deve analisar os horários disponíveis e identificar o período mais adequado para a atividade selecionada.

---

## 3. Dados meteorológicos utilizados

O MVP pode utilizar os seguintes dados da previsão horária:

- temperatura;
- temperatura aparente;
- probabilidade de precipitação;
- precipitação;
- weather code;
- velocidade do vento;
- rajadas de vento;
- índice UV;
- indicação de dia/noite.

Quando necessário, também podem ser utilizados dados diários como:

- nascer do sol;
- pôr do sol;
- índice UV máximo.

---

## 4. Fonte dos dados

O MVP utiliza a API pública Open-Meteo.

A aplicação deve separar a integração com a API da lógica de negócio.

O Recommendation Engine não deve conhecer detalhes da API.

A camada de infraestrutura deve transformar a resposta da API em um modelo interno de dados meteorológicos.

---

## 5. Temperatura — score geral

Como referência geral, a temperatura pode ser convertida em score:

- 18–26°C → 3
- 15–17°C ou 27–30°C → 2
- 10–14°C ou 31–34°C → 1
- <10°C ou >34°C → 0

Esse score geral serve como referência e pode ser substituído pelo score específico da atividade.

---

## 6. Probabilidade de precipitação — score geral

Como referência geral:

- 0–20% → 3
- 21–40% → 2
- 41–60% → 1
- >60% → 0

Cada atividade pode utilizar faixas próprias quando chuva for mais ou menos relevante para a experiência.

---

## 7. Vento — score geral

Como referência geral:

- 0–15 km/h → 3
- 16–25 km/h → 2
- 26–35 km/h → 1
- >35 km/h → 0

Cada atividade pode utilizar faixas próprias.

---

## 8. Rajadas de vento

Rajadas devem ser consideradas separadamente da velocidade média do vento.

Score padronizado (0–3):

- ≤25 km/h → score 3 → excelente
- 26–35 km/h → score 2 → impacto leve
- 36–45 km/h → score 1 → impacto moderado
- >45 km/h → score 0 → condição desfavorável

O score de rajada pode participar da fórmula conforme o peso definido para cada atividade.

Rajada **não** é bloqueio universal. Uma rajada >45 km/h só torna o período inelegível quando a atividade listar essa condição como bloqueio.

---

## 9. Índice UV

Score padronizado:

- 0–2 → score 3 → baixo
- 3–5 → score 2 → moderado
- 6–7 → score 1 → alto
- 8–10 → score 0 → muito alto
- 11+ → score 0 → extremo

UV **não** é um fator universal.

No MVP, UV entra no score somente para:

- passeio com pet — exposição solar (via score de UV, sem interação adicional com temperatura);
- passeio com criança — exposição solar, com peso relevante.

Para as demais atividades do MVP, UV **não** entra no score.

UV extremo **não** é bloqueio universal.

Não bloqueiar praia por UV extremo.

A preocupação com UV para pet/criança deve ser contextualizada como exposição solar e proteção. Não inventar dados que a API não fornece diretamente (por exemplo, tipo de pele, cobertura de sombra ou uso de protetor).

---

## 9.1 Chuva significativa

Chuva significativa é uma condição objetiva, usada em bloqueios de atividades sensíveis à chuva:

```text
precipitationProbability >= 60%
OU
precipitation >= 2 mm/h
```

Bloqueios por chuva significativa devem usar essa definição.

Não bloquear uma atividade apenas porque há qualquer precipitação.

---

## 10. Weather Code

O weather_code deve ser utilizado como informação complementar.

Pode ajudar a identificar condições como:

- céu limpo;
- parcialmente nublado;
- nublado;
- chuva;
- neve;
- tempestade.

### Tempestade (bloqueio)

Fonte: WMO Weather Interpretation Codes utilizados pelo Open-Meteo.

Códigos de tempestade:

- 95 → Thunderstorm
- 96 → Thunderstorm with slight hail
- 97 → Heavy thunderstorm
- 99 → Thunderstorm with heavy hail

Definição para o Climio:

```text
isThunderstorm(weatherCode) =
  weatherCode === 95 ||
  weatherCode === 96 ||
  weatherCode === 97 ||
  weatherCode === 99
```

Observações:

- 96 e 99 representam tempestades com granizo;
- o Open-Meteo informa que 96/99 só são reportados por modelos com previsão explícita de granizo; os demais modelos reportam 95/97;
- o Climio **não** deve depender exclusivamente de 96/99 para identificar tempestade;
- 95 e 97 são suficientes para representar tempestade nos modelos que não fornecem previsão explícita de granizo.

Esses códigos alimentam as regras de bloqueio por atividade que listam "tempestade".

O weather_code não deve substituir os dados quantitativos de:

- temperatura;
- precipitação;
- probabilidade de precipitação;
- vento;
- rajadas;
- UV.

---

## 11. Atividades disponíveis no MVP

O MVP possui 10 atividades:

1. Corrida
2. Skate
3. Ciclismo
4. Caminhada
5. Passeio com pet
6. Passeio com criança
7. Ir à praia
8. Surfar
9. Piquenique
10. Empinar pipa

A lista deve ser centralizada e possuir identificadores internos estáveis.

---

## 12. Identificador das atividades

Os identificadores internos não devem depender do texto exibido na interface.

Exemplo:

- corrida → running
- skate → skateboarding
- ciclismo → cycling
- caminhada → walking
- passeio com pet → pet_walk
- passeio com criança → child_walk
- praia → beach
- surfar → surfing
- piquenique → picnic
- empinar pipa → kite

Os nomes exibidos ao usuário podem mudar sem alterar as regras de negócio.

---

## 13. Configuração das atividades

As regras devem ser representadas por configuração sempre que possível.

Conceitualmente:

{
  temperatureRules,
  precipitationRules,
  windRules,
  gustRules,
  uvRules,
  weights,
  blockingRules
}

Isso permite adicionar ou alterar atividades sem espalhar regras pelos componentes.

---

## 14. Avaliação por período

A previsão deve ser analisada hora a hora.

Para cada horário:

1. Ler os dados meteorológicos.
2. Identificar os fatores relevantes para a atividade.
3. Calcular os scores individuais.
4. Aplicar pesos.
5. Aplicar regras de bloqueio.
6. Calcular o score final.
7. Classificar o período.
8. Registrar os fatores que influenciaram o resultado.

---

## 15. Status de cada período

Cada período pode receber um dos seguintes status:

- IDEAL
- ACCEPTABLE
- UNFAVORABLE
- INADEQUATE

A classificação deve ser baseada no score normalizado e nas regras de bloqueio.

---

## 16. Cálculo do score

O score é calculado a partir dos fatores relevantes para a atividade.

Fórmula conceitual:

```text
score =
  tempScore * tempWeight +
  precipitationScore * precipitationWeight +
  windScore * windWeight +
  gustScore * gustWeight +
  uvScore * uvWeight
```

Somente os fatores com peso definido para a atividade entram no cálculo.

No MVP, `uvWeight` só existe para passeio com pet e passeio com criança. Para as demais atividades, UV não entra no score.

O resultado deve ser normalizado pelo máximo possível para aquela atividade (`maximumScore`).

---

## 17. Classificação do score

O percentual representa o score normalizado:

```text
percentage = (score / maximumScore) × 100
```

Exemplo:

```text
score = 46
maximumScore = 50
percentage = 92%
```

Um valor como "92% ideal" no produto deve ser derivado matematicamente do score. Nunca deve ser um valor visual fixo.

Classificação:

- 75–100% → IDEAL (rótulo de UI: Excelente)
- 55–74% → ACCEPTABLE (rótulo de UI: Bom)
- 35–54% → UNFAVORABLE (rótulo de UI: Menos favorável)
- 0–34% → INADEQUATE (rótulo de UI: Não recomendado)

As faixas são determinísticas.

Os mesmos dados devem sempre produzir o mesmo resultado.

---

## 17.1 Valores decimais

Usar os valores reais retornados pela API.

Não arredondar valores antes do cálculo do score.

Exemplo: 25,5°C deve ser avaliado como 25,5°C, e não arredondado para 26°C.

As faixas de score devem ser tratadas como intervalos contínuos.

---

## 18. Regras de bloqueio

Bloqueios são diferentes de penalizações.

Uma condição de bloqueio torna o período **inelegível** para recomendação, independentemente do score. O status deve ser tratado como INADEQUATE para fins de elegibilidade.

As regras de bloqueio são específicas por atividade.

Não criar uma regra universal de bloqueio climático.

Não criar regra de "piso molhado": a API não fornece essa informação de forma confiável, e o sistema não deve inferi-la.

Weather codes podem identificar condições de tempestade/severidade quando disponíveis.

A lista completa por atividade está na seção 25.

---

## 19. Formação das janelas

Horários consecutivos elegíveis devem ser agrupados em uma janela.

Uma janela favorável pode conter apenas:

- IDEAL
- ACCEPTABLE

Não entram:

- UNFAVORABLE
- INADEQUATE
- períodos bloqueados

Exemplo:

- 14h → IDEAL
- 15h → ACCEPTABLE
- 16h → IDEAL
- 17h → UNFAVORABLE

Resultado:

14h–16h

Preferir janelas de pelo menos 2 horas consecutivas.

Se não existir nenhuma janela de 2 horas, mas existir uma única hora classificada como IDEAL, essa hora pode ser recomendada como fallback.

Não exigir artificialmente 2 horas quando isso faria o sistema ignorar uma boa oportunidade.

---

## 20. Seleção da melhor janela

Ao comparar janelas candidatas, usar critérios determinísticos nesta ordem:

1. maior média de score;
2. maior menor score dentro da janela;
3. maior duração;
4. horário mais cedo.

O objetivo é privilegiar não apenas o maior pico de qualidade, mas também uma janela consistente.

Exemplo:

```text
17h–19h → média 84%, mínimo 78%
18h–20h → média 84%, mínimo 82%
→ escolher 18h–20h
```

A seleção deve ser determinística.

---

## 20.1 Próximos melhores horários

O resultado pode apresentar até 3 alternativas à recomendação principal.

Regras:

- máximo de 3 alternativas;
- não repetir horários que façam parte da recomendação principal;
- usar os mesmos critérios de elegibilidade;
- aceitar apenas IDEAL ou ACCEPTABLE;
- ordenar por qualidade/score;
- se houver menos de 3, mostrar apenas as disponíveis;
- se não houver alternativas, não exibir a seção.

As alternativas devem ser reais e derivadas dos dados analisados, nunca mockadas ou fixas.

---

## 21. Ausência de recomendação

Quando nenhum horário atingir condições mínimas:

- recommendation deve ser null;
- nenhum horário deve ser recomendado artificialmente;
- a aplicação deve explicar o principal motivo.

Exemplo:

"Hoje não encontramos um período ideal para corrida. A principal dificuldade é a alta chance de chuva durante a tarde."

---

## 22. Dados incompletos

Dados ausentes não devem ser interpretados como condições favoráveis.

Quando um período não possuir dados suficientes:

- o período pode ser descartado;
- não deve receber score artificial;
- não deve ser recomendado.

Se todos os períodos relevantes estiverem incompletos:

"Não foi possível encontrar uma recomendação confiável para esse período."

---

## 23. Resultado da análise

Cada período deve produzir um resultado conceitualmente equivalente a:

{
  score: number,
  status: 'IDEAL' | 'ACCEPTABLE' | 'UNFAVORABLE' | 'INADEQUATE',
  factors: {
    temperature: ...,
    precipitation: ...,
    wind: ...,
    gusts: ...,
    uv: ...
  }
}

A implementação pode adaptar a estrutura, desde que mantenha a separação entre:

- dados meteorológicos;
- avaliação dos fatores;
- score;
- status;
- fatores utilizados na explicação.

---

## 24. Regras específicas por atividade

### 24.1 Corrida

Temperatura:

- 15–25°C → 3
- 12–14°C ou 26–29°C → 2
- 8–11°C ou 30–33°C → 1
- <8°C ou >33°C → 0

Probabilidade de chuva:

- 0–20% → 3
- 21–40% → 2
- 41–60% → 1
- >60% → 0

Vento:

- ≤15 km/h → 3
- 16–25 km/h → 2
- 26–35 km/h → 1
- >35 km/h → 0

Pesos:

- Temperatura: 4
- Chuva: 3
- Vento: 2
- Rajadas: 1

Bloqueio:

- tempestade;
- rajada >45 km/h.

---

### 24.2 Skate

Temperatura:

- 16–27°C → 3
- 13–15°C ou 28–30°C → 2
- 10–12°C ou 31–33°C → 1
- <10°C ou >33°C → 0

Probabilidade de chuva:

- 0–10% → 3
- 11–20% → 2
- 21–30% → 1
- >30% → 0

Vento:

- ≤15 km/h → 3
- 16–20 km/h → 2
- 21–30 km/h → 1
- >30 km/h → 0

Pesos:

- Chuva: 5
- Temperatura: 2
- Vento: 2
- Rajadas: 3

Bloqueio:

- chuva significativa;
- tempestade;
- rajada >45 km/h.

Não usar regra de "piso molhado".

---

### 24.3 Ciclismo

Temperatura:

- 15–28°C → 3
- 12–14°C ou 29–31°C → 2
- 8–11°C ou 32–34°C → 1
- <8°C ou >34°C → 0

Probabilidade de chuva:

- 0–20% → 3
- 21–40% → 2
- 41–60% → 1
- >60% → 0

Vento:

- ≤15 km/h → 3
- 16–25 km/h → 2
- 26–35 km/h → 1
- >35 km/h → 0

Pesos:

- Temperatura: 3
- Chuva: 3
- Vento: 4
- Rajadas: 3

Bloqueio:

- tempestade;
- rajada >45 km/h.

---

### 24.4 Caminhada

Temperatura:

- 12–28°C → 3
- 8–11°C ou 29–31°C → 2
- 5–7°C ou 32–35°C → 1
- <5°C ou >35°C → 0

Probabilidade de chuva:

- 0–30% → 3
- 31–50% → 2
- 51–70% → 1
- >70% → 0

Vento:

- ≤20 km/h → 3
- 21–30 km/h → 2
- 31–40 km/h → 1
- >40 km/h → 0

Pesos:

- Temperatura: 3
- Chuva: 3
- Vento: 2
- Rajadas: 1

Bloqueio:

- tempestade;
- rajada >45 km/h.

---

### 24.5 Passeio com pet

Temperatura:

- 15–25°C → 3
- 12–14°C ou 26–28°C → 2
- 8–11°C ou 29–32°C → 1
- <8°C ou >32°C → 0

Probabilidade de chuva:

- 0–30% → 3
- 31–50% → 2
- 51–70% → 1
- >70% → 0

Vento:

- ≤15 km/h → 3
- 16–25 km/h → 2
- 26–35 km/h → 1
- >35 km/h → 0

UV:

- UV entra no score desta atividade (peso 2), refletindo exposição solar;
- temperatura influencia pelo score de temperatura (peso 5);
- UV influencia pelo score de UV (peso 2);
- **não** existe penalidade adicional de interação UV × temperatura no MVP;
- não inventar dados que a API não fornece (sombra, pelagem, etc.).

Pesos:

- Temperatura: 5
- Chuva: 2
- Vento: 2
- UV: 2

Bloqueio:

- chuva significativa;
- tempestade;
- sensação térmica (temperatura aparente) >32°C.

---

### 24.6 Passeio com criança

Temperatura:

- 16–28°C → 3
- 13–15°C ou 29–30°C → 2
- 10–12°C ou 31–33°C → 1
- <10°C ou >33°C → 0

Probabilidade de chuva:

- 0–20% → 3
- 21–40% → 2
- 41–60% → 1
- >60% → 0

Vento:

- ≤15 km/h → 3
- 16–25 km/h → 2
- 26–35 km/h → 1
- >35 km/h → 0

UV:

- UV entra no score desta atividade (peso 3), por exposição solar;
- UV alto ou extremo reduz a avaliação via score;
- não inventar dados que a API não fornece (protetor, sombra, etc.).

Pesos:

- Temperatura: 4
- Chuva: 3
- Vento: 2
- UV: 3

Bloqueio:

- chuva significativa;
- tempestade;
- calor extremo conforme a regra de temperatura da atividade (temperatura >33°C).

---

### 24.7 Ir à praia

Temperatura:

- 24–31°C → 3
- 21–23°C ou 32–33°C → 2
- 18–20°C ou 34–35°C → 1
- <18°C ou >35°C → 0

Probabilidade de chuva:

- 0–10% → 3
- 11–20% → 2
- 21–40% → 1
- >40% → 0

Vento:

- ≤15 km/h → 3
- 16–25 km/h → 2
- 26–35 km/h → 1
- >35 km/h → 0

UV:

- UV **não** entra no score da praia no MVP;
- UV extremo **não** é bloqueio para praia.

Pesos:

- Temperatura: 4
- Chuva: 4
- Vento: 2

Preferência contextual (não entra no score):

- priorizar períodos com luz do dia quando a diferença de score normalizado for ≤ 5 pontos percentuais (ver seção 38).

Bloqueio:

- chuva significativa;
- tempestade.

---

### 24.8 Surfar

Limitação (obrigatória):

- o Climio não possui dados marítimos no MVP;
- a recomendação considera apenas condições meteorológicas disponíveis na API;
- o sistema **não** deve afirmar que avaliou altura de onda, período de onda, correnteza, condições marítimas ou qualidade da arrebentação;
- uma futura versão poderá utilizar uma API específica de condições marítimas.

Temperatura:

- 18–30°C → 3
- 15–17°C ou 31–33°C → 2
- 12–14°C ou 34–35°C → 1
- <12°C ou >35°C → 0

Probabilidade de chuva:

- 0–40% → 3
- 41–60% → 2
- 61–80% → 1
- >80% → 0

Vento:

- 10–25 km/h → 3
- 5–9 km/h ou 26–30 km/h → 2
- 0–4 km/h ou 31–35 km/h → 1
- >35 km/h → 0

Pesos:

- Vento: 4
- Temperatura: 2
- Chuva: 1
- Rajadas: 3

Bloqueio:

- tempestade;
- rajada >45 km/h.

---

### 24.9 Piquenique

Temperatura:

- 18–27°C → 3
- 15–17°C ou 28–30°C → 2
- 10–14°C ou 31–34°C → 1
- <10°C ou >34°C → 0

Probabilidade de chuva:

- 0–10% → 3
- 11–20% → 2
- 21–30% → 1
- >30% → 0

Vento:

- ≤10 km/h → 3
- 11–15 km/h → 2
- 16–25 km/h → 1
- >25 km/h → 0

Pesos:

- Chuva: 5
- Temperatura: 3
- Vento: 3

Preferência contextual (não entra no score):

- priorizar períodos com luz do dia quando a diferença de score normalizado for ≤ 5 pontos percentuais (ver seção 38).

Bloqueio:

- chuva significativa;
- tempestade;
- rajada >45 km/h.

---

### 24.10 Empinar pipa

Temperatura:

- 15–28°C → 3
- 12–14°C ou 29–31°C → 2
- 8–11°C ou 32–34°C → 1
- <8°C ou >34°C → 0

Probabilidade de chuva:

- 0–10% → 3
- 11–20% → 2
- 21–30% → 1
- >30% → 0

Vento:

- 10–25 km/h → 3
- 5–9 km/h ou 26–30 km/h → 2
- 0–4 km/h ou 31–35 km/h → 1
- >35 km/h → 0

Rajadas:

- usam o score padronizado 0–3 da seção 8;
- participam da fórmula com peso 3.

Pesos:

- Vento: 5
- Rajadas: 3
- Chuva: 3
- Temperatura: 1

Preferência contextual (não entra no score):

- priorizar períodos com luz do dia quando a diferença de score normalizado for ≤ 5 pontos percentuais (ver seção 38).

Bloqueio:

- chuva significativa;
- tempestade;
- rajada >45 km/h.

---

## 25. Regras de bloqueio por atividade

Bloqueios têm prioridade sobre o score e são específicos por atividade.

### Corrida

- tempestade;
- rajada >45 km/h.

### Skate

- chuva significativa;
- tempestade;
- rajada >45 km/h.

### Ciclismo

- tempestade;
- rajada >45 km/h.

### Caminhada

- tempestade;
- rajada >45 km/h.

### Passeio com pet

- chuva significativa;
- tempestade;
- sensação térmica >32°C.

### Passeio com criança

- chuva significativa;
- tempestade;
- temperatura >33°C (calor extremo da regra da atividade).

### Ir à praia

- chuva significativa;
- tempestade.

### Surfar

- tempestade;
- rajada >45 km/h.

### Piquenique

- chuva significativa;
- tempestade;
- rajada >45 km/h.

### Empinar pipa

- chuva significativa;
- tempestade;
- rajada >45 km/h.

Não usar:

- bloqueio universal climático;
- bloqueio por UV extremo;
- regra de "piso molhado";
- bloqueio de praia por UV.

Novas regras podem ser adicionadas futuramente, desde que sejam explícitas e testáveis.

---

## 26. Explicação da recomendação

A explicação deve ser gerada a partir dos fatores que mais influenciaram o resultado.

Deve:

- mencionar a atividade;
- indicar o horário recomendado;
- explicar os principais fatores positivos;
- explicar os principais fatores negativos quando relevante;
- evitar informações que não contribuíram para a decisão.

Exemplo:

"Para corrida, o melhor período é das 7h às 9h. A temperatura estará agradável, com baixa chance de chuva e vento leve."

---

## 27. Explicação quando não houver recomendação

Quando não houver horário adequado, explicar o principal motivo.

Exemplo:

"Não encontramos um período ideal para corrida hoje. A principal dificuldade é a alta chance de chuva durante a tarde."

A aplicação não deve recomendar um horário inadequado apenas para evitar um estado vazio.

---

## 28. Entrada por linguagem natural

O usuário poderá informar a atividade utilizando texto livre.

A identificação deve ser conservadora e determinística.

Regras:

1. Se uma única atividade for identificada com confiança suficiente → usar essa atividade.
2. Se nenhuma atividade for identificada → solicitar seleção manual.
3. Se houver ambiguidade ou mais de uma atividade possível → **não** escolher automaticamente; solicitar seleção manual.
4. O sistema nunca deve criar uma atividade que não esteja no catálogo do MVP.

Exemplos:

- "Quero correr" → running
- "Vou levar meu cachorro para passear" → pet_walk
- "Quero andar de bicicleta" → cycling
- "Quero fazer algo ao ar livre" → ambíguo → seleção manual
- "Quero praticar um esporte" → ambíguo → seleção manual
- "Quero fazer alguma coisa com meu cachorro" → pet_walk, quando a intenção estiver clara

A estratégia deve ser previsível, determinística, testável e baseada no catálogo de atividades.

Não criar NLP complexo no MVP.

---

## 29. Identificação de atividade

A identificação deve transformar diferentes formas de entrada em um identificador único do catálogo.

Exemplos:

- "correr" → running
- "corrida" → running
- "andar de bike" → cycling
- "bicicleta" → cycling
- "passear com cachorro" → pet_walk
- "ir para a praia" → beach

Em caso de ambiguidade ou múltiplos candidatos, o resultado deve ser "não identificado" e a UI deve solicitar seleção manual.

A identificação deve ser previsível e testável.

---

## 30. Entrada por voz

O usuário poderá informar a atividade por voz.

A voz deve ser convertida em texto e seguir o mesmo processo de identificação utilizado para texto.

O reconhecimento de voz não faz parte das regras do Recommendation Engine.

O motor recebe apenas a atividade já identificada.

---

## 31. Localização

O usuário poderá informar:

- uma cidade por busca;
- sua localização atual.

A localização atual depende da permissão do dispositivo.

Se a permissão for negada ou estiver indisponível, o usuário deve conseguir continuar utilizando a busca manual.

A recomendação deve funcionar independentemente da origem da localização.

---

## 32. Busca de cidade

Fluxo:

1. Usuário informa o nome da cidade.
2. Sistema consulta o serviço de geocoding.
3. Sistema apresenta possíveis resultados.
4. Usuário seleciona uma localização.
5. Sistema utiliza latitude e longitude para consultar a previsão.

Se não houver resultados:

"Não encontramos essa cidade. Tente outro nome."

---

## 33. Seleção de localização

O usuário deve conseguir confirmar a localização antes da consulta meteorológica.

Cada resultado deve apresentar informações suficientes para diferenciação, como:

- nome da cidade;
- estado/região;
- país.

Após a seleção, latitude e longitude devem ser armazenadas para consulta da previsão.

---

## 34. Previsão meteorológica

A consulta da previsão deve utilizar latitude e longitude.

A consulta deve solicitar somente os dados necessários para o MVP.

A previsão deve ser independente da atividade selecionada.

A atividade é utilizada posteriormente pelo Recommendation Engine.

---

## 35. Seleção de data

A data atual é selecionada por padrão.

O usuário poderá selecionar uma data futura desde que exista previsão disponível.

Regras:

- hoje é a seleção padrão;
- datas futuras disponíveis podem ser selecionadas;
- datas sem previsão não devem ser selecionáveis;
- alterar a data deve atualizar a análise;
- a data selecionada deve ser utilizada na consulta e análise.

---

## 36. Data em linguagem natural

O MVP deve suportar apenas interpretações simples e determinísticas.

Exemplos:

- "hoje" → data atual
- "amanhã" → próximo dia
- "sábado" → próximo sábado aplicável conforme a data atual
- "próximo domingo" → domingo seguinte

Quando a interpretação não for confiável ou houver ambiguidade:

- solicitar seleção manual da data.

O sistema **não** deve assumir uma data quando houver dúvida.

Não criar parser complexo de linguagem natural no MVP.

A interpretação de data deve permanecer independente do Recommendation Engine.

O Recommendation Engine recebe uma data já resolvida.

---

## 37. Janela de previsão

O MVP utiliza somente datas para as quais a API possui previsão disponível.

A aplicação não deve assumir que qualquer data futura estará disponível.

A interface deve impedir ou orientar o usuário quando uma data estiver fora do período de previsão.

---

## 38. Período do dia (daylight)

Daylight **não** entra no score meteorológico.

É um critério contextual de preferência/desempate.

Usar os dados de sunrise/sunset fornecidos pela API.

Duas opções são meteorologicamente "muito próximas" quando:

```text
abs(scorePercentageA - scorePercentageB) <= 5
```

Exemplos:

- 82% vs 78% → diferença de 4 pontos → próximas → daylight pode ser usado como critério secundário;
- 82% vs 72% → diferença de 10 pontos → **não** próximas → o score deve prevalecer.

Quando a diferença estiver dentro desse limite e a atividade tiver preferência por daylight, o período com luz do dia pode ser priorizado.

Importante:

- daylight continua fora do score;
- daylight não altera o percentual;
- daylight não pode fazer uma opção significativamente pior vencer uma opção significativamente melhor;
- daylight é apenas critério contextual de desempate/prioridade dentro da tolerância de 5 pontos percentuais.

Atividades do MVP com preferência por luz do dia:

- ir à praia;
- caminhada;
- corrida;
- ciclismo;
- piquenique;
- empinar pipa.

Não inferir segurança noturna.

Não transformar "é noite" automaticamente em bloqueio.

Separar explicitamente:

- **Score meteorológico** → qualidade das condições;
- **Daylight** → contexto/preferência;
- **Blocking conditions** → elegibilidade.

---

## 39. Surf e condições marítimas

O Climio não possui dados marítimos no MVP.

Portanto, para a atividade "Surfar":

- a recomendação é baseada apenas em condições meteorológicas disponíveis na API;
- não considerar altura das ondas;
- não considerar período das ondas;
- não considerar direção da ondulação;
- não considerar correnteza;
- não considerar qualidade da arrebentação;
- não afirmar que as condições são boas para surfe como prática marítima;
- não afirmar que o sistema avaliou condições marítimas.

A recomendação deve ser apresentada como recomendação de condições meteorológicas para a atividade.

Essa limitação deve aparecer na documentação do domínio e, quando apropriado, na explicação ao usuário.

---

## 40. Limitações do MVP

O sistema deve deixar claro que:

- a recomendação utiliza regras simplificadas;
- não substitui orientação meteorológica profissional;
- condições reais podem mudar;
- o usuário deve considerar condições locais;
- o usuário deve considerar alertas oficiais;
- para surf, condições marítimas não são consideradas;
- o sistema não afirma ter avaliado ondas, correnteza ou arrebentação;
- a precisão depende da fonte de dados meteorológicos.

---

## 41. Determinismo

Para a mesma combinação de:

- atividade;
- localização;
- data;
- dados meteorológicos;

o sistema deve produzir o mesmo resultado.

Não utilizar aleatoriedade no Recommendation Engine.

Isso facilita:

- testes;
- debugging;
- previsibilidade;
- explicabilidade;
- manutenção.

---

## 42. Testabilidade

As principais regras devem ser implementadas como funções puras sempre que possível.

O Recommendation Engine deve poder ser testado sem:

- renderizar componentes;
- realizar chamadas HTTP;
- depender de permissões do dispositivo;
- depender de localização real;
- depender de APIs externas.

Os dados meteorológicos devem ser fornecidos como entrada de teste.

---

## 43. Separação de responsabilidades

A aplicação deve separar:

- obtenção dos dados;
- transformação dos dados;
- regras de negócio;
- recomendação;
- apresentação.

Componentes de UI não devem:

- realizar cálculos meteorológicos;
- decidir qual horário é melhor;
- conter regras específicas de atividade;
- conhecer pesos ou thresholds.

---

## 44. Recommendation Engine

O futuro Recommendation Engine deve ser:

- determinístico;
- puro;
- independente de React / React Native;
- independente de componentes de UI;
- independente da API específica;
- facilmente testável.

Entrada conceitual:

```text
activity + weatherData + activityRules
```

Saída conceitual:

```text
recommendation
+ candidate periods
+ score
+ status
+ relevant factors
+ explanation
```

Mais detalhadamente, o resultado deve permitir apresentar:

- períodos analisados;
- score e percentual de cada período;
- status de cada período;
- melhor janela (ou `null`);
- até 3 alternativas elegíveis;
- fatores relevantes;
- explicação;
- ausência de recomendação quando aplicável;
- limitação de surfe quando a atividade for surfing.

A camada de API/infraestrutura deve apenas transformar dados externos no modelo de domínio esperado pelo engine.

O engine não deve conhecer React Native, Open-Meteo, TanStack Query ou componentes de UI.

---

## 44.1 Decisões finais

Resumo das decisões fechadas antes da implementação do Recommendation Engine:

- **Tempestade** = weather codes 95, 96, 97 e 99 (WMO / Open-Meteo); o Climio não depende exclusivamente de 96/99.
- **Pet** → não existe penalidade adicional UV × temperatura; apenas os scores e pesos já definidos.
- **Daylight** → tolerância de 5 pontos percentuais no score normalizado (`abs(diff) <= 5`); fora do score.
- **Identificação ambígua de atividade** → exige seleção manual; sem NLP complexo.
- **Interpretação ambígua de data** → exige seleção manual; o engine recebe a data já resolvida.

---

## 45. Evolução futura

A arquitetura deve permitir posteriormente:

- atividades criadas pelo usuário;
- critérios personalizados;
- tolerância individual a frio;
- tolerância individual a calor;
- tolerância individual à chuva;
- tolerância individual ao vento;
- atividades favoritas;
- histórico;
- notificações;
- recomendações personalizadas;
- integração com APIs marítimas;
- novas fontes de dados meteorológicos.

Essas funcionalidades não fazem parte do MVP.

---

## 46. Critério de sucesso do MVP

O MVP será considerado funcional quando o usuário conseguir realizar:

Atividade → Localização → Data → Previsão → Análise → Melhor horário → Explicação

O usuário deve conseguir entender:

1. qual atividade foi considerada;
2. qual local foi analisado;
3. qual data foi considerada;
4. qual horário foi recomendado;
5. por que aquele horário foi recomendado;
6. quando não existe um horário adequado.

---

## 47. Independência da ordem das entradas

O usuário não precisa necessariamente informar os dados em uma ordem rígida.

O fluxo deve permitir que a pessoa:

- selecione a atividade antes da localização;
- selecione a localização antes da atividade;
- escolha a data antes ou depois da atividade;
- altere atividade, localização ou data antes de executar a análise.

A recomendação só deve ser executada quando houver informações suficientes para a consulta.

---

## 48. Alteração dos parâmetros

O usuário deve conseguir alterar:

- atividade;
- localização;
- data.

Ao alterar qualquer um desses parâmetros, a recomendação anterior deve ser considerada desatualizada.

A aplicação deve recalcular a recomendação com os novos dados.

Não reutilizar uma recomendação antiga quando os parâmetros relevantes tiverem mudado.

---

## 49. Consistência da experiência

A interface deve refletir claramente o estado atual da análise.

O usuário deve conseguir identificar:

- atividade selecionada;
- localização selecionada;
- data selecionada;
- estado da consulta;
- resultado da recomendação.

Estados de loading, erro, ausência de resultado e dados insuficientes devem ser tratados explicitamente.

---

## 50. Princípio final

O Climio não deve apenas mostrar a previsão do tempo.

O produto deve transformar dados meteorológicos em uma decisão simples, contextualizada e explicável:

"Qual é o melhor momento para eu fazer essa atividade?"

A experiência deve priorizar:

- clareza;
- utilidade;
- simplicidade;
- explicabilidade;
- previsibilidade;
- segurança;
- testabilidade;
- facilidade de evolução.

As regras de negócio devem permanecer independentes da interface para permitir evolução do produto sem reescrever o Recommendation Engine.