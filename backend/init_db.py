"""Initialize database without using flask db commands"""
import os
from app import create_app
from app.extensions import db

def init_database():
    """Initialize the database"""
    app = create_app()

    with app.app_context():
        # Create all tables
        db.create_all()
        print("✓ 数据库表已创建")

        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"✓ 已创建 {len(tables)} 个表:")
        for table in tables:
            print(f"  - {table}")

if __name__ == '__main__':
    init_database()
