# Booked

Booked é um site dedicado à economia circular de livros permitindo que os utilizadores comprem 
e vendam obras literárias em segunda mão, 
promovendo a sustentabilidade e o acesso facilitado à leitura.

## Estrutura do projeto

### .venv: 
Recomendamos o uso de um venv para isolar as dependências do Python. Isto evita problemas 
de compatibilidade e mantém o ambiente de desenvolvimento limpo.

1. Criar o ambiente (na diretoria backend):
   - `cd backend` 
   - `python -m venv .venv`

2. Ativar o .venv (dentro da diretoria backend):
   - Windows: `.venv\Scripts\activate`
   - Mac/Linux: `source .venv/bin/activate`

### backend:
  - **core**: a nossa Project Root App, contendo as configurações globais.
  - **api**: a nossa Django app. É um módulo contido e independente focado numa
funcionalidade específica. Neste caso esta app é dedicada a gerir a interface da API
usando o Django REST Framework, para receber e enviar dados.
  - **manage.py**: utilitário de linha
de comandos que possibilita diferentes interações com o projeto. 

### frontend:
- **node_modules**: diretório de dependências
- **public**: pasta para ficheiros estáticos, ou seja, o que for colocado aqui
será usado diretamente pelo servidor web exatamente como está, como, por exemplo, fotos.
- src
  - **pages**: contém todas as páginas do nosso projeto 
  - **assets**: guarda ficheiros estáticos que vão ser importados diretamente (JavaScript/CSS).
  - **components**: guardamos os componentes UI reutilizáveis em toda a aplicação.
  - **context**: dedicado ao contexto do utilizador
- **main.jsx**: entry point 

## Configuração do Backend (dentro da diretoria backend):

Dentro da diretoria backend instalar o pacote django:
- `pip install django`

Criar o Project Root App:
- `django-admin startproject sitepr`

Criação da app api:
- `python manage.py startapp api`

Instalação de bibliotecas:
- `pip install djangorestframework django-cors-headers`

Instalação do cloudinary
- `pip install cloudinary django-cloudinary-storage`

Instalação da biblioteca pillow
- `pip install Pillow`

Instalação da biblioteca dotenv
- `pip install python-dotenv`

Este comando instala a djangorestframework, uma biblioteca para desenvolver aplicações
web REST num projeto Django. É também instalada no projeto a biblioteca django-corsheaders, que permite 
associar Cross-Origin Resource Sharing (CORS) aos pedidos HTTP, para
que o backend Django possa aceitar pedidos vindos do frontend React

### Base de Dados

O ficheiro db.sqlite3 está presente dentro da diretoria backend. 
Este ficheiro db.sqlite3 contém uma base de dados relacional SQLite que, por
omissão, é criada e configurada automaticamente pelo Django.

### Migrações no Django

Quando são definidos os modelos de dados, no ficheiro models.py, há que 
atualizar a base de dados, para que esta passe a refletir os modelos de dados
estabelecidos.

Para isso basta executar dois comandos no terminal dentro da diretoria backend:

- `python manage.py makemigrations api`
- `python manage.py migrate`

## Configuração do frontend (dentro da diretoria frontend):
- `cd frontend`

Criar um novo projeto react:
- `npm create vite@latest`

Após executar o comando, escolher as opções React e JavaScript

Depois, correr o seguinte comando para instalar bibliotecas
adicionais no frontend:
- `npm install bootstrap reactstrap axios moment --save`


- As bibliotecas bootstrap e reactstrap serão usadas para a apresentação gráfica (contêm
vários estilos e componentes já definidos que iremos usar).


- A biblioteca axios é muito importante no contexto de integração frontend/backend, dado
que irá possibilitar uma gestão simplificada dos pedidos HTTP envolvidos na comunicação
com o backend.


- A biblioteca moment será usada por alguns componentes para possibilitar uma
manipulação simplificada do formato das datas e horas.

Esta linha de comando é o ponto de partida para transformar uma aplicação SPA 
em algo que realmente parece um site com várias páginas. O React Router permite que exibir 
diferentes componentes (páginas) baseando-se na URL atual do navegador.

Como instalar:
- `npm install react-router-dom`


## Como correr o projeto

Comece por executar o backend na diretoria backend:
- `python manage.py runserver` (se não der python, tentar python3)


Seguidamente, para o frontend, abrir uma nova janela de terminal e mudar
para a diretoria frontend:

- `npm run dev`