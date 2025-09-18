from typing import Dict, Any, List, Tuple
import psycopg2
from collections import defaultdict, Counter
import os
import uuid
from dotenv import load_dotenv
from agents.base_agent import BaseAgent

load_dotenv()

class WalletSimilarityAgent(BaseAgent):
    """
    Agent responsible for analyzing wallet similarities and generating recommendations
    """
    
    def __init__(self, config: Dict[str, Any] = None):
        default_config = {
            "min_similarity_threshold": 0.1,  # 10% minimum similarity
            "min_users_for_recommendation": 1,  # Minimum users needed for a recommendation
            "max_recommendations_per_asset": 10,
            "similarity_algorithms": ["jaccard", "cosine"],
            "batch_size": 1000
        }
        
        if config:
            default_config.update(config)
            
        super().__init__("WalletSimilarityAgent", default_config)
        self.db_url = os.getenv("DATABASE_URL")
    
    def _execute(self) -> Dict[str, Any]:
        """
        Execute wallet similarity analysis
        """
        try:
            self.logger.info("🚀 Starting wallet similarity analysis...")
            
            # Get all wallets data
            self.logger.info("📊 Fetching wallets data from database...")
            wallets_data = self._get_wallets_data()
            
            if not wallets_data:
                self.logger.warning("⚠️ No wallet data found in database")
                return {
                    "message": "No wallet data found",
                    "similarities_generated": 0,
                    "recommendations_generated": 0
                }
            
            self.logger.info(f"✅ Found {len(wallets_data)} wallets to analyze")
            
            # Log wallet details
            total_assets = sum(len(wallet["assets"]) for wallet in wallets_data)
            unique_assets = set()
            for wallet in wallets_data:
                for asset in wallet["assets"]:
                    unique_assets.add(asset["ticker"])
            
            self.logger.info(f"📈 Total assets across all wallets: {total_assets}")
            self.logger.info(f"🎯 Unique assets found: {len(unique_assets)} - {sorted(list(unique_assets))[:10]}{'...' if len(unique_assets) > 10 else ''}")
            
            # Generate asset co-occurrence matrix
            self.logger.info("🔄 Calculating asset co-occurrence matrix...")
            asset_cooccurrence = self._calculate_asset_cooccurrence(wallets_data)
            self.logger.info(f"📊 Generated {len(asset_cooccurrence)} asset pairs for analysis")
            
            # Generate similarity recommendations
            self.logger.info("🧠 Generating similarity recommendations...")
            recommendations = self._generate_recommendations(asset_cooccurrence, wallets_data)
            self.logger.info(f"💡 Generated {len(recommendations)} recommendations")
            
            # Save recommendations to database
            self.logger.info("💾 Saving recommendations to database...")
            saved_count = self._save_recommendations(recommendations)
            self.logger.info(f"✅ Successfully saved {saved_count} recommendations")
            
            return {
                "wallets_analyzed": len(wallets_data),
                "asset_pairs_analyzed": len(asset_cooccurrence),
                "recommendations_generated": len(recommendations),
                "recommendations_saved": saved_count,
                "top_recommendations": self._get_top_recommendations(recommendations, 10)
            }
            
        except Exception as e:
            self.logger.error(f"❌ Error in wallet similarity analysis: {str(e)}")
            raise
    
    def _get_wallets_data(self) -> List[Dict[str, Any]]:
        """
        Retrieve all wallets and their assets from database
        """
        self.logger.info("🔍 Connecting to database to fetch wallet data...")
        conn = psycopg2.connect(self.db_url)
        cur = conn.cursor()
        
        try:
            query = """
                SELECT 
                    w.id as wallet_id,
                    w."userId" as user_id,
                    a.ticker,
                    a.type,
                    a.quantity,
                    a."averagePrice"
                FROM wallets w
                JOIN assets a ON w.id = a."walletId"
                WHERE a.quantity > 0
                ORDER BY w.id
            """
            
            self.logger.debug("📝 Executing wallet query...")
            cur.execute(query)
            rows = cur.fetchall()
            self.logger.info(f"📊 Retrieved {len(rows)} asset records from database")
            
            # Group by wallet
            wallets = defaultdict(lambda: {"user_id": None, "assets": []})
            
            for row in rows:
                wallet_id, user_id, ticker, asset_type, quantity, avg_price = row
                
                if wallets[wallet_id]["user_id"] is None:
                    wallets[wallet_id]["user_id"] = user_id
                
                wallets[wallet_id]["assets"].append({
                    "ticker": ticker,
                    "type": asset_type,
                    "quantity": quantity,
                    "average_price": float(avg_price),
                    "total_value": quantity * float(avg_price)
                })
            
            self.logger.info(f"🏦 Processed {len(wallets)} unique wallets")
            
            # Log some wallet examples
            for i, (wallet_id, data) in enumerate(list(wallets.items())[:3]):
                tickers = [asset["ticker"] for asset in data["assets"]]
                self.logger.debug(f"  Wallet {i+1} (ID: {wallet_id}): {len(tickers)} assets - {tickers}")
            
            if len(wallets) > 3:
                self.logger.debug(f"  ... and {len(wallets) - 3} more wallets")
            
            return [
                {
                    "wallet_id": wallet_id,
                    "user_id": data["user_id"],
                    "assets": data["assets"]
                }
                for wallet_id, data in wallets.items()
            ]
            
        finally:
            self.logger.debug("🔒 Closing database connection")
            cur.close()
            conn.close()
    
    def _calculate_asset_cooccurrence(self, wallets_data: List[Dict[str, Any]]) -> Dict[Tuple[str, str], Dict[str, Any]]:
        """
        Calculate how often assets appear together in wallets
        """
        self.logger.info("🔢 Starting asset co-occurrence calculation...")
        
        # Track individual asset occurrences
        asset_users = defaultdict(set)  # asset -> set of user_ids
        asset_cooccurrence = defaultdict(lambda: {
            "users_with_both": set()
        })
        
        self.logger.info("📊 First pass: collecting asset-user relationships...")
        # First pass: collect all asset-user relationships
        for wallet in wallets_data:
            user_id = wallet["user_id"]
            tickers = [asset["ticker"] for asset in wallet["assets"]]
            
            # Track which users have each asset
            for ticker in tickers:
                asset_users[ticker].add(user_id)
            
            # Track co-occurrences (users who have both assets)
            for i, ticker1 in enumerate(tickers):
                for ticker2 in tickers[i+1:]:
                    # Ensure consistent ordering
                    pair = tuple(sorted([ticker1, ticker2]))
                    asset_cooccurrence[pair]["users_with_both"].add(user_id)
        
        self.logger.info(f"📈 Found {len(asset_users)} unique assets")
        self.logger.info(f"🔗 Found {len(asset_cooccurrence)} asset pairs")
        
        # Log top assets by user count
        top_assets = sorted(asset_users.items(), key=lambda x: len(x[1]), reverse=True)[:10]
        self.logger.info("🏆 Top 10 most held assets:")
        for i, (asset, users) in enumerate(top_assets):
            self.logger.info(f"  {i+1}. {asset}: {len(users)} users")
        
        self.logger.info("🧮 Second pass: calculating similarity metrics...")
        # Second pass: calculate metrics for each pair
        processed_pairs = 0
        for pair, data in asset_cooccurrence.items():
            ticker1, ticker2 = pair
            
            users_with_first = asset_users[ticker1]
            users_with_second = asset_users[ticker2]
            users_with_both = data["users_with_both"]
            
            data["users_with_first"] = users_with_first
            data["users_with_second"] = users_with_second
            data["total_wallets_with_first"] = len(users_with_first)
            data["total_wallets_with_second"] = len(users_with_second)
            
            # Calculate similarity metrics
            data["jaccard_similarity"] = self._calculate_jaccard_similarity(
                users_with_both,
                users_with_first,
                users_with_second
            )
            
            data["support"] = len(users_with_both) / len(wallets_data)
            data["confidence_first_to_second"] = len(users_with_both) / len(users_with_first) if users_with_first else 0
            data["confidence_second_to_first"] = len(users_with_both) / len(users_with_second) if users_with_second else 0
            
            processed_pairs += 1
            if processed_pairs % 100 == 0:
                self.logger.debug(f"  Processed {processed_pairs}/{len(asset_cooccurrence)} pairs...")
        
        # Log some interesting pairs
        interesting_pairs = sorted(
            asset_cooccurrence.items(), 
            key=lambda x: x[1]["jaccard_similarity"], 
            reverse=True
        )[:5]
        
        self.logger.info("🎯 Top 5 most similar asset pairs:")
        for i, (pair, metrics) in enumerate(interesting_pairs):
            ticker1, ticker2 = pair
            self.logger.info(
                f"  {i+1}. {ticker1} ↔ {ticker2}: "
                f"Jaccard={metrics['jaccard_similarity']:.3f}, "
                f"Users with both={len(metrics['users_with_both'])}"
            )
        
        return dict(asset_cooccurrence)
    
    def _calculate_jaccard_similarity(self, both: set, first: set, second: set) -> float:
        """
        Calculate Jaccard similarity coefficient
        """
        union_size = len(first.union(second))
        if union_size == 0:
            return 0.0
        return len(both) / union_size
    
    def _generate_recommendations(self, asset_cooccurrence: Dict[Tuple[str, str], Dict[str, Any]], wallets_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generate asset recommendations based on similarity analysis
        """
        self.logger.info("💡 Starting recommendation generation...")
        self.logger.info(f"🎯 Using thresholds: similarity >= {self.config['min_similarity_threshold']}, min_users >= {self.config['min_users_for_recommendation']}")
        
        recommendations = []
        filtered_out = 0
        
        for pair, metrics in asset_cooccurrence.items():
            ticker1, ticker2 = pair
            
            # Filter by minimum thresholds
            users_with_both_count = len(metrics["users_with_both"])
            
            if (metrics["jaccard_similarity"] >= self.config["min_similarity_threshold"] and
                users_with_both_count >= self.config["min_users_for_recommendation"]):
                
                self.logger.debug(f"✅ Processing pair {ticker1} ↔ {ticker2}: {users_with_both_count} users, similarity={metrics['jaccard_similarity']:.3f}")
                
                # Create bidirectional recommendations with proper confidence calculations
                
                # Recommendation 1: ticker1 -> ticker2
                confidence_1_to_2 = metrics["confidence_first_to_second"]
                if confidence_1_to_2 > 0:  # Only add if there's actual confidence
                    self.logger.debug(f"  📈 {ticker1} → {ticker2}: {confidence_1_to_2*100:.1f}% confidence")
                    recommendations.append({
                        "base_asset": ticker1,
                        "recommended_asset": ticker2,
                        "similarity_score": metrics["jaccard_similarity"],
                        "support": metrics["support"],
                        "confidence": confidence_1_to_2,
                        "users_with_both": users_with_both_count,
                        "users_with_base": metrics["total_wallets_with_first"],
                        "percentage_also_invest": round(confidence_1_to_2 * 100, 2),
                        "recommendation_strength": self._calculate_recommendation_strength(metrics, confidence_1_to_2)
                    })
                
                # Recommendation 2: ticker2 -> ticker1
                confidence_2_to_1 = metrics["confidence_second_to_first"]
                if confidence_2_to_1 > 0:  # Only add if there's actual confidence
                    self.logger.debug(f"  📈 {ticker2} → {ticker1}: {confidence_2_to_1*100:.1f}% confidence")
                    recommendations.append({
                        "base_asset": ticker2,
                        "recommended_asset": ticker1,
                        "similarity_score": metrics["jaccard_similarity"],
                        "support": metrics["support"],
                        "confidence": confidence_2_to_1,
                        "users_with_both": users_with_both_count,
                        "users_with_base": metrics["total_wallets_with_second"],
                        "percentage_also_invest": round(confidence_2_to_1 * 100, 2),
                        "recommendation_strength": self._calculate_recommendation_strength(metrics, confidence_2_to_1)
                    })
            else:
                filtered_out += 1
                if filtered_out <= 5:  # Only log first few filtered pairs
                    self.logger.debug(f"❌ Filtered out {ticker1} ↔ {ticker2}: similarity={metrics['jaccard_similarity']:.3f}, users={users_with_both_count}")
        
        self.logger.info(f"📊 Generated {len(recommendations)} recommendations, filtered out {filtered_out} pairs")
        
        # Sort by recommendation strength
        recommendations.sort(key=lambda x: x["recommendation_strength"], reverse=True)
        self.logger.info("🔄 Sorted recommendations by strength")
        
        # Log some examples for debugging
        self.logger.info("🏆 Top 10 recommendations generated:")
        for i, rec in enumerate(recommendations[:10]):
            self.logger.info(
                f"  {i+1}. 📈 {rec['percentage_also_invest']:.1f}% dos usuários que investem em "
                f"{rec['base_asset']} também investem em {rec['recommended_asset']} "
                f"({rec['users_with_both']}/{rec['users_with_base']} usuários) "
                f"[Strength: {rec['recommendation_strength']:.3f}]"
            )
        
        return recommendations
    
    def _calculate_recommendation_strength(self, metrics: Dict[str, Any], confidence: float) -> float:
        """
        Calculate overall recommendation strength combining multiple metrics
        """
        # Weighted combination of different metrics
        jaccard_weight = 0.4
        support_weight = 0.3
        confidence_weight = 0.3
        
        return (
            metrics["jaccard_similarity"] * jaccard_weight +
            metrics["support"] * support_weight +
            confidence * confidence_weight
        )
    
    def _save_recommendations(self, recommendations: List[Dict[str, Any]]) -> int:
        """
        Save recommendations to database and sync with Next.js API
        """
        if not recommendations:
            self.logger.warning("⚠️ No recommendations to save")
            return 0
        
        self.logger.info("🔗 Connecting to database for saving recommendations...")
        conn = psycopg2.connect(self.db_url)
        cur = conn.cursor()
        
        try:
            self.logger.info("🏗️ Creating asset_recommendations table if not exists...")
            # Create table if not exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS asset_recommendations (
                    id TEXT PRIMARY KEY,
                    "baseAsset" VARCHAR(10) NOT NULL,
                    "recommendedAsset" VARCHAR(10) NOT NULL,
                    "similarityScore" DECIMAL(5,4) NOT NULL,
                    support DECIMAL(5,4) NOT NULL,
                    confidence DECIMAL(5,4) NOT NULL,
                    "usersWithBoth" INTEGER NOT NULL,
                    "usersWithBase" INTEGER NOT NULL,
                    "percentageAlsoInvest" DECIMAL(5,2) NOT NULL,
                    "recommendationStrength" DECIMAL(5,4) NOT NULL,
                    "createdAt" TIMESTAMP NOT NULL,
                    "updatedAt" TIMESTAMP NOT NULL,
                    UNIQUE("baseAsset", "recommendedAsset")
                );
            """)
            self.logger.debug("✅ Table creation/verification completed")
            
            # Clear old recommendations
            self.logger.info("🗑️ Clearing old recommendations...")
            cur.execute("DELETE FROM asset_recommendations")
            deleted_count = cur.rowcount
            self.logger.info(f"🗑️ Deleted {deleted_count} old recommendations")
            
            # Insert new recommendations
            insert_query = """
                INSERT INTO asset_recommendations (
                    id, "baseAsset", "recommendedAsset", "similarityScore", support, confidence,
                    "usersWithBoth", "usersWithBase", "percentageAlsoInvest", "recommendationStrength",
                    "createdAt", "updatedAt"
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            batch_size = self.config["batch_size"]
            saved_count = 0
            total_batches = (len(recommendations) + batch_size - 1) // batch_size
            self.logger.info(f"💾 Saving {len(recommendations)} recommendations in {total_batches} batches of {batch_size}...")
            
            from datetime import datetime
            current_time = datetime.now()
            
            for i in range(0, len(recommendations), batch_size):
                batch = recommendations[i:i + batch_size]
                batch_num = (i // batch_size) + 1
                self.logger.debug(f"  💾 Saving batch {batch_num}/{total_batches} ({len(batch)} items)...")
                
                batch_data = [
                    (
                        str(uuid.uuid4()),  # Generate UUID for id
                        rec["base_asset"],
                        rec["recommended_asset"],
                        rec["similarity_score"],
                        rec["support"],
                        rec["confidence"],
                        rec["users_with_both"],
                        rec["users_with_base"],
                        rec["percentage_also_invest"],
                        rec["recommendation_strength"],
                        current_time,  # createdAt
                        current_time   # updatedAt
                    )
                    for rec in batch
                ]
                
                cur.executemany(insert_query, batch_data)
                saved_count += len(batch_data)
                self.logger.debug(f"  ✅ Batch {batch_num} saved successfully")
            
            conn.commit()
            self.logger.info(f"✅ Successfully saved {saved_count} recommendations to database")
            
            # Also sync with Next.js API for easier frontend access
            self.logger.info("🔄 Syncing with Next.js API...")
            self._sync_with_nextjs_api(recommendations)
            
            return saved_count
            
        except Exception as e:
            conn.rollback()
            self.logger.error(f"❌ Error saving recommendations: {str(e)}")
            raise
        finally:
            self.logger.debug("🔒 Closing database connection")
            cur.close()
            conn.close()
    
    def _sync_with_nextjs_api(self, recommendations: List[Dict[str, Any]]):
        """
        Sync recommendations with Next.js API
        """
        try:
            self.logger.info("🔄 Preparing recommendations for Next.js API sync...")
            import requests
            
            # Format for Next.js API
            formatted_recs = []
            for rec in recommendations:
                formatted_recs.append({
                    "baseAsset": rec["base_asset"],
                    "recommendedAsset": rec["recommended_asset"],
                    "similarityScore": rec["similarity_score"],
                    "support": rec["support"],
                    "confidence": rec["confidence"],
                    "usersWithBoth": rec["users_with_both"],
                    "usersWithBase": rec["users_with_base"],
                    "percentageAlsoInvest": rec["percentage_also_invest"],
                    "recommendationStrength": rec["recommendation_strength"]
                })
            
            # Send to Next.js API (you might need to adjust the URL)
            # response = requests.post(
            #     "http://localhost:3000/api/recommendations",
            #     json={"recommendations": formatted_recs}
            # )
            
            self.logger.info(f"✅ Prepared {len(formatted_recs)} recommendations for Next.js sync")
            self.logger.debug("💡 To enable API sync, uncomment the requests.post() call in _sync_with_nextjs_api()")
            
        except Exception as e:
            self.logger.warning(f"⚠️ Could not sync with Next.js API: {str(e)}")
    
    def _get_top_recommendations(self, recommendations: List[Dict[str, Any]], limit: int) -> List[Dict[str, Any]]:
        """
        Get top recommendations for summary
        """
        self.logger.debug(f"📊 Returning top {limit} recommendations for summary")
        return recommendations[:limit]