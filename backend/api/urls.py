from django.urls import path
from . import views

urlpatterns = [
    path("api/signup/", views.signup, name="signup"),
    path("api/login/", views.login_view, name="login"),
    path("api/logout/", views.logout_view, name="logout"),
    path("api/user/", views.user_view, name="user"),
    path("api/profile/", views.profile_view, name="profile"),
    path("api/categories/", views.categories_view, name="categories"),
    path("api/books/", views.books_list_view, name="books_list"),
    path("api/books/<int:pk>/", views.book_detail_view, name="book_detail"),
    path('api/favorites/', views.favoritos_view, name='favorites')
]