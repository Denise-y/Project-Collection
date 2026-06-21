-- IntelliSched MySQL 8.0 initialization script
-- Run as root or a user with CREATE DATABASE privilege:
--   mysql -u root -p < Backend/scripts/init_mysql.sql
-- Or in MySQL CLI: source /path/to/init_mysql.sql

-- 1. Create database (if not exists)
CREATE DATABASE IF NOT EXISTS intellisched
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE intellisched;

-- 2. (Optional) Create dedicated app user instead of using root
-- Replace 'your_password' with a strong password, then set DB_USER/DB_PASSWORD in .env
-- CREATE USER IF NOT EXISTS 'intellisched'@'localhost' IDENTIFIED BY 'your_password';
-- GRANT ALL PRIVILEGES ON intellisched.* TO 'intellisched'@'localhost';
-- FLUSH PRIVILEGES;

-- Tables are created automatically on app startup (SQLAlchemy Base.metadata.create_all).
