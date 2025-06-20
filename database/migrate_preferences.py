#!/usr/bin/env python3
"""
Migration script to add user preferences table
"""

import os
import sys
import inspect
current_dir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

from sqlalchemy import create_engine, inspect
from database.models import Base, UserPreference

def run_migration():
    """Run the migration to add user preferences table"""
    
    # Get database URL from environment or use default
    database_url = os.getenv("DATABASE_URL", "sqlite:///./watchlist.db")
    
    # Create engine
    engine = create_engine(database_url)
    
    # Check if table already exists
    inspector = inspect(engine)
    if "user_preferences" in inspector.get_table_names():
        print("UserPreference table already exists")
        return
    
    # Create the table
    print("Creating user_preferences table...")
    try:
        UserPreference.__table__.create(engine)
        print("Successfully created user_preferences table")
    except Exception as e:
        print(f"Error creating user_preferences table: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_migration()
