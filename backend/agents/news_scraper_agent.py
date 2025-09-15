from typing import Dict, Any, List
from agents.base_agent import BaseAgent
from websites.infomoney import InfoMoney
from websites.moneytimes import MoneyTimes
from lib.db import salvar_noticias_no_postgres

class NewsScraperAgent(BaseAgent):
    """
    Agent responsible for scraping news from various financial websites
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        default_config = {
            "sources": ["infomoney", "moneytimes"],
            "max_retries": 3,
            "retry_delay": 5,  # seconds
            "batch_size": 50
        }
        
        if config:
            default_config.update(config)
            
        super().__init__("NewsScraperAgent", default_config)
        
        # Initialize scrapers
        self.scrapers = {
            "infomoney": InfoMoney(),
            "moneytimes": MoneyTimes()
        }
    
    def _execute(self) -> Dict[str, Any]:
        """
        Execute news scraping from all configured sources
        """
        total_news = 0
        results = {}
        errors = []
        
        for source in self.config["sources"]:
            if source not in self.scrapers:
                error_msg = f"Unknown news source: {source}"
                self.logger.error(error_msg)
                errors.append(error_msg)
                continue
            
            try:
                self.logger.info(f"Starting scraping from {source}")
                
                scraper = self.scrapers[source]
                news_data = scraper.extract()
                
                if news_data:
                    # Save to database in batches
                    self._save_news_in_batches(news_data)
                    
                    results[source] = {
                        "count": len(news_data),
                        "status": "success"
                    }
                    total_news += len(news_data)
                    
                    self.logger.info(f"Successfully scraped {len(news_data)} news from {source}")
                else:
                    results[source] = {
                        "count": 0,
                        "status": "no_data"
                    }
                    self.logger.warning(f"No news data retrieved from {source}")
                    
            except Exception as e:
                error_msg = f"Error scraping from {source}: {str(e)}"
                self.logger.error(error_msg)
                errors.append(error_msg)
                results[source] = {
                    "count": 0,
                    "status": "error",
                    "error": str(e)
                }
        
        return {
            "total_news_scraped": total_news,
            "sources_results": results,
            "errors": errors,
            "success_rate": len([r for r in results.values() if r["status"] == "success"]) / len(results) if results else 0
        }
    
    def _save_news_in_batches(self, news_data: List[Dict[str, Any]]):
        """
        Save news data to database in batches to avoid memory issues
        """
        batch_size = self.config["batch_size"]
        
        for i in range(0, len(news_data), batch_size):
            batch = news_data[i:i + batch_size]
            try:
                salvar_noticias_no_postgres(batch)
                self.logger.debug(f"Saved batch of {len(batch)} news items")
            except Exception as e:
                self.logger.error(f"Error saving batch: {str(e)}")
                raise
    
    def add_scraper(self, name: str, scraper_instance):
        """
        Add a new scraper to the agent
        """
        self.scrapers[name] = scraper_instance
        if name not in self.config["sources"]:
            self.config["sources"].append(name)
        self.logger.info(f"Added new scraper: {name}")
    
    def remove_scraper(self, name: str):
        """
        Remove a scraper from the agent
        """
        if name in self.scrapers:
            del self.scrapers[name]
        if name in self.config["sources"]:
            self.config["sources"].remove(name)
        self.logger.info(f"Removed scraper: {name}")