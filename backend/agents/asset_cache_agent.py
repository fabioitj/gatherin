from typing import Dict, Any, List
import uuid
import requests
import psycopg2
from datetime import datetime
import os
from dotenv import load_dotenv
from agents.base_agent import BaseAgent

load_dotenv()

class AssetCacheAgent(BaseAgent):
    """
    Agent responsible for caching asset data from Brapi API to local database
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        default_config = {
            "brapi_token": os.getenv("BRAPI_TOKEN", "8rDscDtqiTXKAGB1kfbn42"),
            "batch_size": 100,
            "asset_types": ["stock", "fund"],  # stock = STOCK, fund = FII
            "max_retries": 3,
            "retry_delay": 5
        }
        
        if config:
            default_config.update(config)
            
        super().__init__("AssetCacheAgent", default_config)
        self.db_url = os.getenv("DATABASE_URL")
    
    def _execute(self) -> Dict[str, Any]:
        """
        Execute asset caching from Brapi API
        """
        try:
            self.logger.info("🚀 Starting asset cache update from Brapi...")
            
            total_assets = 0
            results = {}
            
            for asset_type in self.config["asset_types"]:
                self.logger.info(f"📊 Fetching {asset_type} data from Brapi...")
                
                assets = self._fetch_assets_from_brapi(asset_type)
                
                if assets:
                    saved_count = self._save_assets_to_database(assets, asset_type)
                    
                    results[asset_type] = {
                        "fetched": len(assets),
                        "saved": saved_count,
                        "status": "success"
                    }
                    total_assets += saved_count
                    
                    self.logger.info(f"✅ Successfully cached {saved_count} {asset_type} assets")
                else:
                    results[asset_type] = {
                        "fetched": 0,
                        "saved": 0,
                        "status": "no_data"
                    }
                    self.logger.warning(f"⚠️ No {asset_type} data retrieved from Brapi")
            
            # Update cache timestamp
            self._update_cache_timestamp()
            
            return {
                "total_assets_cached": total_assets,
                "asset_types_results": results,
                "cache_updated_at": datetime.now().isoformat(),
                "success": True
            }
            
        except Exception as e:
            self.logger.error(f"❌ Error in asset cache update: {str(e)}")
            raise
    
    def _fetch_assets_from_brapi(self, asset_type: str) -> List[Dict[str, Any]]:
        """
        Fetch assets from Brapi API
        """
        try:
            url = f"https://brapi.dev/api/quote/list?type={asset_type}"
            
            headers = {
                'Authorization': f'Bearer {self.config["brapi_token"]}',
                'Content-Type': 'application/json',
            }
            
            self.logger.info(f"🌐 Making request to Brapi: {url}")
            response = requests.get(url, headers=headers, timeout=60)
            
            if not response.ok:
                self.logger.error(f"❌ Brapi API error: {response.status_code} - {response.text}")
                return []
            
            data = response.json()
            assets = data.get('stocks', [])
            
            self.logger.info(f"📦 Received {len(assets)} {asset_type} assets from Brapi")
            
            # Log some examples
            if assets:
                examples = assets[:3]
                for i, asset in enumerate(examples):
                    self.logger.debug(f"  Example {i+1}: {asset.get('stock', 'N/A')} - {asset.get('name', 'N/A')}")
                
                # Log total count for verification
                self.logger.info(f"🎯 Successfully fetched ALL {len(assets)} {asset_type} assets from Brapi")
            
            return assets
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"❌ Network error fetching {asset_type} from Brapi: {str(e)}")
            return []
        except Exception as e:
            self.logger.error(f"❌ Unexpected error fetching {asset_type} from Brapi: {str(e)}")
            return []
    
    def _save_assets_to_database(self, assets: List[Dict[str, Any]], asset_type: str) -> int:
        """
        Save assets to local database
        """
        if not assets:
            return 0
        
        self.logger.info(f"💾 Saving {len(assets)} {asset_type} assets to database...")
        
        conn = psycopg2.connect(self.db_url)
        cur = conn.cursor()
        
        try:
            # Create table if not exists
            self.logger.debug("🏗️ Ensuring asset_data table exists...")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS asset_data (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
                    ticker VARCHAR(10) UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    type VARCHAR(10) NOT NULL,
                    sector TEXT,
                    "logoUrl" TEXT,
                    "currentPrice" DECIMAL(10,2),
                    change DECIMAL(5,2),
                    volume BIGINT,
                    "marketCap" BIGINT,
                    "isActive" BOOLEAN DEFAULT true,
                    "lastUpdated" TIMESTAMP DEFAULT NOW(),
                    "createdAt" TIMESTAMP DEFAULT NOW(),
                    "updatedAt" TIMESTAMP DEFAULT NOW()
                );
                
                CREATE INDEX IF NOT EXISTS idx_asset_data_type ON asset_data(type);
                CREATE INDEX IF NOT EXISTS idx_asset_data_ticker ON asset_data(ticker);
                CREATE INDEX IF NOT EXISTS idx_asset_data_name ON asset_data(name);
            """)
            
            # Map asset_type to our enum
            db_asset_type = "STOCK" if asset_type == "stock" else "FII"
            
            # Prepare batch insert
            insert_query = """
                INSERT INTO asset_data (
                    id, ticker, name, type, sector, "logoUrl", "currentPrice", 
                    change, volume, "marketCap", "isActive", "lastUpdated", "updatedAt"
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (ticker) DO UPDATE SET
                    name = EXCLUDED.name,
                    sector = EXCLUDED.sector,
                    "logoUrl" = EXCLUDED."logoUrl",
                    "currentPrice" = EXCLUDED."currentPrice",
                    change = EXCLUDED.change,
                    volume = EXCLUDED.volume,
                    "marketCap" = EXCLUDED."marketCap",
                    "isActive" = EXCLUDED."isActive",
                    "lastUpdated" = EXCLUDED."lastUpdated",
                    "updatedAt" = EXCLUDED."updatedAt"
            """
            
            current_time = datetime.now()
            saved_count = 0
            batch_size = self.config["batch_size"]
            
            for i in range(0, len(assets), batch_size):
                batch = assets[i:i + batch_size]
                batch_num = (i // batch_size) + 1
                total_batches = (len(assets) + batch_size - 1) // batch_size
                
                self.logger.debug(f"💾 Saving batch {batch_num}/{total_batches} ({len(batch)} assets)...")
                
                batch_data = []
                for asset in batch:
                    try:
                        batch_data.append((
                            str(uuid.uuid4()),               # id
                            asset.get('stock', '').upper(),  # ticker
                            asset.get('name', ''),           # name
                            db_asset_type,                   # type
                            asset.get('sector'),             # sector
                            asset.get('logo'),               # logoUrl
                            float(asset['close']) if asset.get('close') else None,  # currentPrice
                            float(asset['change']) if asset.get('change') else None,  # change
                            int(asset['volume']) if asset.get('volume') else None,    # volume
                            int(asset['market_cap']) if asset.get('market_cap') else None,  # marketCap
                            True,                            # isActive
                            current_time,                    # lastUpdated
                            current_time                     # updatedAt
                        ))
                    except (ValueError, TypeError) as e:
                        self.logger.warning(f"⚠️ Skipping invalid asset data for {asset.get('stock', 'unknown')}: {str(e)}")
                        continue
                
                if batch_data:
                    cur.executemany(insert_query, batch_data)
                    saved_count += len(batch_data)
                    self.logger.debug(f"✅ Batch {batch_num} saved successfully")
            
            # Mark assets not in current batch as inactive
            if saved_count > 0:
                current_tickers = [asset.get('stock', '').upper() for asset in assets if asset.get('stock')]
                if current_tickers:
                    placeholders = ','.join(['%s'] * len(current_tickers))
                    cur.execute(f"""
                        UPDATE asset_data 
                        SET "isActive" = false, "updatedAt" = %s
                        WHERE type = %s AND ticker NOT IN ({placeholders})
                    """, [current_time, db_asset_type] + current_tickers)
                    
                    inactive_count = cur.rowcount
                    if inactive_count > 0:
                        self.logger.info(f"📝 Marked {inactive_count} {asset_type} assets as inactive")
            
            conn.commit()
            self.logger.info(f"✅ Successfully saved {saved_count} {asset_type} assets to database")
            
            return saved_count
            
        except Exception as e:
            conn.rollback()
            self.logger.error(f"❌ Error saving {asset_type} assets: {str(e)}")
            raise
        finally:
            cur.close()
            conn.close()
    
    def _update_cache_timestamp(self):
        """
        Update cache timestamp for tracking when data was last refreshed
        """
        conn = psycopg2.connect(self.db_url)
        cur = conn.cursor()
        
        try:
            # Create or update cache metadata table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS cache_metadata (
                    key VARCHAR(50) PRIMARY KEY,
                    value TEXT,
                    "updatedAt" TIMESTAMP DEFAULT NOW()
                );
                
                INSERT INTO cache_metadata (key, value, "updatedAt")
                VALUES ('asset_cache_last_update', %s, %s)
                ON CONFLICT (key) DO UPDATE SET
                    value = EXCLUDED.value,
                    "updatedAt" = EXCLUDED."updatedAt"
            """, [datetime.now().isoformat(), datetime.now()])
            
            conn.commit()
            self.logger.info("📅 Updated cache timestamp")
            
        except Exception as e:
            self.logger.error(f"❌ Error updating cache timestamp: {str(e)}")
        finally:
            cur.close()
            conn.close()