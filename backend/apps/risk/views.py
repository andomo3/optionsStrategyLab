from django.http import JsonResponse


def risk_scenario_view(request):
    return JsonResponse({"status": "ok", "result": "placeholder"})
