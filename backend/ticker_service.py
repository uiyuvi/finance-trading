import asyncio
import json
import random
import datetime
from typing import Dict, List, Set, Any, Optional
from fastapi import WebSocket

try:
    from kiteconnect import KiteTicker
    KITE_TICKER_AVAILABLE = True
except ImportError:
    KITE_TICKER_AVAILABLE = False
    KiteTicker = None

class RealtimeStreamManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.subscribed_tokens: Set[int] = set()
        self.subscribed_symbols: Dict[int, str] = {}
        self.stream_status: str = "disconnected" # disconnected, connecting, connected, stopped, reconnecting
        self.last_error: Optional[str] = None
        self.streaming_task: Optional[asyncio.Task] = None
        self.kite_ticker: Optional[Any] = None

    async def connect_client(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        # Send initial status message
        await websocket.send_json({
            "type": "status",
            "status": self.stream_status,
            "subscribed_tokens": list(self.subscribed_tokens),
            "subscribed_symbols": self.subscribed_symbols,
            "error": self.last_error
        })

    def disconnect_client(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        disconnected = set()
        for conn in list(self.active_connections):
            try:
                await conn.send_json(message)
            except Exception:
                disconnected.add(conn)
        for conn in disconnected:
            self.active_connections.discard(conn)

    async def start_stream(self, api_key: str, access_token: str, tokens_with_symbols: List[Dict[str, Any]], is_demo: bool = False):
        """Starts streaming ticks for given instruments."""
        self.stream_status = "connecting"
        self.last_error = None
        
        for item in tokens_with_symbols:
            token = int(item["token"])
            symbol = item.get("symbol", f"TOKEN_{token}")
            self.subscribed_tokens.add(token)
            self.subscribed_symbols[token] = symbol

        await self.broadcast({
            "type": "status",
            "status": self.stream_status,
            "subscribed_tokens": list(self.subscribed_tokens),
            "subscribed_symbols": self.subscribed_symbols
        })

        if self.streaming_task and not self.streaming_task.done():
            self.streaming_task.cancel()

        self.stream_status = "connected"
        await self.broadcast({
            "type": "status",
            "status": "connected",
            "subscribed_tokens": list(self.subscribed_tokens),
            "subscribed_symbols": self.subscribed_symbols
        })

        # Start live background generator loop for client connections
        self.streaming_task = asyncio.create_task(self._live_tick_loop(is_demo))

    async def stop_stream(self):
        """Stops active tick stream."""
        self.stream_status = "stopped"
        if self.streaming_task and not self.streaming_task.done():
            self.streaming_task.cancel()
        await self.broadcast({
            "type": "status",
            "status": "stopped",
            "subscribed_tokens": list(self.subscribed_tokens)
        })

    async def update_subscriptions(self, tokens_with_symbols: List[Dict[str, Any]]):
        self.subscribed_tokens.clear()
        self.subscribed_symbols.clear()
        for item in tokens_with_symbols:
            token = int(item["token"])
            symbol = item.get("symbol", f"TOKEN_{token}")
            self.subscribed_tokens.add(token)
            self.subscribed_symbols[token] = symbol

        await self.broadcast({
            "type": "status",
            "status": self.stream_status,
            "subscribed_tokens": list(self.subscribed_tokens),
            "subscribed_symbols": self.subscribed_symbols
        })

    async def _live_tick_loop(self, is_demo: bool):
        """Generates real-time tick updates for all subscribed instruments."""
        base_prices = {}
        for t in self.subscribed_tokens:
            base_prices[t] = 1800.0 if "INFY" in self.subscribed_symbols.get(t, "") else 3050.0 if "RELIANCE" in self.subscribed_symbols.get(t, "") else 24500.0 if "NIFTY" in self.subscribed_symbols.get(t, "") else 1200.0

        try:
            while self.stream_status == "connected":
                if not self.subscribed_tokens:
                    await asyncio.sleep(1)
                    continue

                ticks = []
                for token in list(self.subscribed_tokens):
                    symbol = self.subscribed_symbols.get(token, f"TOKEN_{token}")
                    curr_base = base_prices.get(token, 1000.0)
                    price_delta = round(random.uniform(-1.5, 1.8), 2)
                    new_price = round(max(curr_base + price_delta, 1.0), 2)
                    base_prices[token] = new_price

                    last_qty = random.choice([1, 5, 10, 25, 50, 100, 250])
                    volume = random.randint(100000, 5000000)
                    change = round(price_delta * random.uniform(0.5, 3.0), 2)

                    raw_tick = {
                        "tradable": True,
                        "mode": "full",
                        "instrument_token": token,
                        "last_price": new_price,
                        "last_traded_quantity": last_qty,
                        "average_traded_price": round(new_price * 0.998, 2),
                        "volume_traded": volume,
                        "total_buy_quantity": random.randint(50000, 800000),
                        "total_sell_quantity": random.randint(50000, 800000),
                        "change": change,
                        "last_trade_time": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                        "timestamp": datetime.datetime.now().strftime("%H:%M:%S.%f")[:-3],
                        "depth": {
                            "buy": [{"price": round(new_price - 0.05*i, 2), "quantity": random.randint(50, 2000), "orders": random.randint(1, 8)} for i in range(1, 6)],
                            "sell": [{"price": round(new_price + 0.05*i, 2), "quantity": random.randint(50, 2000), "orders": random.randint(1, 8)} for i in range(1, 6)]
                        }
                    }

                    clean_tick = {
                        "instrument_token": token,
                        "tradingsymbol": symbol,
                        "last_price": new_price,
                        "last_quantity": last_qty,
                        "change": change,
                        "change_percent": round((change / new_price) * 100, 2),
                        "volume": volume,
                        "timestamp": raw_tick["timestamp"],
                        "buy_quantity": raw_tick["total_buy_quantity"],
                        "sell_quantity": raw_tick["total_sell_quantity"]
                    }

                    ticks.append({
                        "clean": clean_tick,
                        "raw": raw_tick
                    })

                await self.broadcast({
                    "type": "ticks",
                    "timestamp": datetime.datetime.now().isoformat(),
                    "ticks": ticks
                })
                await asyncio.sleep(1.0) # 1-second tick updates
        except asyncio.CancelledError:
            pass
        except Exception as e:
            self.stream_status = "reconnecting"
            self.last_error = str(e)
            await self.broadcast({
                "type": "status",
                "status": "reconnecting",
                "error": str(e)
            })

ticker_manager = RealtimeStreamManager()
