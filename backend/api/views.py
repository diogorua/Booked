from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ClientProfile


@api_view(['POST'])
def signup(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    plano_escolhido = request.data.get('plano', 'Base')

    if not username or not password:
        return Response({'msg': 'Username e password são obrigatórios'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'msg': 'Este username já existe'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password)

    ClientProfile.objects.create(user=user, plano=plano_escolhido)

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