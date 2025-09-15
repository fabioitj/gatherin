from typing import Dict, List, Any, Optional, Callable
import threading
import time
from datetime import datetime, timedelta
from agents.base_agent import BaseAgent
from agents.news_scraper_agent import NewsScraperAgent
from agents.wallet_similarity_agent import WalletSimilarityAgent
import logging

class AgentManager:
    """
    Manages all agents in the system, handles scheduling and execution
    """
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.schedules: Dict[str, Dict[str, Any]] = {}
        self.running = False
        self.scheduler_thread = None
        self.logger = self._setup_logger()
        
        # Register default agents
        self._register_default_agents()
    
    def _setup_logger(self) -> logging.Logger:
        """Setup logger for the agent manager"""
        logger = logging.getLogger("agent_manager")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - AgentManager - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
        return logger
    
    def _register_default_agents(self):
        """Register default agents"""
        # News Scraper Agent - runs every hour
        # news_agent = NewsScraperAgent()
        # self.register_agent(news_agent)
        # self.schedule_agent("NewsScraperAgent", interval_hours=1)
        
        # Wallet Similarity Agent - runs every 6 hours
        similarity_agent = WalletSimilarityAgent()
        self.register_agent(similarity_agent)
        self.schedule_agent("WalletSimilarityAgent", interval_hours=6)
    
    def register_agent(self, agent: BaseAgent):
        """
        Register a new agent with the manager
        """
        self.agents[agent.name] = agent
        self.logger.info(f"Registered agent: {agent.name}")
    
    def unregister_agent(self, agent_name: str):
        """
        Unregister an agent from the manager
        """
        if agent_name in self.agents:
            del self.agents[agent_name]
            if agent_name in self.schedules:
                del self.schedules[agent_name]
            self.logger.info(f"Unregistered agent: {agent_name}")
        else:
            self.logger.warning(f"Agent not found: {agent_name}")
    
    def schedule_agent(self, agent_name: str, interval_hours: float = 1, 
                      start_delay_minutes: int = 0, max_executions: Optional[int] = None):
        """
        Schedule an agent to run at regular intervals
        """
        if agent_name not in self.agents:
            raise ValueError(f"Agent {agent_name} not registered")
        
        next_run = datetime.now() + timedelta(minutes=start_delay_minutes)
        
        self.schedules[agent_name] = {
            "interval_hours": interval_hours,
            "next_run": next_run,
            "max_executions": max_executions,
            "execution_count": 0,
            "enabled": True
        }
        
        self.logger.info(
            f"Scheduled agent {agent_name} to run every {interval_hours} hours, "
            f"starting at {next_run.strftime('%Y-%m-%d %H:%M:%S')}"
        )
    
    def unschedule_agent(self, agent_name: str):
        """
        Remove an agent from the schedule
        """
        if agent_name in self.schedules:
            del self.schedules[agent_name]
            self.logger.info(f"Unscheduled agent: {agent_name}")
    
    def enable_agent_schedule(self, agent_name: str):
        """Enable scheduled execution for an agent"""
        if agent_name in self.schedules:
            self.schedules[agent_name]["enabled"] = True
            self.logger.info(f"Enabled schedule for agent: {agent_name}")
    
    def disable_agent_schedule(self, agent_name: str):
        """Disable scheduled execution for an agent"""
        if agent_name in self.schedules:
            self.schedules[agent_name]["enabled"] = False
            self.logger.info(f"Disabled schedule for agent: {agent_name}")
    
    def execute_agent(self, agent_name: str) -> Dict[str, Any]:
        """
        Execute a specific agent manually
        """
        if agent_name not in self.agents:
            raise ValueError(f"Agent {agent_name} not registered")
        
        agent = self.agents[agent_name]
        return agent.execute()
    
    def execute_all_agents(self) -> Dict[str, Dict[str, Any]]:
        """
        Execute all registered agents
        """
        results = {}
        for agent_name in self.agents:
            results[agent_name] = self.execute_agent(agent_name)
        return results
    
    def start_scheduler(self):
        """
        Start the agent scheduler in a separate thread
        """
        if self.running:
            self.logger.warning("Scheduler is already running")
            return
        
        self.running = True
        self.scheduler_thread = threading.Thread(target=self._scheduler_loop, daemon=True)
        self.scheduler_thread.start()
        self.logger.info("Agent scheduler started")
    
    def stop_scheduler(self):
        """
        Stop the agent scheduler
        """
        self.running = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        self.logger.info("Agent scheduler stopped")
    
    def _scheduler_loop(self):
        """
        Main scheduler loop that runs in a separate thread
        """
        while self.running:
            try:
                current_time = datetime.now()
                
                for agent_name, schedule_info in self.schedules.items():
                    if not schedule_info["enabled"]:
                        continue
                    
                    if current_time >= schedule_info["next_run"]:
                        # Check max executions limit
                        if (schedule_info["max_executions"] is not None and 
                            schedule_info["execution_count"] >= schedule_info["max_executions"]):
                            self.logger.info(f"Agent {agent_name} reached max executions limit")
                            continue
                        
                        # Execute agent
                        self.logger.info(f"Executing scheduled agent: {agent_name}")
                        result = self.execute_agent(agent_name)
                        
                        # Update schedule
                        schedule_info["execution_count"] += 1
                        schedule_info["next_run"] = current_time + timedelta(
                            hours=schedule_info["interval_hours"]
                        )
                        
                        self.logger.info(
                            f"Agent {agent_name} execution completed. "
                            f"Next run: {schedule_info['next_run'].strftime('%Y-%m-%d %H:%M:%S')}"
                        )
                
                # Sleep for 1 minute before checking again
                time.sleep(60)
                
            except Exception as e:
                self.logger.error(f"Error in scheduler loop: {str(e)}")
                time.sleep(60)  # Wait before retrying
    
    def get_agent_status(self, agent_name: str) -> Dict[str, Any]:
        """
        Get status of a specific agent
        """
        if agent_name not in self.agents:
            return {"error": f"Agent {agent_name} not found"}
        
        agent = self.agents[agent_name]
        status = agent.get_status()
        
        # Add schedule information if available
        if agent_name in self.schedules:
            schedule_info = self.schedules[agent_name]
            status["schedule"] = {
                "enabled": schedule_info["enabled"],
                "interval_hours": schedule_info["interval_hours"],
                "next_run": schedule_info["next_run"].isoformat(),
                "execution_count": schedule_info["execution_count"],
                "max_executions": schedule_info["max_executions"]
            }
        
        return status
    
    def get_all_agents_status(self) -> Dict[str, Dict[str, Any]]:
        """
        Get status of all agents
        """
        return {
            agent_name: self.get_agent_status(agent_name)
            for agent_name in self.agents
        }
    
    def get_system_status(self) -> Dict[str, Any]:
        """
        Get overall system status
        """
        return {
            "scheduler_running": self.running,
            "total_agents": len(self.agents),
            "scheduled_agents": len(self.schedules),
            "agents": self.get_all_agents_status()
        }