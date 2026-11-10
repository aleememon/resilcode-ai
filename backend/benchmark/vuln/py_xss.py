def profile(request):
    bio = mark_safe(request.POST["bio"])
    return HttpResponse("<h1>" + request.GET["name"] + "</h1>")
