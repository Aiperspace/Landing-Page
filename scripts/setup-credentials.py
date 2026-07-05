import os
import secrets
import base64
import json
import hmac
import hashlib
import re
import shutil

def generate_secret(length=32):
    return secrets.token_hex(length)

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def generate_jwt(payload: dict, secret: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    header_bytes = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    
    segments = [
        base64url_encode(header_bytes),
        base64url_encode(payload_bytes)
    ]
    
    signing_input = ".".join(segments).encode('utf-8')
    signature = hmac.new(secret.encode('utf-8'), signing_input, hashlib.sha256).digest()
    segments.append(base64url_encode(signature))
    
    return ".".join(segments)

# Paths relative to repository root
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ENV_FILE = os.path.join(REPO_ROOT, "ai_document_intelligence", ".env")
ENV_EXAMPLE = os.path.join(REPO_ROOT, "ai_document_intelligence", ".env.example")
FRONTEND_ENV_FILE = os.path.join(REPO_ROOT, "ai_document_intelligence", "frontend", ".env")
FRONTEND_ENV_EXAMPLE = os.path.join(REPO_ROOT, "ai_document_intelligence", "frontend", ".env.example")
SUPABASE_CONFIG = os.path.join(REPO_ROOT, "supabase-config.js")
KONG_CONFIG = os.path.join(REPO_ROOT, "ai_document_intelligence", "docker", "kong.yml")

def main():
    print("Generating secure credentials...")
    db_password = generate_secret(16)
    jwt_secret = generate_secret(32)
    
    # Payload for anon (expire in 2032/long term)
    anon_payload = {
        "iss": "supabase-demo",
        "role": "anon",
        "exp": 1983812996
    }
    # Payload for service_role
    service_payload = {
        "iss": "supabase-demo",
        "role": "service_role",
        "exp": 1983812996
    }
    
    anon_key = generate_jwt(anon_payload, jwt_secret)
    service_key = generate_jwt(service_payload, jwt_secret)
    
    print(f"Generated DB Password: {db_password[:4]}...{db_password[-4:]}")
    print(f"Generated JWT Secret: {jwt_secret[:4]}...{jwt_secret[-4:]}")
    print(f"Generated Anon Key: {anon_key[:10]}...{anon_key[-10:]}")
    
    # 1. Update/create ai_document_intelligence/.env
    if not os.path.exists(ENV_FILE):
        print(f"Creating {ENV_FILE} from example...")
        shutil.copy(ENV_EXAMPLE, ENV_FILE)
    
    with open(ENV_FILE, "r") as f:
        env_content = f.read()
    
    env_content = re.sub(r"POSTGRES_PASSWORD=.*", f"POSTGRES_PASSWORD={db_password}", env_content)
    env_content = re.sub(r"JWT_SECRET=.*", f"JWT_SECRET={jwt_secret}", env_content)
    env_content = re.sub(r"SUPABASE_ANON_KEY=.*", f"SUPABASE_ANON_KEY={anon_key}", env_content)
    env_content = re.sub(r"VITE_SUPABASE_ANON_KEY=.*", f"VITE_SUPABASE_ANON_KEY={anon_key}", env_content)
    
    with open(ENV_FILE, "w") as f:
        f.write(env_content)
    print(f"Updated {ENV_FILE}")
    
    # 2. Update/create ai_document_intelligence/frontend/.env
    if not os.path.exists(FRONTEND_ENV_FILE):
        print(f"Creating {FRONTEND_ENV_FILE} from example...")
        shutil.copy(FRONTEND_ENV_EXAMPLE, FRONTEND_ENV_FILE)
        
    with open(FRONTEND_ENV_FILE, "r") as f:
        f_env_content = f.read()
        
    # Replace keys
    f_env_content = re.sub(r"VITE_SUPABASE_URL=.*", "VITE_SUPABASE_URL=http://localhost:54321", f_env_content)
    f_env_content = re.sub(r"VITE_SUPABASE_ANON_KEY=.*", f"VITE_SUPABASE_ANON_KEY={anon_key}", f_env_content)
    f_env_content = re.sub(r"VITE_API_URL=.*", "VITE_API_URL=http://localhost:8000", f_env_content)
    
    with open(FRONTEND_ENV_FILE, "w") as f:
        f.write(f_env_content)
    print(f"Updated {FRONTEND_ENV_FILE}")
    
    # 3. Update supabase-config.js
    if os.path.exists(SUPABASE_CONFIG):
        with open(SUPABASE_CONFIG, "r") as f:
            cfg_content = f.read()
            
        # We want to replace var LOCAL_ANON_KEY = "..." and PROD_ANON_KEY = "..."
        # Replace occurrences, allowing potential newlines/whitespace
        cfg_content = re.sub(
            r'var LOCAL_ANON_KEY\s*=\s*\n?\s*["\']\S+["\']',
            f'var LOCAL_ANON_KEY = "{anon_key}"',
            cfg_content
        )
        cfg_content = re.sub(
            r'var PROD_ANON_KEY\s*=\s*\n?\s*["\']\S+["\']',
            f'var PROD_ANON_KEY = "{anon_key}"',
            cfg_content
        )
        
        with open(SUPABASE_CONFIG, "w") as f:
            f.write(cfg_content)
        print(f"Updated {SUPABASE_CONFIG}")
    else:
        print(f"Warning: {SUPABASE_CONFIG} not found!")

    # 4. Update kong.yml
    if os.path.exists(KONG_CONFIG):
        with open(KONG_CONFIG, "r") as f:
            kong_content = f.read()
            
        # Replace the keys under consumer usernames
        kong_content = re.sub(
            r'(-\s*username:\s*anon\s*\n\s*keyauth_credentials:\s*\n\s*-\s*key:\s*)\S+',
            rf'\1{anon_key}',
            kong_content
        )
        kong_content = re.sub(
            r'(-\s*username:\s*service_role\s*\n\s*keyauth_credentials:\s*\n\s*-\s*key:\s*)\S+',
            rf'\1{service_key}',
            kong_content
        )
        
        with open(KONG_CONFIG, "w") as f:
            f.write(kong_content)
        print(f"Updated {KONG_CONFIG}")
    else:
        print(f"Warning: {KONG_CONFIG} not found!")
        
    print("All credentials generated and files updated successfully!")

if __name__ == "__main__":
    main()
