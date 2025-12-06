from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    """Application settings and configuration."""
    
    # API Settings
    api_v1_prefix: str = "/api/v1"
    project_name: str = "CodeCollab API"
    version: str = "1.0.0"
    
    # CORS Settings
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
    ]
    
    # Session Settings
    session_id_length: int = 8
    max_users_per_session: int = 10
    session_timeout_minutes: int = 60
    
    # Code Execution Settings
    code_execution_timeout_seconds: int = 5
    max_code_length: int = 10000
    
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False
    )


settings = Settings()
