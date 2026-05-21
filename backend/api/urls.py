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
    path('api/favorites/', views.favoritos_view, name='favorites'),
    path("api/my-books/", views.my_books_view, name="my_books"),
    path("api/profile/<str:username>/", views.public_profile_view, name="public_profile"),
    path("api/books/<int:pk>/buy/", views.comprar_view, name="comprar"),
    path("api/my-purchases/", views.minhas_compras_view, name="minhas_compras"),
    path("api/reviews/", views.criar_avaliacao_view, name="criar_avaliacao"),
    path("api/admin-dashboard/", views.admin_dashboard_view, name="admin_dashboard"),
    path("api/admin-delete/<str:item_type>/<int:item_id>/", views.admin_delete_item_view, name="admin_delete"),
    path("api/reports/", views.criar_reporte_view, name="criar_reporte"),
    path("api/reports/<int:pk>/resolve/", views.admin_resolver_reporte_view, name="resolver_reporte")
]