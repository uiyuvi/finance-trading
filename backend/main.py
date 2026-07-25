import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from kite_service import kite_manager
from ticker_service import ticker_manager

app = FastAPI(title="Zerodha Kite Connect Learning Dashboard API", version="1.0.0")

# Enable CORS for local React Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class LoginRequest(BaseModel):
    api_key: str
    api_secret: str
    request_token: str

class SnapshotRequest(BaseModel):
    symbols: List[str]

class StartStreamRequest(BaseModel):
    instruments: List[Dict[str, Any]] # [{"token": 256265, "symbol": "INFY"}]

class HistoricalRequest(BaseModel):
    instrument_token: int
    from_date: str
    to_date: str
    interval: str
    continuous: Optional[bool] = False
    oi: Optional[bool] = False

class SmaBacktestRequest(BaseModel):
    symbol: Optional[str] = "NIFTYBEES"
    from_date: str
    to_date: str
    short_sma: Optional[int] = 10
    long_sma: Optional[int] = 40
    initial_capital: Optional[float] = 500000.0

# Endpoints
@app.get("/")
def read_root():
    return {"message": "Zerodha Kite Connect Dashboard Backend API is running."}

@app.post("/api/login")
def login(req: LoginRequest):
    if not req.api_key or not req.api_secret or not req.request_token:
        raise HTTPException(status_code=400, detail="API Key, API Secret, and Request Token are required.")
    try:
        result = kite_manager.login(req.api_key, req.api_secret, req.request_token)
        return result
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/api/session")
def check_session():
    """Check if valid backend session exists."""
    return kite_manager.check_session()

@app.post("/api/logout")
def logout():
    return kite_manager.logout()

@app.get("/api/user/profile")
def get_user_profile():
    try:
        return kite_manager.get_profile()
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

@app.get("/api/instruments")
def get_instruments(
    exchange: Optional[str] = Query(None),
    underlying: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    instrument_type: Optional[str] = Query(None),
    expiry: Optional[str] = Query(None)
):
    try:
        return kite_manager.get_instruments(
            exchange=exchange,
            underlying=underlying,
            search=search,
            instrument_type=instrument_type,
            expiry=expiry
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/snapshot")
def get_snapshot(req: SnapshotRequest):
    try:
        return kite_manager.get_snapshot(req.symbols)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/realtime/start")
async def start_realtime_stream(req: StartStreamRequest):
    try:
        await ticker_manager.start_stream(
            api_key=kite_manager.api_key or "demo",
            access_token=kite_manager.access_token or "demo",
            tokens_with_symbols=req.instruments,
            is_demo=kite_manager.is_demo
        )
        return {"status": "started", "subscribed": req.instruments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/realtime/stop")
async def stop_realtime_stream():
    try:
        await ticker_manager.stop_stream()
        return {"status": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/realtime/update")
async def update_realtime_stream(req: StartStreamRequest):
    try:
        await ticker_manager.update_subscriptions(req.instruments)
        return {"status": "updated", "subscribed": req.instruments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/api/realtime/stream")
async def websocket_realtime_endpoint(websocket: WebSocket):
    await ticker_manager.connect_client(websocket)
    try:
        while True:
            # Keep connection open and listen for any client messages
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ticker_manager.disconnect_client(websocket)

@app.post("/api/historical")
def get_historical_candles(req: HistoricalRequest):
    try:
        return kite_manager.get_historical(
            instrument_token=req.instrument_token,
            from_date=req.from_date,
            to_date=req.to_date,
            interval=req.interval,
            continuous=req.continuous,
            oi=req.oi
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/backtest/sma")
def run_sma_backtest(req: SmaBacktestRequest):
    try:
        return kite_manager.run_sma_backtest(
            symbol=req.symbol or "NIFTYBEES",
            from_date=req.from_date,
            to_date=req.to_date,
            short_sma=req.short_sma or 10,
            long_sma=req.long_sma or 40,
            initial_capital=req.initial_capital or 500000.0
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
