from django.db import models
from django.contrib.auth.models import User


class ClientProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    plano = models.CharField(max_length=50)
    imagem = models.ImageField(upload_to='profile_pics/', default='default.png')

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

    def __str__(self):
        return f"{self.titulo} - Vendido por {self.vendedor.username}"
