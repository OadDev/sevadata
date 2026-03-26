from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Query, Header, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import requests

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'seva-default-secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Object Storage Config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "seva-sms"
storage_key = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create the main app
app = FastAPI(title="SEVA Shelter Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ==================== STORAGE FUNCTIONS ====================

def init_storage():
    """Initialize object storage - call once at startup"""
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Storage initialized successfully")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str) -> tuple:
    """Download file from storage"""
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ==================== PYDANTIC MODELS ====================

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "user"

class UserLogin(BaseModel):
    email: str
    password: str
    device_id: str
    device_name: str = "Unknown Device"

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    role: str
    is_blocked: bool = False
    blocked_reason: Optional[str] = None
    created_at: str

class CaseCreate(BaseModel):
    animal_name: Optional[str] = None
    animal_type: str
    gender: Optional[str] = None
    age: Optional[str] = None
    rescue_date: str
    rescue_time: Optional[str] = None
    rescue_location: str
    area: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_contact: Optional[str] = None
    condition: Optional[str] = None
    condition_notes: Optional[str] = None
    case_type: str = "Rescue Case"
    status: str = "Rescued (Status Pending)"
    current_shelter: Optional[str] = None
    arrival_date_seva: Optional[str] = None
    sterilisation_status: str = "Not Required"

class CaseUpdate(BaseModel):
    animal_name: Optional[str] = None
    animal_type: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[str] = None
    rescue_date: Optional[str] = None
    rescue_time: Optional[str] = None
    rescue_location: Optional[str] = None
    area: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_contact: Optional[str] = None
    condition: Optional[str] = None
    condition_notes: Optional[str] = None
    case_type: Optional[str] = None
    status: Optional[str] = None
    current_shelter: Optional[str] = None
    arrival_date_seva: Optional[str] = None
    sterilisation_status: Optional[str] = None

class CaseResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    case_id: str
    animal_name: Optional[str] = None
    animal_type: str
    gender: Optional[str] = None
    age: Optional[str] = None
    rescue_date: str
    rescue_time: Optional[str] = None
    rescue_location: str
    area: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_contact: Optional[str] = None
    condition: Optional[str] = None
    condition_notes: Optional[str] = None
    case_type: str
    status: str
    current_shelter: Optional[str] = None
    arrival_date_seva: Optional[str] = None
    sterilisation_status: str
    images: List[Dict[str, Any]] = []
    videos: List[Dict[str, Any]] = []
    is_deleted: bool = False
    created_by: Optional[str] = None
    created_by_name: Optional[str] = None
    created_at: str
    updated_at: str

class VetCheckupCreate(BaseModel):
    case_id: str
    checkup_date: str
    vet_name: str
    notes: Optional[str] = None
    next_followup_date: Optional[str] = None

class VetCheckupUpdate(BaseModel):
    checkup_date: Optional[str] = None
    vet_name: Optional[str] = None
    notes: Optional[str] = None
    next_followup_date: Optional[str] = None
    followup_completed: Optional[bool] = None

class VetCheckupResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    case_id: str
    checkup_date: str
    vet_name: str
    notes: Optional[str] = None
    next_followup_date: Optional[str] = None
    followup_completed: bool = False
    attachments: List[Dict[str, Any]] = []
    prescription: Optional[Dict[str, Any]] = None
    created_at: str

class SterilisationCreate(BaseModel):
    case_id: str
    sterilisation_date: str
    gender: str
    location: str
    vet_name: str
    notes: Optional[str] = None

class SterilisationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    case_id: str
    sterilisation_date: str
    gender: str
    location: str
    vet_name: str
    notes: Optional[str] = None
    photos: List[Dict[str, Any]] = []
    videos: List[Dict[str, Any]] = []
    created_at: str

class MovementCreate(BaseModel):
    case_id: str
    from_location: str
    to_location: str
    date: str
    reason: str
    custom_reason: Optional[str] = None

class MovementResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    case_id: str
    from_location: str
    to_location: str
    date: str
    reason: str
    custom_reason: Optional[str] = None
    created_at: str

class SpecialNoteCreate(BaseModel):
    case_id: str
    note: str

class SpecialNoteResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    case_id: str
    note: str
    created_by: str
    created_at: str

class VetNameCreate(BaseModel):
    name: str
    specialization: Optional[str] = None
    contact: Optional[str] = None

class VetNameResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    specialization: Optional[str] = None
    contact: Optional[str] = None
    is_active: bool = True
    created_at: str

class SterilisationLocationCreate(BaseModel):
    name: str
    address: Optional[str] = None

class SterilisationLocationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    address: Optional[str] = None
    is_active: bool = True
    created_at: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, device_id: str) -> str:
    payload = {
        "user_id": user_id,
        "device_id": device_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        device_id = payload.get("device_id")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        if user.get("is_blocked"):
            raise HTTPException(status_code=403, detail=f"Your account has been blocked: {user.get('blocked_reason', 'Multiple device login detected')}")
        
        # Check if session is valid
        session = await db.sessions.find_one({"user_id": user_id, "device_id": device_id, "is_active": True}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=401, detail="Session expired or invalid")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def log_audit(user_id: str, action: str, details: str):
    await db.audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "details": details,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "role": user.role,
        "is_blocked": False,
        "blocked_reason": None,
        "blocked_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("password")
    return UserResponse(**user_doc)

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail=f"Your ID has been blocked because {user.get('blocked_reason', 'multiple device login was detected')}. Please contact admin.")
    
    # Check for existing active sessions on different devices (Admin users bypass this check)
    if user.get("role") != "admin":
        existing_session = await db.sessions.find_one({
            "user_id": user["id"],
            "is_active": True,
            "device_id": {"$ne": login_data.device_id}
        }, {"_id": 0})
        
        if existing_session:
            # Block user for multiple device login
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {
                    "is_blocked": True,
                    "blocked_reason": "Multiple device login detected",
                    "blocked_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            # Deactivate all sessions
            await db.sessions.update_many(
                {"user_id": user["id"]},
                {"$set": {"is_active": False}}
            )
            await log_audit(user["id"], "USER_BLOCKED", "Blocked due to multiple device login attempt")
            raise HTTPException(status_code=403, detail="Your ID has been blocked because multiple device login was detected. Please contact admin.")
    
    # For admin users, just deactivate old sessions without blocking
    if user.get("role") == "admin":
        await db.sessions.update_many(
            {"user_id": user["id"]},
            {"$set": {"is_active": False}}
        )
    
    # Deactivate any existing session on same device
    await db.sessions.update_many(
        {"user_id": user["id"], "device_id": login_data.device_id},
        {"$set": {"is_active": False}}
    )
    
    # Create new session
    session_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "device_id": login_data.device_id,
        "device_name": login_data.device_name,
        "is_active": True,
        "login_time": datetime.now(timezone.utc).isoformat()
    }
    await db.sessions.insert_one(session_doc)
    
    token = create_token(user["id"], login_data.device_id)
    await log_audit(user["id"], "LOGIN", f"Logged in from {login_data.device_name}")
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@api_router.post("/auth/logout")
async def logout(user: dict = Depends(get_current_user)):
    await db.sessions.update_many(
        {"user_id": user["id"]},
        {"$set": {"is_active": False}}
    )
    await log_audit(user["id"], "LOGOUT", "User logged out")
    return {"message": "Logged out successfully"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(**user)

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@api_router.put("/auth/change-password")
async def change_password(password_data: PasswordChange, user: dict = Depends(get_current_user)):
    # Get user with password
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user_doc["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    new_hashed = hash_password(password_data.new_password)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password": new_hashed}}
    )
    
    await log_audit(user["id"], "PASSWORD_CHANGED", "User changed their password")
    return {"message": "Password changed successfully"}

# ==================== USER MANAGEMENT (Admin) ====================

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(admin: dict = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.put("/users/{user_id}/unblock")
async def unblock_user(user_id: str, admin: dict = Depends(require_admin)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_blocked": False, "blocked_reason": None, "blocked_at": None}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    await log_audit(admin["id"], "USER_UNBLOCKED", f"Unblocked user {user_id}")
    return {"message": "User unblocked successfully"}

@api_router.put("/users/{user_id}/block")
async def block_user(user_id: str, reason: str = "Blocked by admin", admin: dict = Depends(require_admin)):
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "is_blocked": True,
            "blocked_reason": reason,
            "blocked_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    # Deactivate all sessions
    await db.sessions.update_many({"user_id": user_id}, {"$set": {"is_active": False}})
    await log_audit(admin["id"], "USER_BLOCKED", f"Blocked user {user_id}: {reason}")
    return {"message": "User blocked successfully"}

@api_router.delete("/users/{user_id}/sessions")
async def force_logout_user(user_id: str, admin: dict = Depends(require_admin)):
    await db.sessions.update_many({"user_id": user_id}, {"$set": {"is_active": False}})
    await log_audit(admin["id"], "FORCE_LOGOUT", f"Force logged out user {user_id}")
    return {"message": "User sessions cleared"}

@api_router.get("/sessions")
async def get_active_sessions(admin: dict = Depends(require_admin)):
    sessions = await db.sessions.find({"is_active": True}, {"_id": 0}).to_list(1000)
    # Enrich with user info
    for session in sessions:
        user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0, "password": 0})
        session["user"] = user
    return sessions

# ==================== VET NAMES MANAGEMENT (Admin) ====================

@api_router.post("/vet-names", response_model=VetNameResponse)
async def create_vet_name(vet: VetNameCreate, admin: dict = Depends(require_admin)):
    vet_doc = {
        "id": str(uuid.uuid4()),
        **vet.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vet_names.insert_one(vet_doc)
    return VetNameResponse(**vet_doc)

@api_router.get("/vet-names", response_model=List[VetNameResponse])
async def get_vet_names(user: dict = Depends(get_current_user)):
    vets = await db.vet_names.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return [VetNameResponse(**v) for v in vets]

@api_router.delete("/vet-names/{vet_id}")
async def delete_vet_name(vet_id: str, admin: dict = Depends(require_admin)):
    result = await db.vet_names.update_one(
        {"id": vet_id},
        {"$set": {"is_active": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Vet not found")
    return {"message": "Vet removed successfully"}

# ==================== STERILISATION LOCATIONS MANAGEMENT (Admin) ====================

@api_router.post("/sterilisation-locations", response_model=SterilisationLocationResponse)
async def create_sterilisation_location(location: SterilisationLocationCreate, admin: dict = Depends(require_admin)):
    loc_doc = {
        "id": str(uuid.uuid4()),
        **location.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sterilisation_locations.insert_one(loc_doc)
    return SterilisationLocationResponse(**loc_doc)

@api_router.get("/sterilisation-locations", response_model=List[SterilisationLocationResponse])
async def get_sterilisation_locations(user: dict = Depends(get_current_user)):
    locations = await db.sterilisation_locations.find({"is_active": True}, {"_id": 0}).to_list(1000)
    return [SterilisationLocationResponse(**l) for l in locations]

@api_router.delete("/sterilisation-locations/{location_id}")
async def delete_sterilisation_location(location_id: str, admin: dict = Depends(require_admin)):
    result = await db.sterilisation_locations.update_one(
        {"id": location_id},
        {"$set": {"is_active": False}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location removed successfully"}

# ==================== CASE ENDPOINTS ====================

async def generate_case_id():
    count = await db.cases.count_documents({})
    return f"SEVA-{datetime.now().year}-{str(count + 1).zfill(5)}"

@api_router.post("/cases", response_model=CaseResponse)
async def create_case(case: CaseCreate, user: dict = Depends(get_current_user)):
    case_id = await generate_case_id()
    now = datetime.now(timezone.utc).isoformat()
    
    case_doc = {
        "id": str(uuid.uuid4()),
        "case_id": case_id,
        **case.model_dump(),
        "images": [],
        "videos": [],
        "is_deleted": False,
        "deleted_by": None,
        "deleted_at": None,
        "created_by": user["id"],
        "created_by_name": user.get("name", "Unknown"),
        "created_at": now,
        "updated_at": now
    }
    await db.cases.insert_one(case_doc)
    await log_audit(user["id"], "CASE_CREATED", f"Created case {case_id}")
    return CaseResponse(**case_doc)

@api_router.get("/cases", response_model=List[CaseResponse])
async def get_cases(
    status: Optional[str] = None,
    condition: Optional[str] = None,
    case_type: Optional[str] = None,
    shelter: Optional[str] = None,
    sterilisation_status: Optional[str] = None,
    search: Optional[str] = None,
    date_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    
    if status:
        query["status"] = status
    if condition:
        query["condition"] = condition
    if case_type:
        query["case_type"] = case_type
    if shelter:
        query["current_shelter"] = shelter
    if sterilisation_status:
        query["sterilisation_status"] = sterilisation_status
    if search:
        query["$or"] = [
            {"case_id": {"$regex": search, "$options": "i"}},
            {"animal_name": {"$regex": search, "$options": "i"}},
            {"rescue_location": {"$regex": search, "$options": "i"}}
        ]
    
    # Date filtering
    now = datetime.now(timezone.utc)
    if date_filter:
        if date_filter == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            query["rescue_date"] = start.strftime("%Y-%m-%d")
        elif date_filter == "yesterday":
            yesterday = now - timedelta(days=1)
            query["rescue_date"] = yesterday.strftime("%Y-%m-%d")
        elif date_filter == "last7days":
            start = (now - timedelta(days=7)).strftime("%Y-%m-%d")
            query["rescue_date"] = {"$gte": start}
        elif date_filter == "last30days":
            start = (now - timedelta(days=30)).strftime("%Y-%m-%d")
            query["rescue_date"] = {"$gte": start}
    elif date_from and date_to:
        query["rescue_date"] = {"$gte": date_from, "$lte": date_to}
    elif date_from:
        query["rescue_date"] = {"$gte": date_from}
    elif date_to:
        query["rescue_date"] = {"$lte": date_to}
    
    cases = await db.cases.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [CaseResponse(**c) for c in cases]

@api_router.get("/cases/count")
async def get_cases_count(
    status: Optional[str] = None,
    condition: Optional[str] = None,
    case_type: Optional[str] = None,
    shelter: Optional[str] = None,
    sterilisation_status: Optional[str] = None,
    search: Optional[str] = None,
    date_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {"is_deleted": False}
    
    if status:
        query["status"] = status
    if condition:
        query["condition"] = condition
    if case_type:
        query["case_type"] = case_type
    if shelter:
        query["current_shelter"] = shelter
    if sterilisation_status:
        query["sterilisation_status"] = sterilisation_status
    if search:
        query["$or"] = [
            {"case_id": {"$regex": search, "$options": "i"}},
            {"animal_name": {"$regex": search, "$options": "i"}},
            {"rescue_location": {"$regex": search, "$options": "i"}}
        ]
    
    # Date filtering
    now = datetime.now(timezone.utc)
    if date_filter:
        if date_filter == "today":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            query["rescue_date"] = start.strftime("%Y-%m-%d")
        elif date_filter == "yesterday":
            yesterday = now - timedelta(days=1)
            query["rescue_date"] = yesterday.strftime("%Y-%m-%d")
        elif date_filter == "last7days":
            start = (now - timedelta(days=7)).strftime("%Y-%m-%d")
            query["rescue_date"] = {"$gte": start}
        elif date_filter == "last30days":
            start = (now - timedelta(days=30)).strftime("%Y-%m-%d")
            query["rescue_date"] = {"$gte": start}
    elif date_from and date_to:
        query["rescue_date"] = {"$gte": date_from, "$lte": date_to}
    elif date_from:
        query["rescue_date"] = {"$gte": date_from}
    elif date_to:
        query["rescue_date"] = {"$lte": date_to}
    
    count = await db.cases.count_documents(query)
    return {"count": count}

@api_router.get("/cases/{case_id}", response_model=CaseResponse)
async def get_case(case_id: str, user: dict = Depends(get_current_user)):
    case = await db.cases.find_one({"id": case_id, "is_deleted": False}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return CaseResponse(**case)

@api_router.put("/cases/{case_id}", response_model=CaseResponse)
async def update_case(case_id: str, case_update: CaseUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in case_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.cases.update_one(
        {"id": case_id, "is_deleted": False},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case = await db.cases.find_one({"id": case_id}, {"_id": 0})
    await log_audit(user["id"], "CASE_UPDATED", f"Updated case {case['case_id']}")
    return CaseResponse(**case)

@api_router.delete("/cases/{case_id}")
async def delete_case(case_id: str, user: dict = Depends(require_admin)):
    result = await db.cases.update_one(
        {"id": case_id},
        {"$set": {
            "is_deleted": True,
            "deleted_by": user["id"],
            "deleted_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case = await db.cases.find_one({"id": case_id}, {"_id": 0})
    await log_audit(user["id"], "CASE_DELETED", f"Soft deleted case {case['case_id']}")
    return {"message": "Case deleted successfully"}

# ==================== CASE MEDIA UPLOAD ====================

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp", "mp4": "video/mp4",
    "mov": "video/quicktime", "avi": "video/x-msvideo", "pdf": "application/pdf"
}

@api_router.post("/cases/{case_id}/images")
async def upload_case_image(
    case_id: str, 
    file: UploadFile = File(...), 
    description: str = Query(..., description="Description/note for the image"),
    user: dict = Depends(get_current_user)
):
    case = await db.cases.find_one({"id": case_id, "is_deleted": False}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/cases/{case_id}/images/{file_id}.{ext}"
    data = await file.read()
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    
    result = put_object(path, data, content_type)
    
    image_doc = {
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "description": description,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "uploaded_by": user["id"],
        "uploaded_by_name": user.get("name", "Unknown"),
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cases.update_one(
        {"id": case_id},
        {"$push": {"images": image_doc}}
    )
    
    return image_doc

@api_router.post("/cases/{case_id}/videos")
async def upload_case_video(
    case_id: str, 
    file: UploadFile = File(...), 
    description: str = Query(..., description="Description/note for the video"),
    user: dict = Depends(get_current_user)
):
    case = await db.cases.find_one({"id": case_id, "is_deleted": False}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/cases/{case_id}/videos/{file_id}.{ext}"
    data = await file.read()
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    
    result = put_object(path, data, content_type)
    
    video_doc = {
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "description": description,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "uploaded_by": user["id"],
        "uploaded_by_name": user.get("name", "Unknown"),
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.cases.update_one(
        {"id": case_id},
        {"$push": {"videos": video_doc}}
    )
    
    return video_doc

@api_router.get("/files/{path:path}")
async def download_file(path: str, authorization: str = Header(None), auth: str = Query(None)):
    auth_header = authorization or (f"Bearer {auth}" if auth else None)
    if not auth_header:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        token = auth_header.replace("Bearer ", "")
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception as e:
        logger.error(f"File download error: {e}")
        raise HTTPException(status_code=404, detail="File not found")

# ==================== VET CHECKUP ENDPOINTS ====================

@api_router.post("/vet-checkups", response_model=VetCheckupResponse)
async def create_vet_checkup(checkup: VetCheckupCreate, user: dict = Depends(get_current_user)):
    case = await db.cases.find_one({"id": checkup.case_id, "is_deleted": False}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    checkup_doc = {
        "id": str(uuid.uuid4()),
        **checkup.model_dump(),
        "followup_completed": False,
        "attachments": [],
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vet_checkups.insert_one(checkup_doc)
    await log_audit(user["id"], "VET_CHECKUP_CREATED", f"Created vet checkup for case {case['case_id']}")
    return VetCheckupResponse(**checkup_doc)

@api_router.get("/vet-checkups", response_model=List[VetCheckupResponse])
async def get_vet_checkups(case_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if case_id:
        query["case_id"] = case_id
    checkups = await db.vet_checkups.find(query, {"_id": 0}).sort("checkup_date", -1).to_list(1000)
    return [VetCheckupResponse(**c) for c in checkups]

@api_router.put("/vet-checkups/{checkup_id}", response_model=VetCheckupResponse)
async def update_vet_checkup(checkup_id: str, checkup_update: VetCheckupUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in checkup_update.model_dump().items() if v is not None}
    
    result = await db.vet_checkups.update_one(
        {"id": checkup_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Checkup not found")
    
    checkup = await db.vet_checkups.find_one({"id": checkup_id}, {"_id": 0})
    await log_audit(user["id"], "VET_CHECKUP_UPDATED", f"Updated vet checkup {checkup_id}")
    return VetCheckupResponse(**checkup)

@api_router.post("/vet-checkups/{checkup_id}/attachments")
async def upload_checkup_attachment(checkup_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    checkup = await db.vet_checkups.find_one({"id": checkup_id}, {"_id": 0})
    if not checkup:
        raise HTTPException(status_code=404, detail="Vet checkup not found")
    
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    path = f"{APP_NAME}/vet_checkups/{checkup_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    
    result = put_object(path, data, content_type)
    
    attachment_doc = {
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "uploaded_by": user["id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vet_checkups.update_one(
        {"id": checkup_id},
        {"$push": {"attachments": attachment_doc}}
    )
    
    return attachment_doc

@api_router.post("/vet-checkups/{checkup_id}/prescription")
async def upload_checkup_prescription(checkup_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    checkup = await db.vet_checkups.find_one({"id": checkup_id}, {"_id": 0})
    if not checkup:
        raise HTTPException(status_code=404, detail="Vet checkup not found")
    
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    path = f"{APP_NAME}/vet_checkups/{checkup_id}/prescription_{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    
    result = put_object(path, data, content_type)
    
    prescription_doc = {
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "uploaded_by": user["id"],
        "uploaded_by_name": user.get("name", "Unknown"),
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.vet_checkups.update_one(
        {"id": checkup_id},
        {"$set": {"prescription": prescription_doc}}
    )
    
    return prescription_doc

# ==================== STERILISATION ENDPOINTS ====================

@api_router.post("/sterilisations", response_model=SterilisationResponse)
async def create_sterilisation(sterilisation: SterilisationCreate, user: dict = Depends(get_current_user)):
    case = await db.cases.find_one({"id": sterilisation.case_id, "is_deleted": False}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    sterilisation_doc = {
        "id": str(uuid.uuid4()),
        **sterilisation.model_dump(),
        "photos": [],
        "videos": [],
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.sterilisations.insert_one(sterilisation_doc)
    
    # Update case sterilisation status
    await db.cases.update_one(
        {"id": sterilisation.case_id},
        {"$set": {"sterilisation_status": "Completed", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await log_audit(user["id"], "STERILISATION_CREATED", f"Created sterilisation record for case {case['case_id']}")
    return SterilisationResponse(**sterilisation_doc)

@api_router.get("/sterilisations", response_model=List[SterilisationResponse])
async def get_sterilisations(case_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if case_id:
        query["case_id"] = case_id
    sterilisations = await db.sterilisations.find(query, {"_id": 0}).sort("sterilisation_date", -1).to_list(1000)
    return [SterilisationResponse(**s) for s in sterilisations]

class SterilisationUpdate(BaseModel):
    sterilisation_date: Optional[str] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    vet_name: Optional[str] = None
    notes: Optional[str] = None

@api_router.put("/sterilisations/{sterilisation_id}", response_model=SterilisationResponse)
async def update_sterilisation(sterilisation_id: str, sterilisation_update: SterilisationUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in sterilisation_update.model_dump().items() if v is not None}
    
    result = await db.sterilisations.update_one(
        {"id": sterilisation_id},
        {"$set": update_data}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sterilisation record not found")
    
    sterilisation = await db.sterilisations.find_one({"id": sterilisation_id}, {"_id": 0})
    await log_audit(user["id"], "STERILISATION_UPDATED", f"Updated sterilisation record {sterilisation_id}")
    return SterilisationResponse(**sterilisation)

@api_router.post("/sterilisations/{sterilisation_id}/photos")
async def upload_sterilisation_photo(sterilisation_id: str, file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    sterilisation = await db.sterilisations.find_one({"id": sterilisation_id}, {"_id": 0})
    if not sterilisation:
        raise HTTPException(status_code=404, detail="Sterilisation record not found")
    
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    path = f"{APP_NAME}/sterilisation/{sterilisation_id}/{uuid.uuid4()}.{ext}"
    data = await file.read()
    content_type = MIME_TYPES.get(ext, file.content_type or "application/octet-stream")
    
    result = put_object(path, data, content_type)
    
    photo_doc = {
        "id": str(uuid.uuid4()),
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "uploaded_by": user["id"],
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.sterilisations.update_one(
        {"id": sterilisation_id},
        {"$push": {"photos": photo_doc}}
    )
    
    return photo_doc

# ==================== MOVEMENT TRACKING ====================

@api_router.post("/movements", response_model=MovementResponse)
async def create_movement(movement: MovementCreate, user: dict = Depends(get_current_user)):
    case = await db.cases.find_one({"id": movement.case_id, "is_deleted": False}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    movement_doc = {
        "id": str(uuid.uuid4()),
        **movement.model_dump(),
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.movements.insert_one(movement_doc)
    
    # Update case current shelter
    await db.cases.update_one(
        {"id": movement.case_id},
        {"$set": {"current_shelter": movement.to_location, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await log_audit(user["id"], "MOVEMENT_CREATED", f"Recorded movement for case {case['case_id']}")
    return MovementResponse(**movement_doc)

@api_router.get("/movements", response_model=List[MovementResponse])
async def get_movements(case_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if case_id:
        query["case_id"] = case_id
    movements = await db.movements.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return [MovementResponse(**m) for m in movements]

# ==================== SPECIAL NOTES ====================

@api_router.post("/special-notes", response_model=SpecialNoteResponse)
async def create_special_note(note: SpecialNoteCreate, user: dict = Depends(get_current_user)):
    case = await db.cases.find_one({"id": note.case_id, "is_deleted": False}, {"_id": 0})
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    note_doc = {
        "id": str(uuid.uuid4()),
        **note.model_dump(),
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.special_notes.insert_one(note_doc)
    await log_audit(user["id"], "SPECIAL_NOTE_CREATED", f"Added special note for case {case['case_id']}")
    return SpecialNoteResponse(**note_doc)

@api_router.get("/special-notes", response_model=List[SpecialNoteResponse])
async def get_special_notes(case_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {}
    if case_id:
        query["case_id"] = case_id
    notes = await db.special_notes.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [SpecialNoteResponse(**n) for n in notes]

# ==================== NOTIFICATIONS / FOLLOWUP REMINDERS ====================

@api_router.get("/notifications/followups")
async def get_followup_notifications(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")
    tomorrow = (now + timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Get all pending followups
    pending_checkups = await db.vet_checkups.find({
        "next_followup_date": {"$exists": True, "$ne": None, "$ne": ""},
        "followup_completed": {"$ne": True}
    }, {"_id": 0}).to_list(1000)
    
    notifications = []
    
    for checkup in pending_checkups:
        case = await db.cases.find_one({"id": checkup["case_id"], "is_deleted": False}, {"_id": 0})
        if not case:
            continue
        
        followup_date = checkup.get("next_followup_date")
        if not followup_date:
            continue
        
        animal_name = case.get("animal_name") or case.get("animal_type", "Unknown")
        case_id = case.get("case_id")
        
        notification = {
            "checkup_id": checkup["id"],
            "case_id": case["id"],
            "case_number": case_id,
            "animal_name": animal_name,
            "followup_date": followup_date,
            "type": "followup"
        }
        
        if followup_date == today:
            notification["urgency"] = "today"
            notification["message"] = f"{animal_name} ({case_id}) has a followup checkup today."
        elif followup_date == tomorrow:
            notification["urgency"] = "tomorrow"
            notification["message"] = f"{animal_name} ({case_id}) has a followup checkup tomorrow."
        elif followup_date < today:
            notification["urgency"] = "overdue"
            notification["message"] = f"{animal_name} ({case_id}) has an overdue followup checkup."
        else:
            notification["urgency"] = "upcoming"
            notification["message"] = f"{animal_name} ({case_id}) has a followup checkup on {followup_date}."
        
        notifications.append(notification)
    
    # Sort by urgency (overdue first, then today, then tomorrow, then upcoming)
    urgency_order = {"overdue": 0, "today": 1, "tomorrow": 2, "upcoming": 3}
    notifications.sort(key=lambda x: (urgency_order.get(x["urgency"], 4), x["followup_date"]))
    
    return notifications

@api_router.put("/notifications/followups/{checkup_id}/complete")
async def mark_followup_complete(checkup_id: str, user: dict = Depends(get_current_user)):
    result = await db.vet_checkups.update_one(
        {"id": checkup_id},
        {"$set": {"followup_completed": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Checkup not found")
    return {"message": "Followup marked as complete"}

# ==================== DASHBOARD METRICS ====================

@api_router.get("/dashboard/metrics")
async def get_dashboard_metrics(user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    
    # Case counts
    total_cases = await db.cases.count_documents({"is_deleted": False})
    total_active = await db.cases.count_documents({"is_deleted": False, "status": {"$nin": ["Released", "Adopted", "Deceased"]}})
    new_today = await db.cases.count_documents({"is_deleted": False, "created_at": {"$gte": today_start}})
    new_month = await db.cases.count_documents({"is_deleted": False, "created_at": {"$gte": month_start}})
    
    # Status counts
    in_seva = await db.cases.count_documents({"is_deleted": False, "current_shelter": "SEVA Shelter"})
    in_govt = await db.cases.count_documents({"is_deleted": False, "current_shelter": "Government Shelter"})
    in_private = await db.cases.count_documents({"is_deleted": False, "current_shelter": "Private Shelter"})
    
    under_observation = await db.cases.count_documents({"is_deleted": False, "status": "Under Observation"})
    released = await db.cases.count_documents({"is_deleted": False, "status": "Released"})
    permanent = await db.cases.count_documents({"is_deleted": False, "status": "Permanent Resident"})
    adopted = await db.cases.count_documents({"is_deleted": False, "status": "Adopted"})
    deceased = await db.cases.count_documents({"is_deleted": False, "status": "Deceased"})
    
    # Condition counts
    critical = await db.cases.count_documents({"is_deleted": False, "condition": "Critical"})
    injured = await db.cases.count_documents({"is_deleted": False, "condition": "Injury"})
    sick = await db.cases.count_documents({"is_deleted": False, "condition": "Sick"})
    
    # Sterilisation counts
    total_sterilised = await db.sterilisations.count_documents({})
    sterilised_month = await db.sterilisations.count_documents({"created_at": {"$gte": month_start}})
    pending_sterilisation = await db.cases.count_documents({"is_deleted": False, "sterilisation_status": "Pending"})
    
    # Gender breakdown for sterilisations
    male_sterilised = await db.sterilisations.count_documents({"gender": "Male"})
    female_sterilised = await db.sterilisations.count_documents({"gender": "Female"})
    
    # Vet checkups - followups due
    today = now.strftime("%Y-%m-%d")
    followups_due = await db.vet_checkups.count_documents({
        "next_followup_date": {"$lte": today},
        "followup_completed": {"$ne": True}
    })
    
    return {
        "cases": {
            "total": total_cases,
            "total_active": total_active,
            "new_today": new_today,
            "new_month": new_month,
            "critical": critical,
            "injured": injured,
            "sick": sick
        },
        "shelters": {
            "seva": in_seva,
            "govt": in_govt,
            "private": in_private
        },
        "outcomes": {
            "under_observation": under_observation,
            "released": released,
            "permanent_resident": permanent,
            "adopted": adopted,
            "deceased": deceased
        },
        "sterilisation": {
            "total": total_sterilised,
            "this_month": sterilised_month,
            "pending": pending_sterilisation,
            "male": male_sterilised,
            "female": female_sterilised
        },
        "medical": {
            "followups_due": followups_due
        }
    }

@api_router.get("/dashboard/charts")
async def get_dashboard_charts(user: dict = Depends(get_current_user)):
    # Get rescue trends for last 7 days
    now = datetime.now(timezone.utc)
    rescue_trends = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        day_end = (day + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        count = await db.cases.count_documents({
            "is_deleted": False,
            "created_at": {"$gte": day_start, "$lt": day_end}
        })
        rescue_trends.append({
            "date": day.strftime("%b %d"),
            "count": count
        })
    
    # Status distribution
    statuses = ["Rescued (Status Pending)", "In Govt Shelter", "In SEVA Shelter", "Under Observation", "Released", "Adopted", "Deceased"]
    status_distribution = []
    for status in statuses:
        count = await db.cases.count_documents({"is_deleted": False, "status": status})
        if count > 0:
            status_distribution.append({"status": status, "count": count})
    
    # Animal type distribution
    pipeline = [
        {"$match": {"is_deleted": False}},
        {"$group": {"_id": "$animal_type", "count": {"$sum": 1}}}
    ]
    animal_types = await db.cases.aggregate(pipeline).to_list(100)
    animal_distribution = [{"type": a["_id"], "count": a["count"]} for a in animal_types]
    
    return {
        "rescue_trends": rescue_trends,
        "status_distribution": status_distribution,
        "animal_distribution": animal_distribution
    }

# ==================== AUDIT LOGS ====================

@api_router.get("/audit-logs")
async def get_audit_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    limit: int = 100,
    admin: dict = Depends(require_admin)
):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if action:
        query["action"] = action
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    
    # Enrich with user info
    for log in logs:
        user = await db.users.find_one({"id": log["user_id"]}, {"_id": 0, "name": 1, "email": 1})
        log["user"] = user
    
    return logs

# ==================== INIT ====================

@api_router.get("/")
async def root():
    return {"message": "SEVA Shelter Management System API"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # Initialize storage
    try:
        init_storage()
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    
    # Create default admin user if not exists
    admin = await db.users.find_one({"email": "admin@seva.org"}, {"_id": 0})
    if not admin:
        admin_doc = {
            "id": str(uuid.uuid4()),
            "email": "admin@seva.org",
            "password": hash_password("Admin@123"),
            "name": "SEVA Admin",
            "role": "admin",
            "is_blocked": False,
            "blocked_reason": None,
            "blocked_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_doc)
        logger.info("Default admin user created: admin@seva.org / Admin@123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
