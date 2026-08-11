import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ParkingMap from '../components/ParkingMap';
import SlotCard from '../components/SlotCard';
import { subscribeToSlotUpdates, unsubscribeFromSlotUpdates, joinFacilityRoom, leaveFacilityRoom } from '../services/socket';
import { Sparkles, Navigation, AlertCircle, CreditCard, ShieldCheck, CheckCircle2, QrCode, X, Clock, HelpCircle, Landmark } from 'lucide-react';

const ParkingFinder = ({ setActiveTab }) => {
  const [facilities, setFacilities] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // AI Recommendation State
  const [recommendation, setRecommendation] = useState(null);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Payment System State
  const [showPaymentPage, setShowPaymentPage] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
  // Card mock inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  
  // UPI mock inputs
  const [upiId, setUpiId] = useState('');

  // Success Popup State
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [completedReservation, setCompletedReservation] = useState(null);

  // Fetch initial configuration data
  useEffect(() => {
    const loadInitData = async () => {
      try {
        const resFacs = await api.parking.listFacilities();
        const resVehicles = await api.vehicles.list();
        
        setFacilities(resFacs.data);
        setVehicles(resVehicles.data);
        
        if (resFacs.data.length > 0) {
          setSelectedFacilityId(resFacs.data[0]._id);
        }
        if (resVehicles.data.length > 0) {
          setSelectedVehicleId(resVehicles.data[0]._id);
        }
      } catch (err) {
        setError('Failed to load facilities or vehicles.');
      } finally {
        setLoading(false);
      }
    };
    loadInitData();
  }, []);

  // Fetch slots whenever selected facility changes
  useEffect(() => {
    if (!selectedFacilityId) return;

    const loadSlots = async () => {
      try {
        const resSlots = await api.parking.getSlots(selectedFacilityId);
        setSlots(resSlots.data);
        setSelectedSlot(null);
        setRecommendation(null);
        
        // Join facility Socket.IO room for real-time slot state syncs
        joinFacilityRoom(selectedFacilityId);
      } catch (err) {
        setError('Failed to load parking slots.');
      }
    };

    loadSlots();

    // Subscribe to WebSocket updates for slots in this facility
    subscribeToSlotUpdates((updatedSlot) => {
      setSlots(prevSlots =>
        prevSlots.map(s => s._id === updatedSlot._id ? { ...s, ...updatedSlot } : s)
      );
      
      // Update sidebar if the selected slot is updated
      setSelectedSlot(prev => {
        if (prev?._id === updatedSlot._id) {
          return { ...prev, ...updatedSlot };
        }
        return prev;
      });
    });

    return () => {
      if (selectedFacilityId) {
        leaveFacilityRoom(selectedFacilityId);
      }
      unsubscribeFromSlotUpdates();
    };
  }, [selectedFacilityId]);

  // Request Recommendation
  const handleGetRecommendation = async () => {
    if (!selectedVehicleId) {
      setRecError('Please select a vehicle to get a tailored recommendation.');
      return;
    }
    
    setRecError('');
    setRecLoading(true);
    setRecommendation(null);

    try {
      const res = await api.parking.getRecommendation(selectedFacilityId, selectedVehicleId);
      if (res.success && res.data.recommended) {
        setRecommendation(res.data);
        
        // Load the recommended slot details into the map/sidebar
        const recommendedSlotObj = slots.find(s => s._id === res.data.recommended.slot._id);
        setSelectedSlot({
          ...recommendedSlotObj,
          currentPrice: res.data.recommended.currentPrice,
          pricingExplanation: res.data.recommended.pricingExplanation
        });
      } else {
        setRecError(res.data.message || 'No suitable slots found.');
      }
    } catch (err) {
      setRecError(err.message || 'Error running recommendation engine.');
    } finally {
      setRecLoading(false);
    }
  };

  // Intermediate function to initiate checkout instead of direct reserve
  const handleInitiateReserve = (bookingData) => {
    setError('');
    setSuccess('');
    
    // Parse duration and calculate prices
    const start = new Date(bookingData.startTime);
    const end = new Date(bookingData.endTime);
    const hours = Math.ceil((end - start) / (1000 * 60 * 60)) || 1;
    const rate = selectedSlot.currentPrice || 40;
    const totalPrice = rate * hours;

    // Get vehicle registration details
    const chosenVehicle = vehicles.find(v => v._id === bookingData.vehicleId);

    setPaymentData({
      ...bookingData,
      hours,
      totalPrice,
      slot: selectedSlot,
      vehicle: chosenVehicle
    });

    // Reset payment states
    setPaymentMethod('UPI');
    setPaymentError('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setUpiId('');
    
    setShowPaymentPage(true);
  };

  // Mock Payment Confirmation Flow
  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    setIsPaying(true);

    // Basic validation depending on method
    if (paymentMethod === 'Card') {
      if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
        setPaymentError('Please fill in all credit card details.');
        setIsPaying(false);
        return;
      }
    } else if (paymentMethod === 'UPI') {
      if (!upiId) {
        setPaymentError('Please enter your UPI ID.');
        setIsPaying(false);
        return;
      }
    }

    try {
      // Simulate Payment Gateway latency
      await new Promise(resolve => setTimeout(resolve, 1800));

      const txnId = 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase();

      // Submit reservation to backend database
      const res = await api.reservations.create({
        vehicleId: paymentData.vehicleId,
        facilityId: paymentData.facilityId,
        slotId: paymentData.slotId,
        startTime: paymentData.startTime,
        endTime: paymentData.endTime,
        paymentMethod: paymentMethod,
        transactionId: txnId
      });

      if (res.success) {
        setCompletedReservation(res.data);
        setShowPaymentPage(false);
        setShowSuccessPopup(true);

        // Reload slot mappings
        const resSlots = await api.parking.getSlots(selectedFacilityId);
        setSlots(resSlots.data);
        setSelectedSlot(null);
        setRecommendation(null);
      }
    } catch (err) {
      setPaymentError(err.message || 'Payment authentication failed. Access denied.');
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) return <div className="main-content"><p className="text-muted">Loading Parking Finder...</p></div>;

  return (
    <div className="main-content" style={{ position: 'relative' }}>
      <h1>Parking Finder & Booking</h1>
      <p className="text-muted">Select your facility, run our AI scorer to find the best slot, or reserve manually.</p>

      {success && <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderLeft: '4px solid var(--color-success)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{success}</div>}
      {error && <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', borderLeft: '4px solid var(--color-danger)', color: 'var(--color-danger)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>{error}</div>}

      {/* Control panel Row */}
      <div className="card" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'end', marginBottom: '2.5rem' }}>
        <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
          <label className="form-label">Select Parking Facility</label>
          <select
            className="form-input"
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
          >
            {facilities.map(f => (
              <option key={f._id} value={f._id}>{f.name} ({f.location})</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: '1', minWidth: '200px', marginBottom: 0 }}>
          <label className="form-label">Select Your Vehicle</label>
          <select
            className="form-input"
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
          >
            <option value="">-- Choose Vehicle --</option>
            {vehicles.map(v => (
              <option key={v._id} value={v._id}>
                {v.registrationNumber} ({v.type} - {v.isEV ? 'EV' : 'Gas'})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGetRecommendation}
          className="btn btn-primary"
          style={{ height: '42px', padding: '0 1.5rem', display: 'flex', gap: '0.5rem', background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}
          disabled={recLoading || !selectedVehicleId}
        >
          <Sparkles size={16} />
          <span>{recLoading ? 'Calculating...' : 'Find Best Slot (AI)'}</span>
        </button>
      </div>

      {/* AI recommendation explanation alert */}
      {recommendation && (
        <div className="card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', borderColor: 'var(--color-warning)', backgroundColor: 'rgba(234, 179, 8, 0.05)', marginBottom: '2.5rem', animation: 'slideDown 0.3s ease-out' }}>
          <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'var(--color-warning)', padding: '0.85rem', borderRadius: '50%', flexShrink: 0 }}>
            <Sparkles size={24} />
          </div>
          <div style={{ flexGrow: 1 }}>
            <h3 style={{ margin: 0, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Tailored AI Smart Recommendation (Score: {recommendation.recommended.score}%)
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: 'var(--color-text-secondary)' }}>
              {recommendation.recommended.explanation}
            </p>
          </div>
          {recommendation.alternatives.length > 0 && (
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', minWidth: '180px' }}>
              <span className="text-muted">Alternatives:</span>
              {recommendation.alternatives.map(alt => (
                <div key={alt.slot._id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => {
                      const sObj = slots.find(s => s._id === alt.slot._id);
                      setSelectedSlot(sObj);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', textDecoration: 'underline', padding: 0, cursor: 'pointer', fontSize: '0.8rem', textAlign: 'left' }}
                  >
                    Slot {alt.slot.slotNumber}
                  </button>
                  <span className="text-muted">({alt.distance}m)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {recError && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--color-danger)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <AlertCircle size={16} />
          <span>{recError}</span>
        </div>
      )}

      {/* Main Map + Card Panel Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <div className="card">
          <ParkingMap
            slots={slots}
            selectedSlotId={selectedSlot?._id}
            onSelectSlot={(slot) => {
              setSelectedSlot(slot);
              setSuccess('');
            }}
          />
        </div>
        
        <div>
          <SlotCard
            slot={selectedSlot}
            vehicles={vehicles}
            onReserve={handleInitiateReserve}
          />
        </div>
      </div>

      {/* --- MOCK PAYMENT SANDBOX MODAL --- */}
      {showPaymentPage && paymentData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '800px', display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '2rem', padding: '2rem', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'var(--bg-secondary)', animation: 'zoomIn 0.3s ease-out', position: 'relative' }}>
            
            {/* Close Button */}
            <button onClick={() => setShowPaymentPage(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            {/* Left Column: Order Summary */}
            <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Secure Checkout</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <span className="text-muted">Parking Facility:</span>
                  <div style={{ fontWeight: 600, color: 'white', marginTop: '0.15rem' }}>{facilities.find(f => f._id === selectedFacilityId)?.name}</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <span className="text-muted">Slot Number:</span>
                    <div style={{ fontWeight: 700, color: 'var(--color-warning)', fontSize: '1.1rem' }}>{paymentData.slot?.slotNumber}</div>
                  </div>
                  <div>
                    <span className="text-muted">Slot Type:</span>
                    <div style={{ fontWeight: 600, color: paymentData.slot?.isEV ? 'var(--color-ev)' : 'white' }}>
                      {paymentData.slot?.isEV ? '⚡ EV Charging' : 'Standard'}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-muted">Registered Vehicle:</span>
                  <div style={{ fontWeight: 600, color: 'white' }}>{paymentData.vehicle?.registrationNumber} ({paymentData.vehicle?.type})</div>
                </div>

                <div>
                  <span className="text-muted">Reservation Window:</span>
                  <div style={{ fontWeight: 600, color: 'white', marginTop: '0.1rem', fontSize: '0.8rem' }}>
                    {new Date(paymentData.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(paymentData.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                    Duration: {paymentData.hours} Hour(s)
                  </div>
                </div>

                <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '0.5rem 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">Rate (₹{paymentData.slot?.currentPrice}/hr):</span>
                    <span>₹{paymentData.slot?.currentPrice * paymentData.hours}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">SGST (9%):</span>
                    <span>₹{Math.round(paymentData.totalPrice * 0.09)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted">CGST (9%):</span>
                    <span>₹{Math.round(paymentData.totalPrice * 0.09)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', fontWeight: 700, fontSize: '1.05rem', color: 'white' }}>
                    <span>Grand Total:</span>
                    <span>₹{Math.round(paymentData.totalPrice * 1.18)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Payment Details */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Payment Methods</h2>
                
                {/* Method selector tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                  {['UPI', 'Card', 'NetBanking', 'Wallet', 'Cash'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(method);
                        setPaymentError('');
                      }}
                      className={`btn ${paymentMethod === method ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '30px' }}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {/* Sandbox Warning */}
                <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid var(--color-warning)', padding: '0.65rem 0.85rem', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--color-warning)', marginBottom: '1.5rem' }}>
                  ⚠️ <strong>Mock Sandbox Session:</strong> Do NOT enter your actual credentials. Use dummy/fake entries to test transaction completion.
                </div>

                {/* Form fields based on selection */}
                <form onSubmit={handleConfirmPayment}>
                  {paymentMethod === 'UPI' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                      <div className="form-group" style={{ width: '100%', marginBottom: 0 }}>
                        <label className="form-label">Virtual Payment Address (VPA)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. driver@okicici"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          required={paymentMethod === 'UPI'}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', border: '1px dashed var(--border-color)', padding: '0.75rem', borderRadius: 'var(--radius-md)', width: '100%' }}>
                        <QrCode size={40} className="text-muted" />
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                          Alternatively, a dynamic merchant QR code will be generated on check-in.
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Card' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Card Holder Name</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="John Doe"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          required={paymentMethod === 'Card'}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Card Number</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="4111 2222 3333 4444"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, ''))}
                          required={paymentMethod === 'Card'}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Expiry Date</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="MM/YY"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            required={paymentMethod === 'Card'}
                          />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">CVV</label>
                          <input
                            type="password"
                            className="form-input"
                            placeholder="***"
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            required={paymentMethod === 'Card'}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'NetBanking' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Select Your Bank</label>
                      <select className="form-input" required>
                        <option value="SBI">State Bank of India</option>
                        <option value="HDFC">HDFC Bank</option>
                        <option value="ICICI">ICICI Bank</option>
                        <option value="AXIS">Axis Bank</option>
                        <option value="KOTAK">Kotak Mahindra Bank</option>
                      </select>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
                        <Landmark size={16} /> Redirecting to bank secure portal.
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Wallet' && (
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Choose Wallet Operator</label>
                      <select className="form-input" required>
                        <option value="Paytm">Paytm Wallet</option>
                        <option value="PhonePe">PhonePe Wallet</option>
                        <option value="Amazon">Amazon Pay Wallet</option>
                        <option value="Mobikwik">Mobikwik Wallet</option>
                      </select>
                    </div>
                  )}

                  {paymentMethod === 'Cash' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ margin: 0, color: 'white', fontSize: '0.8rem' }}>Pay At Parking Gate Kiosk</h4>
                      <p className="text-muted" style={{ fontSize: '0.7rem', margin: 0 }}>
                        Confirm reservation now and pay at the entry barrier using cash/card during vehicle check-in. Note: unpaid reservations auto-expire after 30 minutes.
                      </p>
                    </div>
                  )}

                  {paymentError && (
                    <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '1rem', marginBottom: 0 }}>
                      ⚠️ {paymentError}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowPaymentPage(false)}
                      className="btn btn-secondary"
                      style={{ flex: 1 }}
                      disabled={isPaying}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ flex: 1, backgroundColor: 'var(--color-success)' }}
                      disabled={isPaying}
                    >
                      {isPaying ? 'Authorizing...' : `Pay ₹${Math.round(paymentData.totalPrice * 1.18)}`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- RESERVATION SUCCESS POPUP --- */}
      {showSuccessPopup && completedReservation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)', padding: '1rem' }}>
          <div className="card text-center" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', border: '1px solid rgba(16, 185, 129, 0.3)', backgroundColor: 'var(--bg-secondary)', animation: 'zoomIn 0.3s ease-out' }}>
            
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', marginBottom: '1.5rem' }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: '1.5rem', color: 'white', marginBottom: '0.5rem' }}>Reservation Completed Successfully</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1.75rem' }}>Your digital ticket has been issued and slot secured via dynamic allocation.</p>

            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '0.5rem' }}>
                <span className="text-muted">Ticket ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'white' }}>{completedReservation._id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Facility:</span>
                <span style={{ fontWeight: 600, color: 'white' }}>{completedReservation.facilityId?.name || 'Downtown Smart Hub'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Assigned Slot:</span>
                <span style={{ fontWeight: 700, color: 'var(--color-warning)' }}>Slot {completedReservation.slotId?.slotNumber || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Vehicle Plate:</span>
                <span style={{ fontWeight: 600, color: 'white' }}>{completedReservation.vehicleId?.registrationNumber || 'Registered Driver'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-muted">Date & Time:</span>
                <span style={{ fontWeight: 600, color: 'white', fontSize: '0.8rem' }}>
                  {new Date(completedReservation.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(completedReservation.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: 'white' }}>
                <span className="text-muted">Amount Paid ({completedReservation.paymentMethod}):</span>
                <span style={{ color: 'var(--color-success)' }}>₹{completedReservation.price}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  setActiveTab('dashboard');
                }}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                View Reservation
              </button>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkingFinder;
