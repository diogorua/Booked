from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ClientProfile, Category, Book, Compra
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import ClientProfileSerializer, CategorySerializer, BookSerializer, CompraSerializer
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

    ClientProfile.objects.create(user=user, plano=plano_escolhido)

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
@parser_classes([MultiPartParser])
def profile_view(request):
    try:
        profile = ClientProfile.objects.get(user=request.user)
    except ClientProfile.DoesNotExist:
        profile = ClientProfile.objects.create(user=request.user)

    if request.method == 'GET':
        serializer = ClientProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ClientProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({'msg': 'Perfil atualizado!'})
        return Response({'msg': 'Erro ao atualizar'}, status=status.HTTP_400_BAD_REQUEST)

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
@permission_classes([IsAuthenticated])
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
def public_profile_view(request, username):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'Utilizador não encontrado'}, status=status.HTTP_404_NOT_FOUND)

    imagem = None
    biografia = ''
    distrito = ''
    if hasattr(user, 'clientprofile'):
        profile = user.clientprofile
        if profile.imagem:
            imagem = request.build_absolute_uri(profile.imagem.url)
        biografia = profile.biografia
        distrito = profile.distrito

    books = Book.objects.filter(vendedor=user, vendido=False).order_by('-data_publicacao')
    books_serializer = BookSerializer(books, many=True)

    return Response({
        'username': user.username,
        'imagem': imagem,
        'biografia': biografia,
        'distrito': distrito,
        'date_joined': user.date_joined.strftime("%d/%m/%Y"),
        'livros': books_serializer.data
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