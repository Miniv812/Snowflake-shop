"""
Модуль доменних винятків сервісного шару.
Дозволяє відділити бізнес-логіку від HTTP-протоколу та фреймворку FastAPI
відповідно до принципу інверсії залежностей (Dependency Inversion Principle).
"""


# Базова помилка бізнес-логіки або некоректних вхідних даних (перетворюється на HTTP 400)
class ServiceError(Exception):
    pass


# Помилка автентифікації облікових даних користувача (перетворюється на HTTP 401)
class UnauthorizedError(ServiceError):
    pass


# Помилка недостатніх прав доступу до операції (перетворюється на HTTP 403)
class ForbiddenError(ServiceError):
    pass


# Помилка відсутності запитуваного запису в базі даних (перетворюється на HTTP 404)
class NotFoundError(ServiceError):
    pass