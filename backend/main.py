from fastapi import FastAPI, APIRouter
from agents.agent_manager import AgentManager
import signal
import sys
import threading
import time
from datetime import datetime

# --- FastAPI Setup ---
app = FastAPI(
    title="GatherIn Agent System",
    description="Manages background agents for data scraping and analysis.",
    version="1.0.0"
)
router = APIRouter()

# --- Agent Manager Setup ---
agent_manager = AgentManager()

def run_scheduler():
    """Runs the agent manager's scheduler in a separate thread."""
    print("⏰ Starting scheduler...")
    agent_manager.start_scheduler()
    print("✅ Scheduler is running in the background.")

@router.get("/health", summary="Check if the API is running")
def health_check():
    """Endpoint to verify that the service is operational."""
    return {"status": "ok"}

@router.get("/status", summary="Get the status of all agents")
def get_system_status():
    """Returns the current status of all registered agents."""
    status = agent_manager.get_system_status()
    
    # Format timestamps for readability
    for agent_name, agent_status in status['agents'].items():
        last_exec = agent_status.get('last_execution', 'Never')
        if last_exec != 'Never' and isinstance(last_exec, str):
            last_exec = datetime.fromisoformat(last_exec).strftime('%Y-%m-%d %H:%M:%S')
            agent_status['last_execution'] = last_exec
            
    return status

app.include_router(router, prefix="/api")

# --- Graceful Shutdown ---
def signal_handler(sig, frame):
    """Handles shutdown signals to stop the agent manager gracefully."""
    print("\nShutting down agent system...")
    agent_manager.stop_scheduler()
    sys.exit(0)

# --- Main Execution ---
if __name__ == "__main__":
    import uvicorn
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start the agent manager in a background thread
    scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
    scheduler_thread.start()
    
    print("🚀 Starting GatherIn Agent System API...")
    print("📊 Registered agents:")
    for agent_name in agent_manager.agents:
        print(f"  - {agent_name}")
    
    # Start the FastAPI server
    uvicorn.run(app, host="0.0.0.0", port=8000)
