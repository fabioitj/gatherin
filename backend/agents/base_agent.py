from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging
from datetime import datetime
import traceback

class BaseAgent(ABC):
    """
    Base class for all agents in the system.
    Provides common functionality and enforces agent structure.
    """
    
    def __init__(self, name: str, config: Optional[Dict[str, Any]] = None):
        self.name = name
        self.config = config or {}
        self.logger = self._setup_logger()
        self.is_running = False
        self.last_execution = None
        self.execution_count = 0
        
    def _setup_logger(self) -> logging.Logger:
        """Setup logger for the agent"""
        logger = logging.getLogger(f"agent.{self.name}")
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                f'%(asctime)s - {self.name} - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
            
        return logger
    
    def execute(self) -> Dict[str, Any]:
        """
        Execute the agent with error handling and logging
        """
        if self.is_running:
            self.logger.warning(f"Agent {self.name} is already running, skipping execution")
            return {"status": "skipped", "reason": "already_running"}
        
        self.is_running = True
        start_time = datetime.now()
        
        try:
            self.logger.info(f"Starting execution of agent {self.name}")
            
            # Pre-execution hook
            self._pre_execute()
            
            # Main execution
            result = self._execute()
            
            # Post-execution hook
            self._post_execute(result)
            
            execution_time = (datetime.now() - start_time).total_seconds()
            self.execution_count += 1
            self.last_execution = datetime.now()
            
            self.logger.info(
                f"Agent {self.name} completed successfully in {execution_time:.2f}s"
            )
            
            return {
                "status": "success",
                "execution_time": execution_time,
                "result": result,
                "execution_count": self.execution_count
            }
            
        except Exception as e:
            execution_time = (datetime.now() - start_time).total_seconds()
            error_msg = f"Agent {self.name} failed: {str(e)}"
            self.logger.error(error_msg)
            self.logger.error(traceback.format_exc())
            
            return {
                "status": "error",
                "error": str(e),
                "execution_time": execution_time,
                "traceback": traceback.format_exc()
            }
            
        finally:
            self.is_running = False
    
    def _pre_execute(self):
        """Hook called before main execution"""
        pass
    
    def _post_execute(self, result: Any):
        """Hook called after successful execution"""
        pass
    
    @abstractmethod
    def _execute(self) -> Any:
        """
        Main execution logic - must be implemented by subclasses
        """
        pass
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        return {
            "name": self.name,
            "is_running": self.is_running,
            "last_execution": self.last_execution.isoformat() if self.last_execution else None,
            "execution_count": self.execution_count,
            "config": self.config
        }
    
    def update_config(self, new_config: Dict[str, Any]):
        """Update agent configuration"""
        self.config.update(new_config)
        self.logger.info(f"Configuration updated for agent {self.name}")