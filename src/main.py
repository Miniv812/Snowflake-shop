from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from src.database import engine, Base, SessionLocal
from src.models.models import ProductModel, CategoryModel, UserModel
from src.api.catalog import router as catalog_router
from src.api.orders import router as orders_router
from src.api.auth import router as auth_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Інтернет-магазин Сніжинка")

app.include_router(catalog_router)
app.include_router(orders_router)
app.include_router(auth_router)

if not os.path.exists("static"):
    os.makedirs("static")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

@app.on_event("startup")
def seed_db():
    db = SessionLocal()
    
    # 1. Створення Адміністратора за замовчуванням
    admin = db.query(UserModel).filter(UserModel.email == "admin@admin.ua").first()
    if not admin:
        admin_user = UserModel(
            email="admin@admin.ua",
            password_hash="admin",
            full_name="Головний Адміністратор",
            role="Admin"
        )
        db.add(admin_user)
        db.commit()

    if db.query(ProductModel).count() == 0:
        cat_jackets = CategoryModel(name="Куртки та пуховики", description="Теплий верхній одяг")
        cat_boots = CategoryModel(name="Взуття та чоботи", description="Зимове взуття та дутики")
        cat_underwear = CategoryModel(name="Термобілизна", description="Комплекти та білизна з шерсті мериноса")
        cat_pants = CategoryModel(name="Зимові штани", description="Лижні та утеплені штани")
        cat_hats = CategoryModel(name="Шапки та головні убори", description="Шапки, вушанки та капори")
        cat_accessories = CategoryModel(name="Аксесуари", description="Рукавиці, шарфи та термоустілки")

        db.add_all([cat_jackets, cat_boots, cat_underwear, cat_pants, cat_hats, cat_accessories])
        db.commit()

        demo_products = [
            # --- КУРТКИ ---
            ProductModel(category_id=cat_jackets.id, name="Зимовий пуховик 'Арктика'", description="Гусячий пух 90%, вологозахисна тканина", price=4500.0, material="Гусячий пух / Поліестер", color="Темно-синій, Чорний, Графіт", temp_min=-30, size_grid="M, L, XL", stock_quantity=15),
            ProductModel(category_id=cat_jackets.id, name="Парка 'Сніжна буря'", description="Тепла парка з хутряним коміром", price=3800.0, material="Холлофайбер / Бавовна", color="Хакі, Бежевий, Чорний", temp_min=-20, size_grid="S, M, L", stock_quantity=8),
            ProductModel(category_id=cat_jackets.id, name="Куртка-анорак 'Alpine Pro'", description="Мембранна куртка для гірськолижного спорту", price=3200.0, material="Мембрана Gore-Tex", color="Червоний, Синій, Чорний", temp_min=-15, size_grid="S, M, L, XL", stock_quantity=12),
            ProductModel(category_id=cat_jackets.id, name="Подовжений пуховик 'FrostShield'", description="Захист від екстремальних морозів", price=5200.0, material="Качкиний пух / Нейлон", color="Чорний, Бордовий, Смарагдовий", temp_min=-35, size_grid="M, L", stock_quantity=5),
            ProductModel(category_id=cat_jackets.id, name="Зимова куртка 'Nordic Expedition'", description="Посилена куртка з вітрозахисною спідницею", price=4100.0, material="Тінсулейт / Поліестер", color="Сірий, Темно-зелений", temp_min=-25, size_grid="S, M, L, XL", stock_quantity=10),
            ProductModel(category_id=cat_jackets.id, name="Пуховик-ковдра 'OverSize Blanket'", description="Об'ємний стиль та максимальне тепло", price=4800.0, material="Біо-пух / Нейлон", color="Молочний, Чорний, Сріблястий", temp_min=-25, size_grid="S-M, L-XL", stock_quantity=7), # +1
            ProductModel(category_id=cat_jackets.id, name="Зимовий жилет 'Thermal Vest'", description="Утеплений жилет для активних рухів", price=2100.0, material="Холлофайбер", color="Чорний, Жовтий, Синій", temp_min=-10, size_grid="S, M, L", stock_quantity=14), # +2

            # --- ВЗУТТЯ ТА ЧОБОТИ ---
            ProductModel(category_id=cat_boots.id, name="Зимові чоботи 'Yukon Waterproof'", description="Водонепроникні чоботи з підкладкою з вовни", price=3600.0, material="Натуральна шкіра / Вовна", color="Коричневий, Чорний", temp_min=-30, size_grid="40, 41, 42, 43, 44", stock_quantity=14),
            ProductModel(category_id=cat_boots.id, name="Черевики 'Tundra Fleece'", description="Легкі та теплі черевики на флісі", price=2900.0, material="Замша / Фліс", color="Бежевий, Рудий, Чорний", temp_min=-20, size_grid="38, 39, 40, 41", stock_quantity=9),
            ProductModel(category_id=cat_boots.id, name="Термочоботи 'SnowStorm Tech'", description="Для зимової риболовлі та активного відпочинку", price=4200.0, material="EVA / Поліуретан", color="Оливковий, Чорний", temp_min=-35, size_grid="41, 42, 43, 45", stock_quantity=6),
            ProductModel(category_id=cat_boots.id, name="Шкіряні черевики 'Boreal'", description="Класичні черевики з товстою підошвою", price=3100.0, material="Натуральна шкіра / Хутро", color="Чорний, Коричневий", temp_min=-15, size_grid="39, 40, 41, 42", stock_quantity=11),
            ProductModel(category_id=cat_boots.id, name="Чоботи-дутики 'Alaska Warm'", description="М'які непромокаючі дутики", price=2400.0, material="Нейлон / Овеча вовна", color="Білий, Чорний, Срібний", temp_min=-25, size_grid="37, 38, 39, 40", stock_quantity=18),
            ProductModel(category_id=cat_boots.id, name="Зимові кросівки 'CrossWinter GTX'", description="Спортивне взуття з мембраною", price=3500.0, material="Нубук / Gore-Tex", color="Чорний, Синій, Графіт", temp_min=-15, size_grid="40, 41, 42, 43, 44", stock_quantity=10), # +3

            # --- ТЕРМОБІЛИЗНА ---
            ProductModel(category_id=cat_underwear.id, name="Комплект термобілизни 'Nordic'", description="Двошарова термобілизна з шерстю мериноса", price=1800.0, material="Шерсть мериноса 70%", color="Темно-сірий, Чорний", temp_min=-25, size_grid="S, M, L, XL", stock_quantity=20),
            ProductModel(category_id=cat_underwear.id, name="Термошорти 'WarmLayer'", description="Анатомічні термошорти", price=650.0, material="Поліестер / Еластан", color="Чорний", temp_min=-15, size_grid="M, L, XL", stock_quantity=25),
            ProductModel(category_id=cat_underwear.id, name="Комплект білизни 'Merino Extra'", description="Дуже тепла термобілизна для морозів", price=2100.0, material="Шерсть мериноса 100%", color="Бордовий, Чорний", temp_min=-30, size_grid="XS, S, M, L", stock_quantity=15),
            ProductModel(category_id=cat_underwear.id, name="Термободі 'WinterComfort'", description="Утеплене жіноче боді з мікрофлісом", price=1450.0, material="Мікрофліс / Бавовна", color="Бежевий, Чорний", temp_min=-20, size_grid="S, M, L", stock_quantity=12),
            ProductModel(category_id=cat_underwear.id, name="Термосорочка 'Thermal Pro'", description="Верхня частина з високим горлом", price=950.0, material="Поліестер / Фліс", color="Синій, Хакі, Чорний", temp_min=-25, size_grid="M, L, XL, XXL", stock_quantity=30),
            ProductModel(category_id=cat_underwear.id, name="Флісовий термокомплект 'MicroFleece Pro'", description="М'який комплект для високих навантажень", price=1600.0, material="Поларфліс 100%", color="Чорний, Синій, Графіт", temp_min=-20, size_grid="S, M, L, XL", stock_quantity=18), # +4

            # --- ЗИМОВІ ШТАНИ ---
            ProductModel(category_id=cat_pants.id, name="Лижні штани 'Alpine Snow'", description="Вітрозахисні штани зі знімними підтяжками", price=2700.0, material="Мембрана / Поліестер", color="Чорний, Яскраво-синій, Червоний", temp_min=-25, size_grid="S, M, L, XL", stock_quantity=16),
            ProductModel(category_id=cat_pants.id, name="Утеплені штани 'Urban Frost'", description="Міські штани прилеглого крою", price=1950.0, material="Бавовна / Фліс", color="Темно-синій, Чорний", temp_min=-15, size_grid="M, L, XL", stock_quantity=14),
            ProductModel(category_id=cat_pants.id, name="Напівкомбінезон 'Extreme SubZero'", description="Високий комбінезон для морозів", price=3400.0, material="Нейлон / Тінсулейт", color="Чорний, Хакі", temp_min=-35, size_grid="M, L, XL", stock_quantity=7),
            ProductModel(category_id=cat_pants.id, name="Тактичні штани 'Nordic Gaiter'", description="З інтегрованими снігозахисними гетрами", price=2300.0, material="Ripstop / Фліс", color="Койот, Олива, Чорний", temp_min=-20, size_grid="S, M, L, XL", stock_quantity=10),
            ProductModel(category_id=cat_pants.id, name="Утеплені джинси 'Thermal Denim'", description="Денім з прошарком мікрофлісу", price=1600.0, material="Джинс / Фліс", color="Темно-синій, Чорний", temp_min=-10, size_grid="30, 32, 34, 36", stock_quantity=22),
            ProductModel(category_id=cat_pants.id, name="Сноубордичні штани 'Freeride 360'", description="Широкий крій із захистом від промокання", price=3100.0, material="Мембрана 15000/15000", color="Жовтий, Чорний, Фіолетовий", temp_min=-20, size_grid="M, L, XL", stock_quantity=9), # +5

            # --- ШАПКИ ---
            ProductModel(category_id=cat_hats.id, name="Шапка-вушанка 'Siberian Fleece'", description="Класична вушанка з штучним хутром", price=750.0, material="Штучне хутро / Фліс", color="Сірий, Чорний, Білий", temp_min=-30, size_grid="M, L", stock_quantity=18),
            ProductModel(category_id=cat_hats.id, name="В'язана шапка 'Merino Wool Beanie'", description="Мінімалістична тепла шапка", price=550.0, material="Вовна мериноса 80%", color="Бордовий, Бежевий, Чорний, Синій", temp_min=-15, size_grid="Universal", stock_quantity=40),
            ProductModel(category_id=cat_hats.id, name="Шапка з мембраною 'Windproof Peak'", description="Непродувна шапка для трекінгу", price=680.0, material="Мембрана / Вовна", color="Чорний, Темно-зелений", temp_min=-25, size_grid="S/M, L/XL", stock_quantity=15),
            ProductModel(category_id=cat_hats.id, name="Капор-балаклава 'Storm Hood'", description="Захищає обличчя та шию", price=620.0, material="Фліс / Лайкра", color="Чорний, Хакі", temp_min=-20, size_grid="Universal", stock_quantity=25),
            ProductModel(category_id=cat_hats.id, name="Шапка флісова 'Nordic Light'", description="Легка та тепла спортивна шапка", price=420.0, material="Поларфліс", color="Синій, Чорний, Сірий", temp_min=-10, size_grid="Universal", stock_quantity=35),
            ProductModel(category_id=cat_hats.id, name="Балаклава-маска 'FrostMask Pro'", description="Спеціальні перфорації для легкого дихання", price=580.0, material="Неопрен / Фліс", color="Чорний, Графіт", temp_min=-25, size_grid="Universal", stock_quantity=20), # +6
            ProductModel(category_id=cat_hats.id, name="Теплий берет 'Parisian Winter'", description="Жіночий вовняний берет", price=690.0, material="Вовна 100%", color="Червоний, Пудровий, Чорний", temp_min=-10, size_grid="Universal", stock_quantity=12), # +7

            # --- АКСЕСУАРИ ---
            ProductModel(category_id=cat_accessories.id, name="Рукавиці лижні 'Gore-Tex Thermal'", description="Непромокаючі рукавиці з фіксатором", price=1100.0, material="Gore-Tex / Тінсулейт", color="Чорний, Червоний", temp_min=-30, size_grid="S, M, L", stock_quantity=13),
            ProductModel(category_id=cat_accessories.id, name="Шарф-хомут 'Polar Fleece Buff'", description="М'який бафф для шиї", price=450.0, material="Поларфліс 100%", color="Чорний, Сірий, Синій", temp_min=-20, size_grid="Universal", stock_quantity=30),
            ProductModel(category_id=cat_accessories.id, name="Термоустілки з підігрівом 'WarmSole'", description="Анатомічні устілки зі збереженням тепла", price=850.0, material="Вповщена вовна / Фольга", color="Сірий", temp_min=-35, size_grid="36-45", stock_quantity=50),
            ProductModel(category_id=cat_accessories.id, name="Валянки-рукавиці 'Merino Mittens'", description="Товсті шерстяні валянки", price=790.0, material="Вовна мериноса 100%", color="Білий, Сірий, Чорний", temp_min=-25, size_grid="S, M", stock_quantity=17),
            ProductModel(category_id=cat_accessories.id, name="Зимові шкарпетки (3 пари) 'Heavy Heat'", description="Комплект товстих трекінгових шкарпеток", price=480.0, material="Вовна / Акрил", color="Мікс кольорів", temp_min=-25, size_grid="39-42, 43-46", stock_quantity=45),
            ProductModel(category_id=cat_accessories.id, name="Дутий шарф 'Puffer Scarf'", description="Сучасний шарф з утеплювачем", price=720.0, material="Біо-пух / Нейлон", color="Чорний, Бежевий, Срібний", temp_min=-20, size_grid="Universal", stock_quantity=16), # +8
            ProductModel(category_id=cat_accessories.id, name="Терморукавиці сенсорні 'TouchGlove'", description="Дозволяють користуватися смартфоном", price=590.0, material="Фліс / Замша", color="Чорний, Темно-синій", temp_min=-15, size_grid="S, M, L", stock_quantity=25), # +9
            ProductModel(category_id=cat_accessories.id, name="Жилет з USB підігрівом 'SmartHeat'", description="Вбудовані нагрівальні елементи", price=1990.0, material="Нейлон / Карбонове волокно", color="Чорний", temp_min=-30, size_grid="M, L, XL", stock_quantity=8), # +10
        ]
        db.add_all(demo_products)
        db.commit()
    db.close()