def search(request):
    return User.objects.raw("SELECT * FROM auth_user WHERE username = '" + request.GET["u"] + "'")
