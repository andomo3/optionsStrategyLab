from django.http import JsonResponse


def jobs_list_view(request):
    return JsonResponse({"status": "ok", "jobs": []})
