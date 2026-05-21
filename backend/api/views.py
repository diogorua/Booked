from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.db.models import Count, Avg, Case, When, BooleanField, Q
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework import status
from .models import ClientProfile, Category, Book, Compra, Avaliacao, Reporte
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import ClientProfileSerializer, CategorySerializer, BookSerializer, CompraSerializer, AvaliacaoSerializer
from rest_framework.pagination import PageNumberPagination


@api_view(['POST'])
def signup(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    plano_escolhido = request.data.get('plano', 'Base')
    distrito = request.data.get('distrito', '')

    if not username or not password:
        return Response({'msg': 'Username e password são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'msg': 'Este username já existe'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)
    ClientProfile.objects.create(user=user, plano=plano_escolhido, distrito=distrito)
    login(request, user)

    return Response({'msg': f'Utilizador {user.username} criado com o plano {plano_escolhido}!'}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        return Response({'msg': 'Login efetuado com sucesso!'})
    else:
        return Response({'msg': 'Credenciais inválidas'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
def logout_view(request):
    logout(request)
    return Response({'msg': 'Logout efetuado com sucesso!'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_view(request):
    if request.user.is_staff:
        return Response({
            'username': request.user.username,
            'email': request.user.email,
            'role': 'Admin'
        })

    plano_atual = 'Base'
    if hasattr(request.user, 'clientprofile'):
        plano_atual = request.user.clientprofile.plano

    return Response({
        'username': request.user.username,
        'email': request.user.email,
        'role': 'Client',
        'plano': plano_atual
    })


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def profile_view(request):
    try:
        profile = ClientProfile.objects.get(user=request.user)
    except ClientProfile.DoesNotExist:
        return Response({'error': 'Perfil não encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = ClientProfileSerializer(profile)
        dados_perfil = serializer.data

        avaliacoes = request.user.avaliacoes_recebidas.all().order_by('-data_avaliacao')
        total_avaliacoes = avaliacoes.count()
        media_estrelas = 0
        vendedor_top = False

        if total_avaliacoes > 0:
            media_estrelas = sum([a.estrelas for a in avaliacoes]) / total_avaliacoes
            if total_avaliacoes >= 2 and media_estrelas >= 4.5:
                vendedor_top = True

        # Verifica se o próprio utilizador é premium para ver as suas avaliações detalhadas
        is_premium = profile.plano == 'Premium'
        dados_avaliacoes = []
        if is_premium:
            dados_avaliacoes = AvaliacaoSerializer(avaliacoes, many=True).data

        # Acrescentamos estes dados extra na resposta
        dados_perfil['media_estrelas'] = round(media_estrelas, 1)
        dados_perfil['total_avaliacoes'] = total_avaliacoes
        dados_perfil['vendedor_top'] = vendedor_top
        dados_perfil['is_premium_viewer'] = is_premium
        dados_perfil['avaliacoes'] = dados_avaliacoes

        return Response(dados_perfil)

    elif request.method == 'PUT':
        biografia = request.data.get('biografia', profile.biografia)
        distrito = request.data.get('distrito', profile.distrito)
        plano = request.data.get('plano', profile.plano)
        profile.biografia = biografia
        profile.distrito = distrito
        profile.plano = plano

        if 'imagem' in request.FILES:
            profile.imagem = request.FILES['imagem']

        profile.save()
        serializer = ClientProfileSerializer(profile)
        return Response(serializer.data)

@api_view(['GET'])
def categories_view(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
def books_list_view(request):
    if request.method == 'GET':
        print("Utilizador:", request.user)
        books = Book.objects.all().order_by('-data_publicacao')

        if request.user.is_authenticated:
            books = books.exclude(vendedor=request.user)

        books = books.filter(vendido=False)

        search = request.query_params.get('search', '')
        categoria = request.query_params.get('categoria', '')
        estado = request.query_params.get('estado', '')

        if search:
            books = books.filter(
                Q(titulo__icontains=search) | Q(autor__icontains=search)
            )
        if categoria:
            books = books.filter(categoria__id=categoria)
        if estado:
            books = books.filter(estado_conservacao=estado)

        books = books.annotate(
            num_avaliacoes=Count('vendedor__avaliacoes_recebidas'),
            media_estrelas=Avg('vendedor__avaliacoes_recebidas__estrelas')
        ).annotate(
            # Cria um campo temporário 'is_top' (True ou False)
            is_top=Case(
                When(Q(num_avaliacoes__gte=2) & Q(media_estrelas__gte=4.5), then=True),
                default=False,
                output_field=BooleanField()
            )
        ).order_by('-is_top', '-data_publicacao')

        paginator = PageNumberPagination()
        paginator.page_size = 12
        paginated_books = paginator.paginate_queryset(books, request)
        serializer = BookSerializer(paginated_books, many=True)
        return paginator.get_paginated_response(serializer.data)

    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'detail': 'Login obrigatório'}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = BookSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(vendedor=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticatedOrReadOnly])
def book_detail_view(request, pk):
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return Response({'error': 'Livro não encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if request.method in ['PUT', 'DELETE'] and book.vendedor != request.user:
        return Response({'error': 'Não tens permissão para alterar este anúncio.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        # Serve para o React carregar os dados atuais no formulário de edição
        serializer = BookSerializer(book)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = BookSerializer(book, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        book.delete()
        return Response({"msg": "Anúncio eliminado"}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def favoritos_view(request):
    if request.method == 'GET':
        # Devolve todos os livros que o utilizador marcou como favoritos
        livros = request.user.favoritos.all()
        serializer = BookSerializer(livros, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # Adiciona ou remove um livro dos favoritos (Toggle)
        book_id = request.data.get('book_id')
        try:
            book = Book.objects.get(id=book_id)
            if book in request.user.favoritos.all():
                request.user.favoritos.remove(book)
                return Response({"status": "removido"})
            else:
                request.user.favoritos.add(book)
                return Response({"status": "adicionado"})
        except Book.DoesNotExist:
            return Response({"error": "Livro não encontrado"}, status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_books_view(request):
    books = Book.objects.filter(vendedor=request.user).order_by('-data_publicacao')
    serializer = BookSerializer(books, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticatedOrReadOnly])
def public_profile_view(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'Utilizador não encontrado'}, status=status.HTTP_404_NOT_FOUND)

    try:
        profile = ClientProfile.objects.get(user=user)
        imagem = profile.imagem.url if profile.imagem else None
        biografia = profile.biografia
        distrito = profile.distrito
    except ClientProfile.DoesNotExist:
        imagem = None
        biografia = ""
        distrito = ""

    books = Book.objects.filter(vendedor=user, vendido=False).order_by('-data_publicacao')
    books_serializer = BookSerializer(books, many=True)

    avaliacoes = user.avaliacoes_recebidas.all().order_by('-data_avaliacao')
    total_avaliacoes = avaliacoes.count()
    media_estrelas = 0
    vendedor_top = False

    if total_avaliacoes > 0:
        media_estrelas = sum([a.estrelas for a in avaliacoes]) / total_avaliacoes
        if total_avaliacoes >= 2 and media_estrelas >= 4.5:
            vendedor_top = True

    is_premium = False
    if request.user.is_authenticated:
        if hasattr(request.user, 'clientprofile'):
            is_premium = request.user.clientprofile.plano == 'Premium'
        elif request.user.is_superuser:
            is_premium = True

    dados_avaliacoes = []
    if is_premium:
        dados_avaliacoes = AvaliacaoSerializer(avaliacoes, many=True).data

    return Response({
        'username': user.username,
        'imagem': imagem,
        'biografia': biografia,
        'distrito': distrito,
        'date_joined': user.date_joined.strftime("%d/%m/%Y"),
        'livros': books_serializer.data,

        'media_estrelas': round(media_estrelas, 1),
        'total_avaliacoes': total_avaliacoes,
        'vendedor_top': vendedor_top,
        'is_premium_viewer': is_premium,
        'avaliacoes': dados_avaliacoes
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comprar_view(request, pk):
    try:
        book = Book.objects.get(pk=pk)
    except Book.DoesNotExist:
        return Response({'error': 'Livro não encontrado'}, status=status.HTTP_404_NOT_FOUND)

    if book.vendido:
        return Response({'error': 'Este livro já foi vendido'}, status=status.HTTP_400_BAD_REQUEST)

    if book.vendedor == request.user:
        return Response({'error': 'Não podes comprar o teu próprio livro'}, status=status.HTTP_400_BAD_REQUEST)

    # Marca o livro como vendido e regista a compra
    book.vendido = True
    book.save()
    Compra.objects.create(comprador=request.user, livro=book)

    return Response({'msg': 'Compra realizada com sucesso!'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def minhas_compras_view(request):
    compras = Compra.objects.filter(comprador=request.user).order_by('-data_compra')
    serializer = CompraSerializer(compras, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def criar_avaliacao_view(request):
    vendedor_id = request.data.get('vendedor_id')
    estrelas = request.data.get('estrelas')
    comentario = request.data.get('comentario', '')
    compra_id = request.data.get('compra_id')

    if not vendedor_id or not estrelas:
        return Response({'error': 'Dados incompletos.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        vendedor = User.objects.get(id=vendedor_id)
    except User.DoesNotExist:
        return Response({'error': 'Vendedor não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    try:
        compra = Compra.objects.get(id=compra_id, comprador=request.user)
    except Compra.DoesNotExist:
        return Response({'error': 'Compra não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    if compra.avaliada:
        return Response({'error': 'Já avaliaste este negócio anteriormente.'}, status=status.HTTP_400_BAD_REQUEST)

    Avaliacao.objects.create(
        avaliador=request.user,
        avaliado=vendedor,
        estrelas=int(estrelas),
        comentario=comentario
    )

    compra.avaliada = True
    compra.save()

    return Response({'msg': 'Avaliação submetida com sucesso!'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_dashboard_view(request):
    total_users = User.objects.count()
    total_livros = Book.objects.count()
    livros_vendidos = Book.objects.filter(vendido=True).count()
    livros_ativos = Book.objects.filter(vendido=False).count()
    total_compras = Compra.objects.count()

    categorias_stats = Category.objects.annotate(num_livros=Count('book')).values('name', 'num_livros')

    all_users = User.objects.all().order_by('-date_joined')
    users_data = []
    for u in all_users:
        plano = 'Base'
        if hasattr(u, 'clientprofile'):
            plano = u.clientprofile.plano
        elif u.is_superuser:
            plano = 'Admin'
        users_data.append({
            'id': u.id, 'username': u.username, 'email': u.email, 'plano': plano,
            'data_registo': u.date_joined.strftime("%d/%m/%Y"), 'is_admin': u.is_superuser
        })

    all_books = Book.objects.all().order_by('-data_publicacao')
    books_data = []
    for b in all_books:
        books_data.append({
            'id': b.id, 'titulo': b.titulo, 'vendedor': b.vendedor.username,
            'preco': b.preco, 'estado': b.estado_conservacao, 'vendido': b.vendido
        })

    denuncias_pendentes = Reporte.objects.filter(resolvido=False).order_by('-data_criacao')
    reportes_data = []
    for r in denuncias_pendentes:
        reportes_data.append({
            'id': r.id,
            'denunciante': r.denunciante.username,
            'tipo': r.tipo,
            'alvo_id': r.alvo_id,
            'alvo_nome': r.alvo_nome,
            'motivo': r.motivo,
            'descricao': r.descricao,
            'data': r.data_criacao.strftime("%d/%m/%Y %H:%M")
        })

    return Response({
        'estatisticas': {
            'total_users': total_users, 'total_livros': total_livros,
            'livros_vendidos': livros_vendidos, 'livros_ativos': livros_ativos, 'total_compras': total_compras,
        },
        'categorias': list(categorias_stats),
        'utilizadores': users_data,
        'livros': books_data,
        'denuncias': reportes_data
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_delete_item_view(request, item_type, item_id):
    if item_type == 'user':
        try:
            user_to_delete = User.objects.get(id=item_id)
            if user_to_delete.is_superuser:
                return Response({'error': 'Não podes eliminar um administrador.'}, status=status.HTTP_400_BAD_REQUEST)
            user_to_delete.delete()
            return Response({'msg': 'Utilizador eliminado com sucesso.'})
        except User.DoesNotExist:
            return Response({'error': 'Utilizador não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    elif item_type == 'book':
        try:
            book_to_delete = Book.objects.get(id=item_id)
            book_to_delete.delete()
            return Response({'msg': 'Anúncio eliminado com sucesso.'})
        except Book.DoesNotExist:
            return Response({'error': 'Livro não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    return Response({'error': 'Tipo inválido.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def criar_reporte_view(request):
    tipo = request.data.get('tipo') # 'livro' ou 'perfil'
    alvo_id = request.data.get('alvo_id')
    alvo_nome = request.data.get('alvo_nome')
    motivo = request.data.get('motivo')
    descricao = request.data.get('descricao', '')

    if not tipo or not alvo_id or not motivo or not alvo_nome:
        return Response({'error': 'Dados incompletos para efetuar denúncia.'}, status=status.HTTP_400_BAD_REQUEST)

    Reporte.objects.create(
        denunciante=request.user,
        tipo=tipo,
        alvo_id=int(alvo_id),
        alvo_nome=alvo_nome,
        motivo=motivo,
        descricao=descricao
    )
    return Response({'msg': 'Denúncia registada. A equipa de moderação vai analisar.'}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_resolver_reporte_view(request, pk):
    try:
        reporte = Reporte.objects.get(pk=pk)
        reporte.resolvido = True
        reporte.save()
        return Response({'msg': 'Denúncia marcada como resolvida.'})
    except Reporte.DoesNotExist:
        return Response({'error': 'Denúncia não encontrada.'}, status=status.HTTP_404_NOT_FOUND)