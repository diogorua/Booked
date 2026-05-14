from rest_framework import serializers
from .models import ClientProfile, Book, Category


class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = ('id', 'user', 'plano', 'imagem')

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name')

class BookSerializer(serializers.ModelSerializer):
    # Campos extra para mostrar o nome em vez do id no React
    vendedor_name = serializers.ReadOnlyField(source='vendedor.username')
    categoria_name = serializers.ReadOnlyField(source='categoria.nome')

    class Meta:
        model = Book
        fields = (
            'id', 'titulo', 'autor', 'categoria', 'categoria_name',
            'estado_conservacao', 'preco', 'imagem_capa',
            'vendedor', 'vendedor_name', 'data_publicacao'
        )
        read_only_fields = ['vendedor']