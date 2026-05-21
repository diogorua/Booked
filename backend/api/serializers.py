from rest_framework import serializers
from .models import ClientProfile, Book, Category, Compra, Avaliacao


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

class AvaliacaoSerializer(serializers.ModelSerializer):
    avaliador_name = serializers.ReadOnlyField(source='avaliador.username')
    data_avaliacao = serializers.DateTimeField(format="%d/%m/%Y", read_only=True)

    class Meta:
        model = Avaliacao
        fields = ('id', 'avaliador_name', 'estrelas', 'comentario', 'data_avaliacao')

class BookSerializer(serializers.ModelSerializer):
    vendedor_name = serializers.ReadOnlyField(source='vendedor.username')
    categoria_name = serializers.ReadOnlyField(source='categoria.name')
    # Ao ler isto, vai invocar um metodo comecado por "get" que neste caso e o "get_vendedor_top" que faz o calculo para determinar se e vendedor top
    vendedor_top = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = (
            'id', 'titulo', 'autor', 'categoria', 'categoria_name',
            'estado_conservacao', 'preco', 'imagem_capa',
            'vendedor', 'vendedor_name', 'data_publicacao', 'vendido', 'vendedor_top'
        )
        read_only_fields = ['vendedor']

    def get_vendedor_top(self, obj):
        avaliacoes = obj.vendedor.avaliacoes_recebidas.all()
        total = avaliacoes.count()
        if total >= 2:
            media = sum([a.estrelas for a in avaliacoes]) / total
            return media >= 4.5
        return False

class CompraSerializer(serializers.ModelSerializer):
    livro = BookSerializer(read_only=True)
    data_compra = serializers.DateTimeField(format="%d/%m/%Y %H:%M", read_only=True)

    class Meta:
        model = Compra
        fields = ('id', 'livro', 'data_compra', 'avaliada')