<h1 align="center" style="font-weight: Bold">:desktop_computer: Projeto Track App </h1>

Este Projeto é um aplicativo web para visualização e análise de dados 📈, neste caso estamos utilizando os dados em [Anexo](/src/assets).

* [Projeto](#projeto)
* [Instalação](#instalando--rodando-o-aplicativo)
* [Escolhas Tecnicas](#escolhas-técnicas)
* [Melhorias](#melhorias-futuras)

Além disso, o projeto esta *live* e está disponível [aqui](https://track-app-gamma.vercel.app/).

### Pré-Requisitos:

Para utilizar esta aplicação é necessário ter instalado:

1. NodeJS e NPM (Testado nas Versões 22.12.0, 10.5.0 respectivamente) [vendor](https://nodejs.org/en/download).

### Instalando & Rodando o aplicativo.

Uma vez que os pré-requisitos estejam instalados, para instalar esta aplicação:

1. Clone este repositorio:

```Bash
git clone https://github.com/vtmattedi/TrackApp
```

2. Abra a pasta

```Bash
    cd <folder>
```

> [!WARNING]
> Npm recentemente teve o chain-supply infectado, recomenda-se (mais que o normal) testar em ambiente controlado.

3. Instale as dependências:

```Bash
    npm install
```

4. Rodar em ambiente de desenvolvimento

```Bash
    npm run dev
```

5. (opcional) Build do aplicativo:

```Bash
    npm run build
```

*Nota: Como discutido adiante, estmos utilizando o react-router e portanto, caso sirva manualmente ou com algum serviço a pasta dist, resultado da compilação do projeto, é nescessário redirecionar os requests de rotas para o entry point como feito em [vercel.json](/vercel.json) para o uso com a vercel.*

### Projeto

#### Escolhas técnicas

Para este projeto, foi utilizado como base Vite+React com TypeScript que são ferramentas consolidadas no mercado.
Além disso, foram utilizadas, principalmente, as seguintes `packages`:

* Tailwindcss v4 & Shadcn/ui: Biblioteca de componentes visuais facilitando a criação e padronização de componentes so longo da aplicação
* Leaflet: Biblioteca para a visualização de mapas.
* React-Router-Dom: Biblioteca para orgainazação de páginas e rotas.
  Estas Bibliotecas foram escolhidas pois, novamente, já são consolidadas e todas tem licença de uso MIT ou BSD.
* Lucide: Biblioteca para icones e SVG's

Além disso foram implementados os temas claros e escuro e o design é responsível garantindo uma boa UX não só na versão desktop.

Para o compartilhamento de informações dentro do aplicativo foi utilizado o contexto padrão do react pois esta aplicação é relativamente pequena. Foram criados dois *providers* um para o uso de alertas genéricos e um para informações globais como usuário logado, tema atual e se estamos ou não no mobile (baseado no tamanho da tela).

As informações de usuário e preferência de tema são persistentes no navegador do usuário, utilizando o *localStorage*.

#### Dashboard

O aplicativo permite a visualização dos dados em anexo (dados de pessoal por dia em cada localização). Estes dados primeiramente são agrupados por área ou por data e posteriormente filtrados e agregados de acordo com a interação do usuário.

O dashboard principal é composto primordialmente por 3 partes:

* Visualização de séries temporais
* Cards de estatística
* Visualização de destribuição dos dados em um ponto

Os dados podem ser agregados considerando:

* Por tipo de função
* Por área
* Total

E podem ser agrupados por:

* Valor por dia
* Soma dos valores durante a semana
* Soma dos valores durante o mês

Além disso podemos filtrar apenas pelos dados das últimas 24 horas, 15 dias, 30 dias ou todos os dados, entretanto esse periodo considera o dia atual 30/08/2025 pois os dados são estaticos e este é o último dia com dados disponíveis.

Desta forma temos:

- **A visualização principal** dos dados temporais que podem ser em graficos de área, barra ou linha e pode ser de forma pontual ou interpolada por spline nos gráficos que suportam tal funcionalidade. o gráfico de pizza foi deliberadamente separado desta parte pois ele não permite o plot de multiplas séries temporais. Ao clicar em uma ponto, os dados da visualição de distribuição são selecionados para aquele ponto.
- **Cards de estatísticas** mostarando a média e o pico com as unidades corretas baseado nos filtros e formas de agragação e periodo.
- **Visualição de distribuição** dos dados totais por area ou de funções em uma area. o usuario pode selecionar qual área (caso mais de uma esteja nos filtros) ou a distribuição por área. Além disso, é possível selecionar qual dos pontos (dia, semana ou mês ~~ e futuramente horas?~~) disponiveis nos dados filtrados deseja visualizar (último ponto por padrão) além disso, caso esteja visualizando a distribuições por área e clique em uma área, a visuzalição irá para os dados daquela área.

#### Mapa

Além, do dashboard, foi construído um mapa, utilizando o [leaflet](https://leafletjs.com/) onde podemos visualizar cada área, podendo filtrar por tipo de área e ao clicar no *marker* dela podemos ver os dados do ultimo ponto de dados daquela área. É possível selecionar entre o mapa normal ou satélite. Este é o único local onde foi necessário utilizar um arquivo css diretamente para poder propriamente aplicar o tema escuro no *popup* do mapa.

#### Extras

Além destas telas, foi feita também uma tela do login para o qual o usuário é redirecionado caso seja inválidado (atualmente a única forma é manualmente deslogando mas posteriormente seria pela sessão inválidada). Da mesma forma caso já tenha um usuário logado ele é redirecionado para o dashboard. Porém como é um sistema de testes, caso não tenha um usuário (foi feito o logout), durante a montagem do *provider* global o usuário de demonstração é logado automaticamente (que atualmente é o único disponível), então dar um *refresh* na pagina de login fará o usuário logar na conta de demonstração.

É possível simular um upgrade de conta, que é persistente no browser, porém como não temos um backend conectado, esta conta é resetada toda vez que o ciclo de logout/login acontece.

Como este aplicativo foi desenvolvido para o Desafio Técnico da Trackfy, o aplicativo conta com material personalizado, tanto no login quanto nos recursos de PWA/favicon que **só estarão disponiveis temporariamente** e serão retirados com celeridade após tal etapa.

### Melhorias futuras:

Um projeto deste tipo, caso evolua para um produto real, ou caso tivese mais tempo para desenvolvimento, tem varios pontos de melhorias:

##### Pontos iniciais:

Primeiramente, teríamos que fazer um sistema um pouco mais robusto de autenticação & autorização, implementando alguma estratégia de session como JWT.
Além disso, com o crescimento da aplicação seria interessante implementar alguma estruturas que suportem uma aplicação mais complexa como:

- **redux:** para o controle de estados mais complexos.
- **react-query**: para melhoria de performance em caso de multiplas requições e, principalmente, ter a possibilidade de ter o filtro armazenado na url ao invés de estado, permitindo o usuário a salvar/compartilhar o aplicativo filtro específico pre-selecionado além de permitir, por exemplo, o filtro no menu lateral na versão mobile com mais facilidade.
- **i18n:** Caso o aplicativo tenha como publico alvo usuários cuja lingua primaria não seja o portugues, seria interessante a internacionalização do aplicativo.

Introduzir estas mudanças no começo do desenvolvimento facilitará bastante o desenvolvimento caso tais caracteristicas sejam desejadas ou necessárias com o aumento da complexidade do aplicativo.

##### SSR/SSG/CRS

Como esta aplicação é algo amplamente dinamico, precisamos de bastante coisa gerada no *client-side* além disso, não teríamos muitas vantagens nas páginas serem geradas no *server-side* pois ela estaria protegida por autenticação, não tendo impacto no SEO, desta forma não teria muitas vantagens utilizar tecnicas de SSR/SSG, entretanto, ***caso fosse desejado***, poderiamos gerar uma landing page separadamente, otimizando o SEO, e utilizar um subdominio para o aplicativo i.e. trackapp.com -> landing page app.trackapp.com -> aplicativo.

##### Análise de Dados

Na parte de análise de dados, a depender o tamanho do data-set utilizado, poderiamos utilizar o indexDB para manter uma cópia do banco dados localmente e utilizar um *service-worker* para manter ele atualizado no background, diminuindo o tempo de requisição do banco de dados.
Além disso, eu implementaria a possibilidade de escolher um range especifico de dias (ou granulado à horas caso tenha acesso a tais dados) tanto de começo quanto de final podendo análisar períodos específicos de dias (com início e fim).

##### UI

Na parte de UI, trabalharia um pouco mais na escolha da paleta, especialmente para o tema claro e implementaria mais coisas ainda como variáveis css ao inves de *hardcoded*, possibilitanto facilmente a manutenabilidade  e coesão.
Além disso, com mais tempo faria melhorias as visualizações das *labels* dos gráficos.

##### UX

Para a UX, eu aprimoraria a interação com cliques no gráfico, por exemplo habilitando a seleção de range diretamente no gráfico, além disso, como teríamos dados dinamicos, seria interessante adicionar *skeleton-loaders* para os componentes que precisam desses dados.
Por fim, eu finalizaria a adequação de acessibilidade terminando de popular as *aria-label* e *aria-role* nos lugares necessários.
