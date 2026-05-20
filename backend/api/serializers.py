from rest_framework import serializers
from .models import ClientProfile, Book, Category, Compra


class ClientProfileSerializer(serializers.ModelSerializer):
    date_joined = serializers.DateTimeField(source='user.date_joined', format="%d/%m/%Y", read_only=True)

    class Meta:
        model = ClientProfile
        fields = ('id', 'user', 'plano', 'imagem', 'biografia', 'distrito', 'date_joined')
        read_only_fields = ['user']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name')

class BookSerializer(serializers.ModelSerializer):
    # Campos extra para mostrar o nome em vez do id no React
    vendedor_name = serializers.ReadOnlyField(source='vendedor.username')
    categoria_name = serializers.ReadOnlyField(source='categoria.name')

    class Meta:
        model = Book
        fields = (
            'id', 'titulo', 'autor', 'categoria', 'categoria_name',
            'estado_conservacao', 'preco', 'imagem_capa',
            'vendedor', 'vendedor_name', 'data_publicacao'
        )
        read_only_fields = ['vendedor']

class BookSerializer(serializers.ModelSerializer):
    vendedor_name = serializers.ReadOnlyField(source='vendedor.username')
    categoria_name = serializers.ReadOnlyField(source='categoria.name')

    class Meta:
        model = Book
        fields = (
            'id', 'titulo', 'autor', 'categoria', 'categoria_name',
            'estado_conservacao', 'preco', 'imagem_capa',
            'vendedor', 'vendedor_name', 'data_publicacao', 'vendido'  # ← vendido adicionado
        )
        read_only_fields = ['vendedor']

class CompraSerializer(serializers.ModelSerializer):
    livro = BookSerializer(read_only=True)
    data_compra = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = Compra
        fields = ('id', 'livro', 'data_compra')