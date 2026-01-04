from django.http import JsonResponse


def market_data_view(request):
    return JsonResponse({"status": "ok", "data": []})
