from sqlalchemy import create_engine, text
import os
import sqlite3

print("Starting database migration...")

# Check if database exists
db_path = "./watchlist.db"
print(f"Looking for database at: {os.path.abspath(db_path)}")
if not os.path.exists(db_path):
    print("Database file not found. No migration needed.")
    exit(0)

# Connect to the database
print("Connecting to database...")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Step 1: Check if user_id column already exists
print("Checking for user_id column...")
cursor.execute("PRAGMA table_info(watchlist)")
columns = [row[1] for row in cursor.fetchall()]

if "user_id" not in columns:
    print("Adding user_id column to watchlist table...")
    cursor.execute("ALTER TABLE watchlist ADD COLUMN user_id INTEGER")
    print("user_id column added.")
else:
    print("user_id column already exists.")

# Step 2: Remove the unique constraint on the symbol column
print("Checking for unique constraint on symbol column...")
cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='watchlist'")
table_def = cursor.fetchone()[0]
print(f"Table definition: {table_def}")

# Drop the unique index on symbol if it exists
print("Checking for indexes...")
cursor.execute("SELECT name FROM sqlite_master WHERE type='index'")
indexes = [row[0] for row in cursor.fetchall()]
print(f"Found indexes: {indexes}")

# Step 3: Check for watchlist items without a user_id and assign them to the first user
print("Checking for watchlist items without a user_id...")
cursor.execute("SELECT COUNT(*) FROM watchlist WHERE user_id IS NULL")
null_user_count = cursor.fetchone()[0]

if null_user_count > 0:
    print(f"Found {null_user_count} watchlist items without a user_id")
    
    # Check if we have any users
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    
    if user_count > 0:
        # Get the first user's ID
        cursor.execute("SELECT id FROM users ORDER BY id LIMIT 1")
        first_user_id = cursor.fetchone()[0]
        
        print(f"Assigning null user_id items to user with ID {first_user_id}")
        cursor.execute("UPDATE watchlist SET user_id = ? WHERE user_id IS NULL", (first_user_id,))
        print(f"Updated {null_user_count} watchlist items")
    else:
        # Create a default user if none exists
        print("No users found. Creating a default user...")
        cursor.execute("""
            INSERT INTO users (email, hashed_password, is_active, display_name, created_at) 
            VALUES ('default@example.com', NULL, 1, 'Default User', CURRENT_TIMESTAMP)
        """)
        default_user_id = cursor.lastrowid
        
        print(f"Assigning null user_id items to default user with ID {default_user_id}")
        cursor.execute("UPDATE watchlist SET user_id = ? WHERE user_id IS NULL", (default_user_id,))
        print(f"Updated {null_user_count} watchlist items")
else:
    print("No watchlist items without a user_id found.")

if "ix_watchlist_symbol" in indexes:
    print("Dropping unique index on symbol...")
    
    # First, create a backup of the data
    print("Creating backup of watchlist data...")
    cursor.execute("CREATE TABLE watchlist_backup AS SELECT * FROM watchlist")
    
    # Drop the original table
    print("Dropping original table...")
    cursor.execute("DROP TABLE watchlist")
    
    # Create new table without unique constraint on symbol
    print("Creating new table without unique constraint...")
    cursor.execute("""
        CREATE TABLE watchlist (
            id INTEGER NOT NULL, 
            symbol VARCHAR, 
            company_name VARCHAR, 
            added_date DATETIME, 
            notes VARCHAR,
            user_id INTEGER, 
            PRIMARY KEY (id)
        )
    """)
    
    # Create index on symbol that's not unique
    print("Creating non-unique index on symbol...")
    cursor.execute("CREATE INDEX ix_watchlist_symbol ON watchlist (symbol)")
    cursor.execute("CREATE INDEX ix_watchlist_id ON watchlist (id)")
    cursor.execute("CREATE INDEX ix_watchlist_user_id ON watchlist (user_id)")
    
    # Restore the data
    print("Restoring data...")
    cursor.execute("""
        INSERT INTO watchlist (id, symbol, company_name, added_date, notes, user_id)
        SELECT id, symbol, company_name, added_date, notes, user_id FROM watchlist_backup
    """)
    
    # Drop the backup table
    print("Dropping backup table...")
    cursor.execute("DROP TABLE watchlist_backup")
    
    print("Unique constraint removed successfully.")
else:
    print("No unique constraint on symbol found.")

# Commit and close connection
conn.commit()
conn.close()
print("Migration complete!")
