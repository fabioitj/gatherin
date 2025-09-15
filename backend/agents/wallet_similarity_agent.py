from typing import Dict, Any, List, Tuple
import psycopg2
from collections import defaultdict, Counter
import os
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
            "min_users_for_recommendation": 5,  # Minimum users needed for a recommendation
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
            # Get all wallets data
            wallets_data = self._get_wallets_data()
            
            if not wallets_data:
                return {
                    "message": "No wallet data found",
                    "similarities_generated": 0,
                    "recommendations_generated": 0
                }
            
            self.logger.info(f"Analyzing {len(wallets_data)} wallets")
            
            # Generate asset co-occurrence matrix
            asset_cooccurrence = self._calculate_asset_cooccurrence(wallets_data)
            
            # Generate similarity recommendations
            recommendations = self._generate_recommendations(asset_cooccurrence, wallets_data)
            
            # Save recommendations to database
            saved_count = self._save_recommendations(recommendations)
            
            return {
                "wallets_analyzed": len(wallets_data),
                "asset_pairs_analyzed": len(asset_cooccurrence),
                "recommendations_generated": len(recommendations),
                "recommendations_saved": saved_count,
                "top_recommendations": self._get_top_recommendations(recommendations, 10)
            }
            
        except Exception as e:
            self.logger.error(f"Error in wallet similarity analysis: {str(e)}")
            raise
    
    def _get_wallets_data(self) -> List[Dict[str, Any]]:
        """
        Retrieve all wallets and their assets from database
        """
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
            
            cur.execute(query)
            rows = cur.fetchall()
            
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
            
            return [
                {
                    "wallet_id": wallet_id,
                    "user_id": data["user_id"],
                    "assets": data["assets"]
                }
                for wallet_id, data in wallets.items()
            ]
            
        finally:
            cur.close()
            conn.close()
    
    def _calculate_asset_cooccurrence(self, wallets_data: List[Dict[str, Any]]) -> Dict[Tuple[str, str], Dict[str, Any]]:
        """
        Calculate how often assets appear together in wallets
        """
        # Track individual asset occurrences
        asset_users = defaultdict(set)  # asset -> set of user_ids
        asset_cooccurrence = defaultdict(lambda: {
            "users_with_both": set()
        })
        
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
        
        # Second pass: calculate metrics for each pair
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
        recommendations = []
        
        for pair, metrics in asset_cooccurrence.items():
            ticker1, ticker2 = pair
            
            # Filter by minimum thresholds
            users_with_both_count = len(metrics["users_with_both"])
            
            if (metrics["jaccard_similarity"] >= self.config["min_similarity_threshold"] and
                users_with_both_count >= self.config["min_users_for_recommendation"]):
                
                # Create bidirectional recommendations with proper confidence calculations
                
                # Recommendation 1: ticker1 -> ticker2
                confidence_1_to_2 = metrics["confidence_first_to_second"]
                if confidence_1_to_2 > 0:  # Only add if there's actual confidence
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
        
        # Sort by recommendation strength
        recommendations.sort(key=lambda x: x["recommendation_strength"], reverse=True)
        
        # Log some examples for debugging
        self.logger.info("Generated recommendations examples:")
        for i, rec in enumerate(recommendations[:5]):
            self.logger.info(
                f"  {i+1}. {rec['percentage_also_invest']:.1f}% dos usuários que investem em "
                f"{rec['base_asset']} também investem em {rec['recommended_asset']} "
                f"({rec['users_with_both']}/{rec['users_with_base']} usuários)"
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
            return 0
        
        conn = psycopg2.connect(self.db_url)
        cur = conn.cursor()
        
        try:
            # Create table if not exists
            cur.execute("""
                CREATE TABLE IF NOT EXISTS asset_recommendations (
                    id SERIAL PRIMARY KEY,
                    base_asset VARCHAR(10) NOT NULL,
                    recommended_asset VARCHAR(10) NOT NULL,
                    similarity_score DECIMAL(5,4) NOT NULL,
                    support DECIMAL(5,4) NOT NULL,
                    confidence DECIMAL(5,4) NOT NULL,
                    users_with_both INTEGER NOT NULL,
                    users_with_base INTEGER NOT NULL,
                    percentage_also_invest DECIMAL(5,2) NOT NULL,
                    recommendation_strength DECIMAL(5,4) NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(base_asset, recommended_asset)
                );
            """)
            
            # Clear old recommendations
            cur.execute("DELETE FROM asset_recommendations")
            
            # Insert new recommendations
            insert_query = """
                INSERT INTO asset_recommendations (
                    base_asset, recommended_asset, similarity_score, support, confidence,
                    users_with_both, users_with_base, percentage_also_invest, recommendation_strength
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            batch_size = self.config["batch_size"]
            saved_count = 0
            
            for i in range(0, len(recommendations), batch_size):
                batch = recommendations[i:i + batch_size]
                
                batch_data = [
                    (
                        rec["base_asset"],
                        rec["recommended_asset"],
                        rec["similarity_score"],
                        rec["support"],
                        rec["confidence"],
                        rec["users_with_both"],
                        rec["users_with_base"],
                        rec["percentage_also_invest"],
                        rec["recommendation_strength"]
                    )
                    for rec in batch
                ]
                
                cur.executemany(insert_query, batch_data)
                saved_count += len(batch_data)
            
            conn.commit()
            self.logger.info(f"Saved {saved_count} recommendations to database")
            
            # Also sync with Next.js API for easier frontend access
            self._sync_with_nextjs_api(recommendations)
            
            return saved_count
            
        except Exception as e:
            conn.rollback()
            self.logger.error(f"Error saving recommendations: {str(e)}")
            raise
        finally:
            cur.close()
            conn.close()
    
    def _sync_with_nextjs_api(self, recommendations: List[Dict[str, Any]]):
        """
        Sync recommendations with Next.js API
        """
        try:
            import requests
            
            # Format for Next.js API
            formatted_recs = []
            for rec in recommendations:
                formatted_recs.append({
                    "base_asset": rec["base_asset"],
                    "recommended_asset": rec["recommended_asset"],
                    "similarity_score": rec["similarity_score"],
                    "support": rec["support"],
                    "confidence": rec["confidence"],
                    "users_with_both": rec["users_with_both"],
                    "users_with_base": rec["users_with_base"],
                    "percentage_also_invest": rec["percentage_also_invest"],
                    "recommendation_strength": rec["recommendation_strength"]
                })
            
            # Send to Next.js API (you might need to adjust the URL)
            # response = requests.post(
            #     "http://localhost:3000/api/recommendations",
            #     json={"recommendations": formatted_recs}
            # )
            
            self.logger.info(f"Prepared {len(formatted_recs)} recommendations for Next.js sync")
            
        except Exception as e:
            self.logger.warning(f"Could not sync with Next.js API: {str(e)}")
    
    def _get_top_recommendations(self, recommendations: List[Dict[str, Any]], limit: int) -> List[Dict[str, Any]]:
        """
        Get top recommendations for summary
        """
        return recommendations[:limit]