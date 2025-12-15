@echo off
echo ========================================
echo Starting MLM Property Backend Server
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo Creating .env file...
    (
        echo # Database
        echo DATABASE_URL="postgresql://user:password@localhost:5432/mlm_property_db?schema=public"
        echo.
        echo # JWT
        echo JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
        echo JWT_EXPIRE="7d"
        echo.
        echo # Server
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # CORS
        echo FRONTEND_URL="http://localhost:3000"
    ) > .env
    echo .env file created!
    echo.
    echo IMPORTANT: Please edit .env file and update DATABASE_URL with your PostgreSQL credentials!
    echo.
    pause
)

echo Starting server...
echo.
npm run dev

