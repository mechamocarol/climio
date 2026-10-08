# **Climio — Product Refinement**

## **1. Contexto**

O Climio é uma aplicação mobile que tem como objetivo ajudar pessoas a
tomarem decisões sobre atividades ao ar livre a partir das condições
meteorológicas.

A proposta do produto é transformar dados climáticos, normalmente
apresentados de forma técnica e fragmentada, em uma recomendação simples,
contextualizada e acionável para a pessoa usuária.

Em vez de apenas apresentar informações como temperatura, vento e
probabilidade de chuva, o Climio considera também **o que a pessoa
pretende fazer, onde pretende realizar a atividade e quando pretende
realizá-la** para responder a uma pergunta prática:

> "Qual é o melhor horário para eu fazer isso?"

No MVP entregue, a pessoa informa o que deseja fazer por meio de uma
seleção manual no catálogo de atividades.

A pessoa também poderá consultar as condições para o dia atual ou
selecionar uma data futura disponível na previsão meteorológica.

Quando autorizado, o Climio pode utilizar a localização atual da pessoa
como alternativa à busca manual de uma cidade.

Entrada em linguagem natural e por voz ficaram fora do MVP entregue.

A primeira versão do produto será desenvolvida como um MVP, com foco em
validar essa proposta de valor de forma simples, clara e objetiva.

---

## **2. Problema**

Pessoas que desejam realizar atividades ao ar livre precisam analisar
diferentes informações meteorológicas para decidir se determinado momento
é adequado para a atividade.

A mesma condição meteorológica pode ter impactos diferentes dependendo
da atividade.

Uma chuva leve, por exemplo, pode ser tolerável para uma caminhada, mas
pode tornar o skate mais arriscado. Temperaturas muito altas podem ser
aceitáveis para algumas atividades, mas inadequadas para um passeio com
criança ou pet.

Além disso, a decisão nem sempre acontece no mesmo dia. Uma pessoa pode
querer planejar uma ida à praia, um piquenique ou uma atividade esportiva
para os próximos dias.

Embora serviços de previsão do tempo disponibilizem essas informações,
a decisão ainda exige que a pessoa interprete os dados por conta própria.

O Climio busca reduzir esse esforço, transformando dados meteorológicos
em uma recomendação contextualizada de acordo com a atividade, localização
e data escolhidas.

---

## **3. Objetivo do produto**

Permitir que uma pessoa informe **o que pretende fazer, onde pretende
realizar a atividade e quando pretende realizá-la**, para descobrir, de
forma rápida e clara, qual é o período mais adequado para aquela
atividade.

No MVP, esses dados são definidos de forma manual (atividade no catálogo,
localização por busca ou GPS, data no seletor).

Quando autorizado, o Climio também pode utilizar a localização atual
da pessoa como alternativa à busca manual de uma cidade.

Além da recomendação, o produto deve explicar os principais fatores que
contribuíram para aquela escolha, proporcionando transparência e
confiança na decisão apresentada.

---

## **4. Objetivo do MVP**

O MVP tem como objetivo validar a principal proposta de valor do Climio:

> Transformar dados meteorológicos em uma recomendação simples e
> contextualizada sobre o melhor horário para realizar uma atividade ao
> ar livre.

Para isso, a primeira versão deverá permitir que a pessoa:

1. Informe ou selecione uma atividade.
2. Busque uma cidade ou utilize sua localização atual.
3. Selecione a data da atividade, utilizando o dia atual como padrão.
4. Consulte a previsão meteorológica disponível para a localização e
   data selecionadas.
5. Analise as condições considerando a atividade escolhida.
6. Visualize uma recomendação de melhor horário.
7. Entenda os principais fatores utilizados para gerar a recomendação.

---

## **5. Escopo do MVP**

### **Dentro do escopo**

- Seleção de atividades pré-estabelecidas (catálogo).
- Busca de cidades.
- Seleção de uma cidade.
- Uso da localização atual do dispositivo (“Usar minha localização”).
- Seleção de data.
- Utilização do dia atual como data padrão.
- Consulta de previsão meteorológica para a data selecionada.
- Análise das condições meteorológicas.
- Análise contextual de acordo com a atividade selecionada.
- Identificação do melhor intervalo de horário.
- Apresentação da recomendação.
- Explicação dos fatores que influenciaram a recomendação.
- Alternativas de horário.
- Estados de carregamento.
- Estados de erro.
- Estados sem resultados.
- Tratamento de condições em que nenhum horário seja considerado
  adequado.

### **Atividades disponíveis no MVP**

- Corrida.
- Skate.
- Ciclismo.
- Caminhada.
- Passeio com pet.
- Passeio com criança.
- Ir à praia.
- Surfar.
- Piquenique.
- Empinar pipa.

Cada atividade possuirá critérios próprios para avaliar as condições
meteorológicas.

### **Formas de entrada (MVP entregue)**

A pessoa seleciona atividade, localização e data por Bottom Sheets na
Home:

- atividade — catálogo fixo;
- localização — busca de cidade **ou** localização atual do dispositivo;
- data — dia atual como padrão, com opção de outra data disponível na
  previsão.

A ordem entre atividade, localização e data não é obrigatória.

Entrada em linguagem natural (texto/voz) permanece como visão futura e
**não faz parte do MVP entregue**.

### **Data**

O dia atual será utilizado como padrão.

A pessoa poderá selecionar outra data disponível na previsão
meteorológica para planejar uma atividade futura.

A aplicação deverá respeitar o período de previsão disponibilizado pela
API utilizada.

### **Fora do escopo**

As funcionalidades abaixo fazem parte da visão futura do produto, mas não
estão no MVP entregue:

- Entrada de atividade em linguagem natural (texto).
- Entrada de atividade por voz / microfone.
- Criação de conta.
- Login e autenticação.
- Perfil de usuário.
- Criação de atividades personalizadas.
- Personalização dos critérios de cada atividade.
- Locais favoritos.
- Histórico de consultas.
- Notificações.
- Recomendações personalizadas com base no histórico.

A exclusão dessas funcionalidades neste momento é intencional. O objetivo
é manter o MVP focado na validação da proposta principal do produto e
entregar uma experiência pequena, consistente e bem acabada.

---

## **6. Visão futura**

Em versões futuras, o Climio poderá evoluir de uma recomendação baseada em
atividades pré-estabelecidas para uma experiência personalizada.

A pessoa usuária poderá, por exemplo:

- Criar suas próprias atividades.
- Informar suas atividades favoritas.
- Definir preferências e tolerâncias para cada atividade.
- Informar a atividade por texto ou voz em linguagem natural.
- Salvar locais e consultas frequentes.
- Receber recomendações personalizadas.
- Configurar notificações sobre condições favoráveis.
- Consultar recomendações baseadas em seu histórico e preferências.

Essa evolução permitirá que a pergunta deixe de ser apenas:

> "Qual é o melhor horário para fazer essa atividade?"

e passe a ser:

> "Qual é o melhor horário para eu andar de bicicleta no domingo?"

---

## **7. Premissas**

- A recomendação será baseada nos dados meteorológicos disponíveis pela
  API utilizada.
- O MVP disponibilizará um conjunto limitado de atividades
  pré-estabelecidas.
- Cada atividade possuirá critérios próprios para avaliação das condições
  meteorológicas.
- A recomendação considerará fatores como temperatura, precipitação e
  vento, de acordo com a atividade selecionada.
- A pessoa usuária informa a atividade por seleção no catálogo do MVP.
- Entrada por linguagem natural (texto/voz) ficou fora do MVP entregue.
- A pessoa poderá consultar o dia atual ou outra data disponível na
  previsão meteorológica.
- O dia atual será utilizado como data padrão.
- Quando a pessoa optar por utilizar sua localização atual, será
  necessário obter a permissão correspondente.
- A pessoa poderá utilizar a busca manual caso não queira ou não possa
  compartilhar sua localização.
- A recomendação será baseada nas condições previstas para a data
  selecionada.
- Os critérios específicos de cada atividade serão definidos durante o
  refinamento das regras de negócio.
- Os critérios terão como objetivo representar condições razoáveis e
  intuitivas para a realização de cada atividade, e não substituir
  orientações profissionais de segurança.
---

## **8. Restrições**

- O MVP deverá utilizar uma API pública de dados meteorológicos.
- A aplicação deverá ser desenvolvida em React Native.
- A experiência deverá permanecer simples e objetiva.
- A recomendação deverá ser compreensível para uma pessoa que não possui
  conhecimento técnico sobre meteorologia.
- As regras de recomendação deverão ser determinísticas e testáveis.
- O uso de localização atual deverá ser opcional.
- A aplicação não deverá depender da localização atual para funcionar.
- A seleção de data deverá respeitar o período de previsão disponibilizado
  pela API.

---

## **9. Pontos a serem definidos**

As regras de negócio do MVP foram consolidadas em `docs/product/mvp/business-rules.md`.

Inclui, entre outras:

- faixas e pesos por atividade;
- score padronizado de rajadas e UV;
- definição de chuva significativa;
- weather codes de tempestade (95, 96, 97, 99);
- bloqueios por atividade;
- classificação percentual do score (IDEAL / ACCEPTABLE / UNFAVORABLE / INADEQUATE);
- formação e seleção de janelas;
- alternativas (até 3);
- daylight com tolerância de 5 pontos percentuais, fora do score;
- valores decimais sem arredondamento prévio;
- limitação de surfe sem dados marítimos;
- contrato conceitual do Recommendation Engine.

Itens de linguagem natural / voz foram documentados historicamente, mas
**não fazem parte do MVP entregue**.

Não há Decision needed abertos para o Recommendation Engine nesta etapa.

---

## **10. Público-alvo**

O MVP do Climio é direcionado a pessoas que realizam ou gostariam de
realizar atividades ao ar livre e precisam tomar decisões rápidas sobre
o melhor momento para fazê-las.

A pessoa usuária não precisa possuir conhecimento sobre meteorologia.
Ela busca uma resposta simples e acionável a partir das condições
climáticas previstas, da atividade que pretende realizar e da data
escolhida.

### **Persona principal**

**Pessoa que deseja realizar uma atividade ao ar livre**

Características:

- Consulta a previsão do tempo antes de sair.
- Precisa interpretar temperatura, chuva e vento para tomar uma decisão.
- Não necessariamente possui conhecimento técnico sobre meteorologia.
- Valoriza respostas rápidas e fáceis de entender.
- Pode realizar diferentes tipos de atividades ao ar livre.
- Pode planejar atividades para o mesmo dia ou para dias futuros.
- Pode preferir uma interação rápida e natural em vez de preencher
  diferentes campos manualmente.

### **Necessidade principal**

Saber rapidamente se existe um bom período para realizar uma determinada
atividade ao ar livre em uma data específica.

### **Exemplo de necessidade**

> "Quero ir à praia domingo, mas não sei qual horário vai estar melhor."

### **Exemplo de entrada natural**

> "Quero levar meu cachorro para passear amanhã."

O Climio deverá identificar a intenção como **passeio com pet** e utilizar
a data informada na consulta.

---

## **11. User Journey**

### **Cenário principal**

A pessoa usuária deseja realizar uma atividade ao ar livre em determinada
data, mas não sabe qual período terá as melhores condições para aquela
atividade.

A jornada pode começar pela atividade, localização ou data, sem exigir
uma ordem específica.

### **Jornada — Entrada manual**

1. **Necessidade**  
   A pessoa decide que gostaria de realizar uma atividade ao ar livre.

2. **Definição da atividade**  
   A pessoa seleciona uma das atividades disponíveis no MVP.

3. **Definição da localização**  
   A pessoa busca uma cidade e seleciona o local desejado ou utiliza sua
   localização atual.

4. **Definição da data**  
   A pessoa mantém o dia atual ou seleciona uma data futura disponível.

5. **Consulta**  
   O aplicativo consulta a previsão meteorológica para a localização e
   data selecionadas.

6. **Análise contextual**  
   O Climio analisa as condições meteorológicas considerando os critérios
   da atividade selecionada.

7. **Recomendação**  
   O aplicativo apresenta o período considerado mais adequado para
   realizar a atividade.

8. **Justificativa**  
   O Climio apresenta os principais fatores que contribuíram para a
   recomendação, permitindo que a pessoa compreenda a decisão.

9. **Decisão**  
   Com base na recomendação, a pessoa decide se e quando realizará sua
   atividade.

### **Jornada — Entrada rápida (fora do MVP entregue)**

Visão futura. Não implementada no MVP.

1. **Necessidade**  
   A pessoa decide que gostaria de realizar uma atividade ao ar livre.

2. **Entrada natural**  
   A pessoa informa por texto ou voz o que deseja fazer.

3. **Identificação**  
   O Climio identifica a atividade correspondente entre as opções
   disponíveis no catálogo.

4. **Localização**  
   Caso autorizado, o Climio utiliza a localização atual da pessoa.
   Caso contrário, oferece a busca manual de uma cidade.

5. **Data**  
   O Climio utiliza a data informada pela pessoa ou, caso nenhuma seja
   informada, utiliza o dia atual.

6. **Consulta**  
   O aplicativo consulta a previsão meteorológica para a localização e
   data definidas.

7. **Análise contextual**  
   O Climio analisa as condições considerando a atividade identificada.

8. **Recomendação**  
   O aplicativo apresenta o período considerado mais adequado.

9. **Justificativa**  
   O Climio apresenta os principais fatores que contribuíram para a
   recomendação.

10. **Decisão**  
    A pessoa decide se e quando realizará sua atividade.

### **Jornada resumida**

**Atividade + Localização + Data → Previsão → Análise → Recomendação → Decisão**

A definição de atividade, localização e data pode ocorrer em qualquer
ordem, tanto pela entrada manual quanto pela entrada rápida.