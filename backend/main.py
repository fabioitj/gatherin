from agents.agent_manager import AgentManager
import signal
import sys

def signal_handler(sig, frame):
    """Handle shutdown signals gracefully"""
    print("\nShutting down agent system...")
    agent_manager.stop_scheduler()
    sys.exit(0)

if __name__ == "__main__":
    # Setup signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Initialize and start agent manager
    agent_manager = AgentManager()
    
    print("🚀 Starting GatherIn Agent System...")
    print("📊 Registered agents:")
    
    for agent_name, agent in agent_manager.agents.items():
        print(f"  - {agent_name}")
    
    print("\n⏰ Starting scheduler...")
    agent_manager.start_scheduler()
    
    print("✅ Agent system is running! Press Ctrl+C to stop.")
    print("\n📈 System Status:")
    
    # Keep the main thread alive
    try:
        while True:
            import time
            time.sleep(30)  # Print status every 30 seconds
            
            status = agent_manager.get_system_status()
            print(f"\n📊 Active agents: {status['total_agents']} | Scheduled: {status['scheduled_agents']}")
            
            for agent_name, agent_status in status['agents'].items():
                last_exec = agent_status.get('last_execution', 'Never')
                if last_exec != 'Never' and isinstance(last_exec, str):
                    from datetime import datetime
                    last_exec = datetime.fromisoformat(last_exec).strftime('%H:%M:%S')
                
                running_status = "🟢 Running" if agent_status['is_running'] else "⚪ Idle"
                print(f"  {agent_name}: {running_status} | Last: {last_exec} | Count: {agent_status['execution_count']}")
                
    except KeyboardInterrupt:
        signal_handler(None, None)
