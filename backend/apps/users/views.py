from django.contrib.auth import login, logout
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


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
