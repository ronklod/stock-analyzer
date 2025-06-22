#!/usr/bin/env python3
"""
Migration script to add is_admin column to users table and set the admin user
"""
import sqlite3
import os
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    # Get the path to the database file
    db_path = Path(__file__).parent.parent / 'watchlist.db'
    logger.info(f"Using database at: {db_path}")
    
    if not db_path.exists():
        logger.error(f"Database file not found at {db_path}")
        return
    
    try:
        # Connect to the SQLite database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if is_admin column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        column_names = [column[1] for column in columns]
        
        if 'is_admin' not in column_names:
            logger.info("Adding is_admin column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0")
            conn.commit()
            logger.info("Successfully added is_admin column")
        else:
            logger.info("is_admin column already exists")
        
        # Set ronklod@gmail.com as admin
        admin_email = "ronklod@gmail.com"
        logger.info(f"Setting {admin_email} as admin...")
        cursor.execute("UPDATE users SET is_admin = 1 WHERE email = ?", (admin_email,))
        
        if cursor.rowcount == 0:
            logger.warning(f"User {admin_email} not found in the database")
        else:
            logger.info(f"Successfully set {admin_email} as admin")
        
        conn.commit()
        conn.close()
        logger.info("Migration completed successfully")
        
    except Exception as e:
        logger.error(f"Error during migration: {str(e)}")

if __name__ == "__main__":
    main()
