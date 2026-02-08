"""
Migration script to add new columns to accounts table
Adds: initial_balance, is_active, created_at, updated_at
"""
from sqlalchemy import text
from app.database import engine, SessionLocal
from app.models import Account

def migrate_accounts():
    """Add new columns to accounts table"""
    db = SessionLocal()

    try:
        print("🔄 Starting migration for accounts table...")

        # Add initial_balance column
        print("  ➤ Adding initial_balance column...")
        db.execute(text("""
            ALTER TABLE accounts
            ADD COLUMN IF NOT EXISTS initial_balance REAL DEFAULT 0.0
        """))

        # Add is_active column
        print("  ➤ Adding is_active column...")
        db.execute(text("""
            ALTER TABLE accounts
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
        """))

        # Add created_at column
        print("  ➤ Adding created_at column...")
        db.execute(text("""
            ALTER TABLE accounts
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        """))

        # Add updated_at column
        print("  ➤ Adding updated_at column...")
        db.execute(text("""
            ALTER TABLE accounts
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        """))

        db.commit()
        print("  ✅ New columns added successfully!")

        # Migrate existing data: set initial_balance = current balance
        print("\n🔄 Migrating existing data...")
        print("  ➤ Setting initial_balance = balance for existing accounts...")

        result = db.execute(text("""
            UPDATE accounts
            SET initial_balance = balance
            WHERE initial_balance = 0.0 OR initial_balance IS NULL
        """))

        db.commit()
        print(f"  ✅ Updated {result.rowcount} existing accounts with initial_balance")

        # Show summary
        print("\n📊 Migration Summary:")
        total_accounts = db.execute(text("SELECT COUNT(*) FROM accounts")).scalar()
        active_accounts = db.execute(text("SELECT COUNT(*) FROM accounts WHERE is_active = TRUE")).scalar()

        print(f"  • Total accounts: {total_accounts}")
        print(f"  • Active accounts: {active_accounts}")
        print(f"  • Inactive accounts: {total_accounts - active_accounts}")

        print("\n✨ Migration completed successfully!")

    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_accounts()
