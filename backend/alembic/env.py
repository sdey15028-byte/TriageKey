import os
from alembic import context
from sqlalchemy import engine_from_config, pool
config = context.config
database_url = os.environ.get("DATABASE_DIRECT_URL") or config.get_main_option("sqlalchemy.url")
if database_url.startswith("postgresql+asyncpg"):
    database_url = database_url.replace("postgresql+asyncpg", "postgresql+psycopg", 1)


def run_migrations_offline():
    context.configure(url=database_url, literal_binds=True)
    context.run_migrations()


def run_migrations_online():
    section = config.get_section(config.config_ini_section)
    section["sqlalchemy.url"] = database_url
    with engine_from_config(section, prefix="sqlalchemy.", poolclass=pool.NullPool).connect() as connection:
        context.configure(connection=connection)
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
