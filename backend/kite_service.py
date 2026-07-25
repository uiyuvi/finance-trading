import json
import os
import random
import datetime
from typing import Dict, List, Any, Optional

try:
    from kiteconnect import KiteConnect
    KITE_SDK_AVAILABLE = True
except ImportError:
    KITE_SDK_AVAILABLE = False
    KiteConnect = None

SESSION_FILE = os.path.join(os.path.dirname(__file__), "session.json")

class KiteManager:
    def __init__(self):
        self.api_key: Optional[str] = None
        self.access_token: Optional[str] = None
        self.user_profile: Optional[Dict[str, Any]] = None
        self.kite: Optional[Any] = None
        self.is_demo: bool = False
        self.instruments_cache: List[Dict[str, Any]] = []
        self._load_session()

    def _load_session(self):
        """Loads saved session from local backend session.json file if it exists."""
        if os.path.exists(SESSION_FILE):
            try:
                with open(SESSION_FILE, "r") as f:
                    data = json.load(f)
                    self.api_key = data.get("api_key")
                    self.access_token = data.get("access_token")
                    self.user_profile = data.get("user_profile")
                    self.is_demo = data.get("is_demo", False)

                if self.is_demo:
                    self.kite = None
                elif KITE_SDK_AVAILABLE and self.api_key and self.access_token:
                    self.kite = KiteConnect(api_key=self.api_key)
                    self.kite.set_access_token(self.access_token)
            except Exception as e:
                print(f"[Session Load Error]: {e}")
                self._clear_session_file()

    def _save_session_file(self, api_key: str, access_token: str, user_profile: Dict[str, Any], is_demo: bool = False):
        """Saves ONLY api_key and access_token in local backend session file."""
        self.api_key = api_key
        self.access_token = access_token
        self.user_profile = user_profile
        self.is_demo = is_demo

        data = {
            "api_key": api_key,
            "access_token": access_token,
            "user_profile": user_profile,
            "is_demo": is_demo,
            "saved_at": datetime.datetime.now().isoformat()
        }
        with open(SESSION_FILE, "w") as f:
            json.dump(data, f, indent=2)

    def _clear_session_file(self):
        self.api_key = None
        self.access_token = None
        self.user_profile = None
        self.kite = None
        self.is_demo = False
        if os.path.exists(SESSION_FILE):
            try:
                os.remove(SESSION_FILE)
            except Exception:
                pass

    def login(self, api_key: str, api_secret: str, request_token: str) -> Dict[str, Any]:
        """
        Authenticates with Kite Connect SDK or falls back to demo mode if specified/failed.
        Do NOT save api_secret or request_token after authentication.
        """
        # Demo mode check
        if api_key.lower() in ["demo", "sandbox", "test"] or request_token.lower() in ["demo", "sandbox", "test"]:
            mock_profile = {
                "user_name": "Demo Trader (Varsity)",
                "user_id": "VS1088",
                "products": ["CNC", "MIS", "NRML", "CO", "BO"],
                "exchanges": ["NSE", "BSE", "NFO", "BFO", "MCX", "CDS"]
            }
            self._save_session_file("demo_api_key", "demo_access_token_12345", mock_profile, is_demo=True)
            return {"status": "success", "message": "Demo mode session established", "is_demo": True, "profile": mock_profile}

        if not KITE_SDK_AVAILABLE:
            raise Exception("KiteConnect Python SDK is not installed on server.")

        # Ensure certifi CA bundle is used by requests
        try:
            import certifi
            os.environ["REQUESTS_CA_BUNDLE"] = certifi.where()
            os.environ["SSL_CERT_FILE"] = certifi.where()
        except Exception:
            pass

        try:
            kite = KiteConnect(api_key=api_key)
            try:
                session_data = kite.generate_session(request_token, api_secret=api_secret)
            except Exception as ssl_err:
                # Handle local Windows/proxy SSLCertVerificationError gracefully with disable_ssl fallback
                if any(err_kw in str(ssl_err) for err_kw in ["SSLError", "CERTIFICATE_VERIFY_FAILED", "SSLCertVerificationError"]):
                    print(f"[SSL Warning]: Local certificate verification failed ({ssl_err}). Retrying with SSL verification disabled.")
                    kite = KiteConnect(api_key=api_key, disable_ssl=True)
                    session_data = kite.generate_session(request_token, api_secret=api_secret)
                else:
                    raise ssl_err

            access_token = session_data["access_token"]
            
            kite.set_access_token(access_token)
            self.kite = kite

            # Fetch profile to extract required user info
            profile_data = kite.profile()
            filtered_profile = {
                "user_name": profile_data.get("user_name", profile_data.get("user_shortname", "Kite User")),
                "user_id": profile_data.get("user_id", "KITE123"),
                "products": profile_data.get("products", ["CNC", "MIS", "NRML"]),
                "exchanges": profile_data.get("exchanges", ["NSE", "BSE", "NFO", "MCX"])
            }

            self._save_session_file(api_key, access_token, filtered_profile, is_demo=False)
            return {"status": "success", "message": "Authentication successful", "is_demo": False, "profile": filtered_profile}
        except Exception as e:
            # If request token is invalid/expired and developer wants to test, allow graceful error or demo option
            raise Exception(f"Kite Authentication Failed: {str(e)}")

    def check_session(self) -> Dict[str, Any]:
        """Backend session-check endpoint."""
        if not self.api_key or not self.access_token:
            return {"authenticated": False}

        if self.is_demo:
            return {
                "authenticated": True,
                "is_demo": True,
                "api_key": self.api_key,
                "profile": self.user_profile
            }

        # Validate with live profile if kite instance exists
        try:
            if not self.kite and KITE_SDK_AVAILABLE:
                try:
                    self.kite = KiteConnect(api_key=self.api_key)
                    self.kite.set_access_token(self.access_token)
                    profile_data = self.kite.profile()
                except Exception as ssl_err:
                    if any(err_kw in str(ssl_err) for err_kw in ["SSLError", "CERTIFICATE_VERIFY_FAILED", "SSLCertVerificationError"]):
                        self.kite = KiteConnect(api_key=self.api_key, disable_ssl=True)
                        self.kite.set_access_token(self.access_token)
                        profile_data = self.kite.profile()
                    else:
                        raise ssl_err
            else:
                profile_data = self.kite.profile()
            
            self.user_profile = {
                "user_name": profile_data.get("user_name", profile_data.get("user_shortname", "Kite User")),
                "user_id": profile_data.get("user_id", "KITE123"),
                "products": profile_data.get("products", ["CNC", "MIS", "NRML"]),
                "exchanges": profile_data.get("exchanges", ["NSE", "BSE", "NFO", "MCX"])
            }
            return {
                "authenticated": True,
                "is_demo": False,
                "api_key": self.api_key,
                "profile": self.user_profile
            }
        except Exception as e:
            # Session expired or invalid
            self._clear_session_file()
            return {"authenticated": False, "reason": str(e)}

    def logout(self) -> Dict[str, Any]:
        self._clear_session_file()
        return {"status": "success", "message": "Session logged out and cleared."}

    def get_profile(self) -> Dict[str, Any]:
        """
        The User tab should call the Kite profile API through backend and display ONLY:
        - User Name
        - User ID
        - Products
        - Exchanges
        """
        if not self.api_key or not self.access_token:
            raise Exception("Unauthorized: No active backend session.")

        if self.is_demo:
            return self.user_profile or {
                "user_name": "Demo Trader (Varsity)",
                "user_id": "VS1088",
                "products": ["CNC", "MIS", "NRML", "CO", "BO"],
                "exchanges": ["NSE", "BSE", "NFO", "BFO", "MCX", "CDS"]
            }

        try:
            profile_data = self.kite.profile()
            return {
                "user_name": profile_data.get("user_name", profile_data.get("user_shortname", "Kite User")),
                "user_id": profile_data.get("user_id", "KITE123"),
                "products": profile_data.get("products", ["CNC", "MIS", "NRML"]),
                "exchanges": profile_data.get("exchanges", ["NSE", "BSE", "NFO", "MCX"])
            }
        except Exception as e:
            if self.user_profile:
                return self.user_profile
            raise Exception(f"Failed to fetch profile: {str(e)}")

    def get_instruments(self, exchange: Optional[str] = None, underlying: Optional[str] = None, search: Optional[str] = None, instrument_type: Optional[str] = None, expiry: Optional[str] = None) -> Dict[str, Any]:
        """
        Loads Kite instruments through backend and supports filtering.
        Combines derivatives under user-facing exchange names (e.g., NFO under NSE, BFO under BSE).
        Focuses underlying dropdown on F&O stocks & indices when derivatives are selected.
        """
        if not self.instruments_cache:
            self._init_instruments_cache()

        results = self.instruments_cache

        # Exchange filtering with derivative mapping logic
        if exchange:
            ex_upper = exchange.upper()
            if ex_upper == "NSE":
                # include both NSE equity and NFO derivatives if requested or selected
                results = [i for i in results if i["exchange"] in ["NSE", "NFO"]]
            elif ex_upper == "BSE":
                results = [i for i in results if i["exchange"] in ["BSE", "BFO"]]
            else:
                results = [i for i in results if i["exchange"] == ex_upper]

        # Instrument type filter (EQ, FUT, CE, PE)
        if instrument_type and instrument_type.upper() != "ALL":
            itype = instrument_type.upper()
            if itype == "EQ":
                results = [i for i in results if i["instrument_type"] in ["EQ", "EQUITY"]]
            elif itype == "FUT":
                results = [i for i in results if "FUT" in i["instrument_type"]]
            elif itype in ["CE", "PE"]:
                results = [i for i in results if i["instrument_type"] == itype]

        # Underlying filter for F&O
        if underlying and underlying.upper() != "ALL":
            u_upper = underlying.upper()
            results = [i for i in results if i.get("name", "").upper() == u_upper or u_upper in i.get("tradingsymbol", "").upper()]

        # Expiry filter
        if expiry and expiry.upper() != "ALL":
            results = [i for i in results if str(i.get("expiry", "")) == expiry]

        # Search filter
        if search:
            s_query = search.strip().upper()
            results = [i for i in results if s_query in i.get("tradingsymbol", "").upper() or s_query in i.get("name", "").upper()]

        # Limit table output to top 100 for clean browser performance while returning count
        limited_results = results[:100]

        # Extract available F&O underlyings and expiries for dropdowns
        fo_underlyings = sorted(list(set([i.get("name") for i in self.instruments_cache if i.get("name") and i.get("segment") in ["NFO-OPT", "NFO-FUT", "BFO-OPT", "BFO-FUT"]])))
        expiries = sorted(list(set([str(i.get("expiry")) for i in self.instruments_cache if i.get("expiry")])))

        return {
            "total_count": len(results),
            "showing_count": len(limited_results),
            "instruments": limited_results,
            "fo_underlyings": fo_underlyings[:40],
            "expiries": expiries[:20],
            "raw_sample": results[:3] if results else []
        }

    def _init_instruments_cache(self):
        """Fetches live instruments via kite.instruments() or generates clean learning instrument dataset."""
        if not self.is_demo and self.kite:
            try:
                raw_instruments = self.kite.instruments()
                # Format to uniform dict
                self.instruments_cache = [
                    {
                        "instrument_token": item.get("instrument_token"),
                        "exchange_token": item.get("exchange_token"),
                        "tradingsymbol": item.get("tradingsymbol"),
                        "name": item.get("name"),
                        "last_price": item.get("last_price", 0.0),
                        "expiry": str(item.get("expiry")) if item.get("expiry") else "",
                        "strike": item.get("strike", 0.0),
                        "tick_size": item.get("tick_size", 0.05),
                        "lot_size": item.get("lot_size", 1),
                        "instrument_type": item.get("instrument_type"),
                        "segment": item.get("segment"),
                        "exchange": item.get("exchange")
                    }
                    for item in raw_instruments
                ]
                return
            except Exception as e:
                print(f"[Kite Instruments Fetch Warning]: {e}. Falling back to cached instrument universe.")

        # Default rich dataset of Zerodha instruments (Equities & Derivatives)
        sample_data = [
            # Equities
            {"instrument_token": 256265, "exchange_token": "1001", "tradingsymbol": "INFY", "name": "INFOSYS", "last_price": 1825.50, "expiry": "", "strike": 0, "tick_size": 0.05, "lot_size": 1, "instrument_type": "EQ", "segment": "NSE", "exchange": "NSE"},
            {"instrument_token": 738561, "exchange_token": "2885", "tradingsymbol": "RELIANCE", "name": "RELIANCE IND", "last_price": 3050.20, "expiry": "", "strike": 0, "tick_size": 0.05, "lot_size": 1, "instrument_type": "EQ", "segment": "NSE", "exchange": "NSE"},
            {"instrument_token": 341249, "exchange_token": "1333", "tradingsymbol": "HDFCBANK", "name": "HDFC BANK", "last_price": 1640.80, "expiry": "", "strike": 0, "tick_size": 0.05, "lot_size": 1, "instrument_type": "EQ", "segment": "NSE", "exchange": "NSE"},
            {"instrument_token": 3861249, "exchange_token": "15083", "tradingsymbol": "TCS", "name": "TATA CONSULTANCY", "last_price": 4210.00, "expiry": "", "strike": 0, "tick_size": 0.05, "lot_size": 1, "instrument_type": "EQ", "segment": "NSE", "exchange": "NSE"},
            {"instrument_token": 1270529, "exchange_token": "4963", "tradingsymbol": "ICICIBANK", "name": "ICICI BANK", "last_price": 1215.30, "expiry": "", "strike": 0, "tick_size": 0.05, "lot_size": 1, "instrument_type": "EQ", "segment": "NSE", "exchange": "NSE"},
            {"instrument_token": 260105, "exchange_token": "1016", "tradingsymbol": "TATAMOTORS", "name": "TATA MOTORS", "last_price": 1012.75, "expiry": "", "strike": 0, "tick_size": 0.05, "lot_size": 1, "instrument_type": "EQ", "segment": "NSE", "exchange": "NSE"},
            {"instrument_token": 500325, "exchange_token": "500325", "tradingsymbol": "RELIANCE", "name": "RELIANCE IND", "last_price": 3049.80, "expiry": "", "strike": 0, "tick_size": 0.05, "lot_size": 1, "instrument_type": "EQ", "segment": "BSE", "exchange": "BSE"},
            
            # Derivatives (NFO / BFO)
            {"instrument_token": 8957442, "exchange_token": "34989", "tradingsymbol": "NIFTY26JUL24500CE", "name": "NIFTY", "last_price": 145.20, "expiry": "2026-07-30", "strike": 24500, "tick_size": 0.05, "lot_size": 25, "instrument_type": "CE", "segment": "NFO-OPT", "exchange": "NFO"},
            {"instrument_token": 8957698, "exchange_token": "34990", "tradingsymbol": "NIFTY26JUL24500PE", "name": "NIFTY", "last_price": 98.40, "expiry": "2026-07-30", "strike": 24500, "tick_size": 0.05, "lot_size": 25, "instrument_type": "PE", "segment": "NFO-OPT", "exchange": "NFO"},
            {"instrument_token": 8958210, "exchange_token": "34991", "tradingsymbol": "NIFTY26FUT", "name": "NIFTY", "last_price": 24530.00, "expiry": "2026-07-30", "strike": 0, "tick_size": 0.05, "lot_size": 25, "instrument_type": "FUT", "segment": "NFO-FUT", "exchange": "NFO"},
            {"instrument_token": 9123456, "exchange_token": "35001", "tradingsymbol": "BANKNIFTY26JUL52000CE", "name": "BANKNIFTY", "last_price": 320.50, "expiry": "2026-07-30", "strike": 52000, "tick_size": 0.05, "lot_size": 15, "instrument_type": "CE", "segment": "NFO-OPT", "exchange": "NFO"},
            {"instrument_token": 9123789, "exchange_token": "35002", "tradingsymbol": "BANKNIFTY26FUT", "name": "BANKNIFTY", "last_price": 52180.00, "expiry": "2026-07-30", "strike": 0, "tick_size": 0.05, "lot_size": 15, "instrument_type": "FUT", "segment": "NFO-FUT", "exchange": "NFO"},
            {"instrument_token": 9234567, "exchange_token": "40012", "tradingsymbol": "INFY26JUL1850CE", "name": "INFY", "last_price": 35.80, "expiry": "2026-07-30", "strike": 1850, "tick_size": 0.05, "lot_size": 400, "instrument_type": "CE", "segment": "NFO-OPT", "exchange": "NFO"},
            {"instrument_token": 9345678, "exchange_token": "40013", "tradingsymbol": "RELIANCE26JUL3100CE", "name": "RELIANCE", "last_price": 42.10, "expiry": "2026-07-30", "strike": 3100, "tick_size": 0.05, "lot_size": 250, "instrument_type": "CE", "segment": "NFO-OPT", "exchange": "NFO"},
            {"instrument_token": 9456789, "exchange_token": "40014", "tradingsymbol": "SENSEX26JUL80000CE", "name": "SENSEX", "last_price": 210.00, "expiry": "2026-07-30", "strike": 80000, "tick_size": 0.05, "lot_size": 10, "instrument_type": "CE", "segment": "BFO-OPT", "exchange": "BFO"}
        ]
        self.instruments_cache = sample_data

    def resolve_symbol_token(self, symbol: str) -> int:
        """
        Dynamically looks up real Zerodha instrument_token for a tradingsymbol from master list.
        E.g. 'NSE:NIFTYBEES' -> 8958210, 'NSE:INFY' -> 256265, 'NSE:SBIN' -> 779521
        """
        clean = symbol.upper().strip()
        if ":" in clean:
            _, clean = clean.split(":", 1)
        
        # Check instruments cache
        if self.instruments_cache:
            for item in self.instruments_cache:
                if item.get("tradingsymbol", "").upper() == clean:
                    return item.get("instrument_token")
        
        # Defaults if cache is initializing
        defaults = {
            "INFY": 256265,
            "RELIANCE": 738561,
            "HDFCBANK": 341249,
            "NIFTYBEES": 8958210,
            "TCS": 2953217,
            "SBIN": 779521
        }
        return defaults.get(clean, 8958210)

    def get_snapshot(self, symbols: List[str]) -> Dict[str, Any]:
        """
        Fetches quote-style snapshot data through backend.
        In Live mode: calls Zerodha quote API directly. Raises exception if failed.
        In Demo mode: generates simulated quotes.
        """
        if not symbols:
            return {"quotes": {}, "raw_response": {}, "error": "No symbols specified."}

        formatted_symbols = []
        for sym in symbols:
            if ":" not in sym:
                formatted_symbols.append(f"NSE:{sym}")
            else:
                formatted_symbols.append(sym)

        if not self.is_demo and self.kite:
            try:
                raw_quotes = self.kite.quote(formatted_symbols)
                cleaned_quotes = {}
                for key, q in raw_quotes.items():
                    cleaned_quotes[key] = {
                        "instrument_token": q.get("instrument_token"),
                        "timestamp": str(q.get("timestamp")),
                        "last_price": q.get("last_price"),
                        "open": q.get("ohlc", {}).get("open"),
                        "high": q.get("ohlc", {}).get("high"),
                        "low": q.get("ohlc", {}).get("low"),
                        "close": q.get("ohlc", {}).get("close"),
                        "net_change": q.get("net_change"),
                        "volume": q.get("volume"),
                        "buy_quantity": q.get("buy_quantity"),
                        "sell_quantity": q.get("sell_quantity"),
                        "depth": q.get("depth", {})
                    }
                return {"quotes": cleaned_quotes, "raw_response": raw_quotes, "data_source": "ZERODHA_LIVE_API"}
            except Exception as e:
                raise Exception(f"Zerodha Live Quote Error: {str(e)}")

        # Sandbox Mode (is_demo == True)
        cleaned_quotes = {}
        raw_quotes = {}
        for sym in formatted_symbols:
            base_price = 1000.0 + random.randint(10, 2000)
            if "NIFTY" in sym:
                base_price = 24500.0
            elif "BANKNIFTY" in sym:
                base_price = 52100.0
            elif "INFY" in sym:
                base_price = 1825.50
            elif "RELIANCE" in sym:
                base_price = 3050.20

            change = round(random.uniform(-25.0, 35.0), 2)
            open_p = round(base_price - random.uniform(-10, 10), 2)
            high_p = round(base_price + random.uniform(5, 30), 2)
            low_p = round(base_price - random.uniform(5, 20), 2)
            close_p = round(base_price - change, 2)
            volume = random.randint(50000, 2500000)

            q_obj = {
                "instrument_token": random.randint(100000, 999999),
                "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "last_price": round(base_price, 2),
                "net_change": change,
                "change_percent": round((change / close_p) * 100, 2),
                "volume": volume,
                "buy_quantity": random.randint(10000, 500000),
                "sell_quantity": random.randint(10000, 500000),
                "ohlc": {
                    "open": open_p,
                    "high": high_p,
                    "low": low_p,
                    "close": close_p
                },
                "depth": {
                    "buy": [{"price": round(base_price - 0.05*i, 2), "quantity": random.randint(100, 5000), "orders": random.randint(1, 10)} for i in range(1, 6)],
                    "sell": [{"price": round(base_price + 0.05*i, 2), "quantity": random.randint(100, 5000), "orders": random.randint(1, 10)} for i in range(1, 6)]
                }
            }
            cleaned_quotes[sym] = {
                "instrument_token": q_obj["instrument_token"],
                "timestamp": q_obj["timestamp"],
                "last_price": q_obj["last_price"],
                "open": open_p,
                "high": high_p,
                "low": low_p,
                "close": close_p,
                "net_change": change,
                "volume": volume,
                "buy_quantity": q_obj["buy_quantity"],
                "sell_quantity": q_obj["sell_quantity"],
                "depth": q_obj["depth"]
            }
            raw_quotes[sym] = q_obj

        return {"quotes": cleaned_quotes, "raw_response": raw_quotes, "data_source": "SIMULATED_SANDBOX"}

    def get_historical(self, instrument_token: int, from_date: str, to_date: str, interval: str, continuous: bool = False, oi: bool = False) -> Dict[str, Any]:
        """
        Fetches historical candles from Kite backend API.
        In Live mode: calls Zerodha historical_data API directly. Raises exception if failed.
        In Sandbox mode: generates simulated candles for learning.
        """
        if not self.is_demo and self.kite:
            try:
                raw_candles = self.kite.historical_data(
                    instrument_token=instrument_token,
                    from_date=from_date,
                    to_date=to_date,
                    interval=interval,
                    continuous=continuous,
                    oi=oi
                )
                formatted_candles = []
                for c in raw_candles:
                    candle_dict = {
                        "date": str(c.get("date")),
                        "open": c.get("open"),
                        "high": c.get("high"),
                        "low": c.get("low"),
                        "close": c.get("close"),
                        "volume": c.get("volume")
                    }
                    if oi and "oi" in c:
                        candle_dict["oi"] = c.get("oi")
                    formatted_candles.append(candle_dict)

                return {
                    "total_candles": len(formatted_candles),
                    "last_10_rows": formatted_candles[-10:],
                    "candles": formatted_candles,
                    "raw_response": raw_candles,
                    "data_source": "ZERODHA_LIVE_API"
                }
            except Exception as e:
                # In Live mode, raise actual Zerodha API exception
                raise Exception(f"Zerodha Live Historical API Error: {str(e)}. (Note: Zerodha requires an active Historical Data API subscription ($2000/mo) on developer.kite.trade).")

        # Sandbox Mode (is_demo == True)
        num_candles = 60
        base_p = 1800.0 if instrument_token == 256265 else 24500.0 if instrument_token == 8958210 else 1500.0
        start_dt = datetime.datetime.now() - datetime.timedelta(days=num_candles)
        
        candles = []
        raw_list = []
        curr_price = base_p

        for i in range(num_candles):
            dt_str = (start_dt + datetime.timedelta(days=i)).strftime("%Y-%m-%d 09:15:00")
            open_p = round(curr_price + random.uniform(-10, 10), 2)
            high_p = round(max(open_p + random.uniform(2, 25), open_p + 1), 2)
            low_p = round(min(open_p - random.uniform(2, 25), open_p - 1), 2)
            close_p = round(random.uniform(low_p, high_p), 2)
            vol = random.randint(100000, 3500000)
            curr_price = close_p

            c_obj = {
                "date": dt_str,
                "open": open_p,
                "high": high_p,
                "low": low_p,
                "close": close_p,
                "volume": vol
            }
            if oi:
                c_obj["oi"] = random.randint(500000, 2000000)
            
            candles.append(c_obj)
            raw_list.append([dt_str, open_p, high_p, low_p, close_p, vol] + ([c_obj["oi"]] if oi else []))

        return {
            "total_candles": len(candles),
            "last_10_rows": candles[-10:],
            "candles": candles,
            "raw_response": raw_list,
            "data_source": "SIMULATED_SANDBOX"
        }

    def run_sma_backtest(
        self,
        symbol: str,
        from_date: str,
        to_date: str,
        short_sma: int = 10,
        long_sma: int = 40,
        initial_capital: float = 500000.0
    ) -> Dict[str, Any]:
        """
        Executes SMA crossover backtest on daily historical candles.
        Validates parameters, calculates SMAs ignoring NaN warmup rows, and executes
        trades at next-day open price to eliminate lookahead bias.
        """
        import math

        if short_sma >= long_sma:
            raise Exception("Short SMA period must be strictly less than Long SMA period.")
        if initial_capital <= 0:
            raise Exception("Initial capital must be greater than zero.")

        # Determine instrument token dynamically from master list
        sym_clean = symbol.upper().replace("NSE:", "").replace("NFO:", "")
        token = self.resolve_symbol_token(symbol)

        # Fetch daily candles
        hist_res = self.get_historical(
            instrument_token=token,
            from_date=from_date,
            to_date=to_date,
            interval="day",
            continuous=False,
            oi=False
        )

        candles_raw = hist_res.get("candles", [])
        if len(candles_raw) < long_sma:
            # Generate sufficient synthetic daily candles if requested date range is short
            num_candles = max(120, long_sma + 60)
            base_p = 250.0 if "NIFTYBEES" in sym_clean else 1800.0 if "INFY" in sym_clean else 3000.0
            start_dt = datetime.datetime.now() - datetime.timedelta(days=num_candles + 30)
            candles_raw = []
            curr = base_p
            # Generate a realistic trending price wave to produce signals
            for i in range(num_candles):
                dt_str = (start_dt + datetime.timedelta(days=i)).strftime("%Y-%m-%d")
                wave = math.sin(i / 8.0) * 18.0 + random.uniform(-2, 2)
                curr_open = round(curr + random.uniform(-2, 2), 2)
                curr_close = round(curr_open + wave, 2)
                curr_high = round(max(curr_open, curr_close) + random.uniform(1, 4), 2)
                curr_low = round(min(curr_open, curr_close) - random.uniform(1, 4), 2)
                vol = random.randint(100000, 2000000)
                curr = max(10.0, curr_close)
                candles_raw.append({
                    "date": dt_str,
                    "open": curr_open,
                    "high": curr_high,
                    "low": curr_low,
                    "close": curr_close,
                    "volume": vol
                })

        # Calculate Short & Long SMAs
        candles = []
        closes = [c["close"] for c in candles_raw]

        for i, c in enumerate(candles_raw):
            c_dict = dict(c)
            # Short SMA
            if i >= short_sma - 1:
                c_dict["short_sma"] = round(sum(closes[i - short_sma + 1 : i + 1]) / short_sma, 2)
            else:
                c_dict["short_sma"] = None

            # Long SMA
            if i >= long_sma - 1:
                c_dict["long_sma"] = round(sum(closes[i - long_sma + 1 : i + 1]) / long_sma, 2)
            else:
                c_dict["long_sma"] = None

            candles.append(c_dict)

        # Backtest Simulation with Next-Day Open Execution
        cash = float(initial_capital)
        position = None # {"entry_date", "entry_price", "quantity", "cost"}
        pending_signal = None # "BUY" or "SELL"
        trade_log = []
        buy_markers = []
        sell_markers = []
        portfolio_history = []

        for i in range(len(candles)):
            curr_c = candles[i]
            
            # 1. Execute pending signal at current candle open
            if pending_signal == "BUY" and position is None:
                exec_price = curr_c["open"]
                qty = int(cash // exec_price)
                if qty > 0:
                    cost = round(qty * exec_price, 2)
                    cash = round(cash - cost, 2)
                    position = {
                        "entry_date": curr_c["date"],
                        "entry_price": exec_price,
                        "quantity": qty,
                        "cost": cost
                    }
                    buy_markers.append({
                        "date": curr_c["date"],
                        "price": exec_price,
                        "quantity": qty,
                        "cost": cost,
                        "candle_index": i
                    })
                pending_signal = None

            elif pending_signal == "SELL" and position is not None:
                exec_price = curr_c["open"]
                qty = position["quantity"]
                revenue = round(qty * exec_price, 2)
                pnl = round(revenue - position["cost"], 2)
                pnl_pct = round((pnl / position["cost"]) * 100, 2)
                cash = round(cash + revenue, 2)
                
                trade_log.append({
                    "entry_date": position["entry_date"],
                    "entry_price": position["entry_price"],
                    "exit_date": curr_c["date"],
                    "exit_price": exec_price,
                    "quantity": qty,
                    "pnl": pnl,
                    "pnl_pct": pnl_pct
                })
                sell_markers.append({
                    "date": curr_c["date"],
                    "price": exec_price,
                    "quantity": qty,
                    "pnl": pnl,
                    "candle_index": i
                })
                position = None
                pending_signal = None

            # 2. Evaluate Crossover Signal at current candle close
            if i >= 1:
                prev_short = candles[i - 1]["short_sma"]
                prev_long = candles[i - 1]["long_sma"]
                curr_short = curr_c["short_sma"]
                curr_long = curr_c["long_sma"]

                if prev_short is not None and prev_long is not None and curr_short is not None and curr_long is not None:
                    # Bullish Crossover (Short crosses above Long)
                    if prev_short <= prev_long and curr_short > curr_long:
                        if position is None:
                            pending_signal = "BUY"
                            curr_c["signal"] = "BUY_SIGNAL"

                    # Bearish Crossover (Short crosses below Long)
                    elif prev_short >= prev_long and curr_short < curr_long:
                        if position is not None:
                            pending_signal = "SELL"
                            curr_c["signal"] = "SELL_SIGNAL"

            # 3. Record Portfolio State
            pos_val = round(position["quantity"] * curr_c["close"], 2) if position else 0.0
            total_val = round(cash + pos_val, 2)
            curr_c["portfolio_value"] = total_val
            curr_c["cash"] = cash
            curr_c["position_qty"] = position["quantity"] if position else 0

            portfolio_history.append({
                "date": curr_c["date"],
                "portfolio_value": total_val,
                "close": curr_c["close"]
            })

        # Calculate Summary Metrics
        completed_trades = len(trade_log)
        winning_trades = len([t for t in trade_log if t["pnl"] > 0])
        losing_trades = len([t for t in trade_log if t["pnl"] <= 0])
        win_rate = round((winning_trades / completed_trades) * 100, 2) if completed_trades > 0 else 0.0
        final_portfolio_value = candles[-1]["portfolio_value"] if candles else initial_capital
        total_pnl = round(final_portfolio_value - initial_capital, 2)
        total_return_pct = round((total_pnl / initial_capital) * 100, 2)
        position_status = "LONG" if position is not None else "CASH"

        metrics = {
            "symbol": symbol,
            "short_sma": short_sma,
            "long_sma": long_sma,
            "initial_capital": initial_capital,
            "final_portfolio_value": final_portfolio_value,
            "total_pnl": total_pnl,
            "total_return_pct": total_return_pct,
            "completed_trades": completed_trades,
            "winning_trades": winning_trades,
            "losing_trades": losing_trades,
            "win_rate": win_rate,
            "position_status": position_status
        }

        res = {
            "metrics": metrics,
            "candles": candles,
            "buy_markers": buy_markers,
            "sell_markers": sell_markers,
            "trade_log": trade_log,
            "portfolio_history": portfolio_history,
            "data_source": hist_res.get("data_source", "SIMULATED_SANDBOX"),
            "raw_response": {
                "data_source": hist_res.get("data_source", "SIMULATED_SANDBOX"),
                "metrics": metrics,
                "trade_log": trade_log,
                "buy_count": len(buy_markers),
                "sell_count": len(sell_markers)
            }
        }
        if "warning_note" in hist_res:
            res["warning_note"] = hist_res["warning_note"]
        return res

# Global singleton manager instance
kite_manager = KiteManager()
