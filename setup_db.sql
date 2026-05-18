CREATE USER "user" WITH PASSWORD 'password';
CREATE DATABASE twiniky OWNER "user";
GRANT ALL PRIVILEGES ON DATABASE twiniky TO "user";
\connect twiniky
GRANT ALL ON SCHEMA public TO "user";
