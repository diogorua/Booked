from django.db import models
from django.contrib.auth.models import User

DISTRITOS = [
    ('Aveiro', 'Aveiro'), ('Beja', 'Beja'), ('Braga', 'Braga'),
    ('Bragança', 'Bragança'), ('Castelo Branco', 'Castelo Branco'),
    ('Coimbra', 'Coimbra'), ('Évora', 'Évora'), ('Faro', 'Faro'),
    ('Guarda', 'Guarda'), ('Leiria', 'Leiria'), ('Lisboa', 'Lisboa'),
    ('Portalegre', 'Portalegre'), ('Porto', 'Porto'), ('Santarém', 'Santarém'),
    ('Setúbal', 'Setúbal'), ('Viana do Castelo', 'Viana do Castelo'),
    ('Vila Real', 'Vila Real'), ('Viseu', 'Viseu'),
    ('Açores', 'Açores'), ('Madeira', 'Madeira'),
]

class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    plano = models.CharField(max_length=50)
    imagem = models.ImageField(upload_to='profile_pics/', default='default.png')
    biografia = models.TextField(max_length=300, blank=True, default='')
    distrito = models.CharField(max_length=50, choices=DISTRITOS, blank=True, default='')

    def __str__(self):
        return self.user.username

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

class Book(models.Model):
    ESTADOS_CONSERVACAO = [
        ('Novo', 'Novo'),
        ('Usado', 'Usado'),
        ('Muito Usado', 'Muito Usado'),
    ]

    vendedor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='livros_a_venda')

    titulo = models.CharField(max_length=200)
    autor = models.CharField(max_length=200)
    categoria = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    estado_conservacao = models.CharField(max_length=50, choices=ESTADOS_CONSERVACAO)
    preco = models.DecimalField(max_digits=6, decimal_places=2)

    # O Django Cloudinary Storage vai automaticamente intercetar isto e enviar para a nuvem
    imagem_capa = models.ImageField(upload_to='capas_livros/', blank=True, null=True)
    data_publicacao = models.DateTimeField(auto_now_add=True)

    favoritos = models.ManyToManyField(User, related_name='favoritos', blank=True)
    vendido = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.titulo} - Vendido por {self.vendedor.username}"

class Compra(models.Model):
    comprador = models.ForeignKey(User, on_delete=models.CASCADE, related_name='compras')
    livro = models.ForeignKey(Book, on_delete=models.CASCADE)
    data_compra = models.DateTimeField(auto_now_add=True)
    avaliada = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.comprador.username} comprou {self.livro.titulo}"


class Avaliacao(models.Model):
    avaliador = models.ForeignKey(User, on_delete=models.CASCADE, related_name='avaliacoes_feitas')
    avaliado = models.ForeignKey(User, on_delete=models.CASCADE, related_name='avaliacoes_recebidas')

    ESTRELAS_CHOICES = [
        (1, '1 Estrela'),
        (2, '2 Estrelas'),
        (3, '3 Estrelas'),
        (4, '4 Estrelas'),
        (5, '5 Estrelas'),
    ]
    estrelas = models.IntegerField(choices=ESTRELAS_CHOICES)

    comentario = models.TextField(max_length=500, blank=True, default='')

    data_avaliacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.avaliador.username} deu {self.estrelas}★ a {self.avaliado.username}"


class Reporte(models.Model):
    MOTIVOS_CHOICES = [
        ('Fraude/Burla', 'Fraude/Burla'),
        ('Conteúdo Impróprio', 'Conteúdo Impróprio'),
        ('Preço Abusivo', 'Preço Abusivo'),
        ('Outro motivo', 'Outro motivo'),
    ]

    denunciante = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reportes_enviados')
    tipo = models.CharField(max_length=20, choices=[('livro', 'Livro'), ('perfil', 'Perfil')])

    # Guardamos o ID e o nome como texto para o Admin conseguir ler o histórico
    # mesmo que o utilizador ou livro seja apagado da plataforma
    alvo_id = models.IntegerField()
    alvo_nome = models.CharField(max_length=200)  # Título do livro ou @username

    motivo = models.CharField(max_length=50, choices=MOTIVOS_CHOICES)
    descricao = models.TextField(max_length=500, blank=True, default='')
    data_criacao = models.DateTimeField(auto_now_add=True)
    resolvido = models.BooleanField(default=False)

    def __str__(self):
        return f"[{self.tipo.upper()}] Queixa de {self.denunciante.username} contra {self.alvo_nome}"