from django.http import JsonResponse


def pricing_preview_view(request):
    return JsonResponse({"status": "ok", "result": "placeholder"})
