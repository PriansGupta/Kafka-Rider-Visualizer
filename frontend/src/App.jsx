import React, { useState, useEffect, useRef } from 'react';
import { Home, Store, Clock, CheckCircle, Navigation, Package, Server, Activity } from 'lucide-react';
import './App.css'; // Import the new CSS file

export default function App() {
  const [orderState, setOrderState] = useState('IDLE');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [eta, setEta] = useState('--');
  const [orderId, setOrderId] = useState(null);
  const ws = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => ws.current?.close();
  }, []);

  const connectWebSocket = () => {
    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => addLog('🟢 Connected to UI Updater WebSocket');
    ws.current.onclose = () => addLog('🔴 Disconnected from WebSocket');

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addLog(`📥 [Kafka Event] ${data.status} | Lat: ${data.location.lat.toFixed(4)}`);

      setOrderState(data.status);
      setOrderId(data.orderId);

      if (data.status === 'DELIVERED') {
        setProgress(100);
        setEta('Arrived!');
      } else {
        const currentStep = data.step || 1;
        setProgress((currentStep / 10) * 100);
        setEta(`${30 - (currentStep * 3)} mins`);
      }
    };
  };

  const addLog = (msg) => {
    setLogs((prev) => {
      const newLogs = [...prev, `${new Date().toLocaleTimeString()} - ${msg}`];
      return newLogs.slice(-10);
    });
  };

  const placeOrder = async () => {
    if (orderState === 'IN_TRANSIT') return;

    setOrderState('IDLE');
    setProgress(0);
    setEta('Calculating...');
    addLog('🚀 Placing new order...');

    try {
      await fetch('http://localhost:3001/place-order', { method: 'POST' });
      addLog('✅ Order placed! Waiting for rider assignment...');
    } catch (err) {
      addLog('❌ Failed to connect to Producer API. Is it running on port 3001?');
    }
  };

  return (
    <div className="app-wrapper">
      <div className="main-container">

        {/* Header */}
        <div className="header-box">
          <div>
            <h1 className="header-title">
              <Package color="#4ade80" />
              Kafka Eats Delivery
            </h1>
            <p className="header-subtitle">
              <Server size={16} /> Microservices Live Tracking
            </p>
          </div>
          <button
            onClick={placeOrder}
            disabled={orderState === 'IN_TRANSIT'}
            className="btn-place-order"
          >
            {orderState === 'IN_TRANSIT' ? 'Order in Progress...' : '🍔 Place Order'}
          </button>
        </div>

        <div className="content-grid">
          {/* Tracking Map & Status */}
          <div className="map-card">
            <div className="map-header">
              <div>
                <h2>Order Status</h2>
                <p className="order-id">{orderId || 'Awaiting Order'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2>Estimated ETA</h2>
                <p className="eta-display">
                  <Clock size={24} /> {eta}
                </p>
              </div>
            </div>

            {/* The Imaginary Straight Line Map */}
            <div className="track-container">
              {/* Background Track */}
              <div className="track-bg"></div>

              {/* Active Progress Track */}
              <div className="track-progress" style={{ width: `${progress}%` }}></div>

              {/* Waypoints */}
              <div className="waypoint waypoint-start">
                <Store size={24} color="#9ca3af" />
              </div>

              {/* Moving Rider */}
              <div className="rider-marker" style={{ left: `${progress}%` }}>
                <Navigation size={24} className="rider-icon-rotate" />
              </div>

              <div className="waypoint waypoint-end">
                <Home size={24} color="#4ade80" />
              </div>
            </div>

            <div className="location-labels">
              <span>Restaurant</span>
              <span>Your House</span>
            </div>

            {orderState === 'DELIVERED' && (
              <div className="success-banner">
                <CheckCircle />
                <span style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>
                  Order Delivered Successfully! Payment process triggered on backend.
                </span>
              </div>
            )}
          </div>

          {/* Live System Logs */}
          <div className="logs-card">
            <h2 className="logs-header">
              <Activity size={20} color="#60a5fa" />
              Live Kafka Stream
            </h2>
            <div className="logs-window">
              {logs.length === 0 ? (
                <p className="log-empty">Waiting for events...</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={log.includes('DELIVERED') ? 'log-success' : 'log-entry'}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}