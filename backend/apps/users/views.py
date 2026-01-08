from django.conf import settings
from django.contrib.auth import authenticate, get_user_model, login, logout
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from strategies.models import Strategy

User = get_user_model()


class AuthStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user and request.user.is_authenticated:
            return Response(
                {
                    "authenticated": True,
                    "username": request.user.get_username(),
                },
                status=status.HTTP_200_OK,
            )
        return Response({"authenticated": False}, status=status.HTTP_200_OK)


class SessionLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        if not username or not password:
            return Response(
                {"errors": {"detail": "Username and password are required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response(
                {"errors": {"detail": "Invalid credentials."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        login(request, user)
        return Response({"authenticated": True}, status=status.HTTP_200_OK)


class SessionLogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"authenticated": False}, status=status.HTTP_200_OK)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        if not username or not password:
            return Response(
                {"errors": {"detail": "Username and password are required."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {"errors": {"detail": "Username already exists."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = User.objects.create_user(username=username, password=password)
        refresh = RefreshToken.for_user(user)
        return Response(
            {"access": str(refresh.access_token), "refresh": str(refresh)},
            status=status.HTTP_201_CREATED,
        )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {"id": request.user.id, "username": request.user.get_username()},
            status=status.HTTP_200_OK,
        )


class DemoLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = getattr(settings, "DEMO_USERNAME", "demo")
        password = getattr(settings, "DEMO_PASSWORD", "demo1234")
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response(
                {"errors": {"detail": "Demo user not available."}},
                status=status.HTTP_404_NOT_FOUND,
            )
        refresh = RefreshToken.for_user(user)
        strategy_id = (
            Strategy.objects.filter(owner=user).order_by("id").values_list("id", flat=True).first()
        )
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "strategy_id": strategy_id,
            },
            status=status.HTTP_200_OK,
        )
