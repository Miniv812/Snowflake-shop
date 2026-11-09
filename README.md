# Інтернет-магазин теплого одягу «Сніжинка»

## Опис проєкту
Вебзастосунок для онлайн-вітрини та продажу теплого одягу (куртки, пуховики, термобілизна) із можливістю фільтрації за температурним режимом та матеріалом.

## Стек технологій
* **Backend**: Python (FastAPI)
* **Database**: PostgreSQL / SQLAlchemy
* **Frontend**: HTML5, CSS3, JavaScript
* **VCS**: Git / GitHub

## Структура коду
* `/src/models` — моделі бази даних PostgreSQL
* `/src/schemas` — схеми валідації Pydantic
* `/src/api` — контролери REST API
* `/tests` — модульні та системні тести

## Розподіл ролей
* **Чмуленко В.Д. (Full-Stack Developer / QA)**: Розробка backend/frontend коду, проєктування архітектури та написання тестів.

## Інструкція із запуску
1. Клонувати репозиторій: `git clone https://github.com/Miniv812/Snowflake-shop.git`
2. Встановити залежності: `pip install -r requirements.txt`
3. Запустити сервер: `uvicorn src.main:app --reload`