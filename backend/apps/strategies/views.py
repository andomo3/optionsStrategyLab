from django.http import JsonResponse


def strategies_list_view(request):
    return JsonResponse({"status": "ok", "data": []})
