import React from 'react';
import { Zap, Hammer, ShieldAlert, Lock, Car, Check, Accessibility } from 'lucide-react';

const ParkingMap = ({ slots, selectedSlotId, onSelectSlot }) => {
  if (!slots || slots.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p className="text-muted">Loading parking map data...</p>
      </div>
    );
  }

  // Row Char organization
  const topRows = ['A', 'B'];
  const bottomRows = ['C', 'D', 'E'];

  const getStatusClass = (status) => {
    switch (status) {
      case 'Available': return 'slot-available';
      case 'Occupied': return 'slot-occupied';
      case 'Reserved': return 'slot-reserved';
      case 'EV Charging': return 'slot-ev';
      case 'Maintenance': return 'slot-maintenance';
      case 'Emergency Restricted': return 'slot-emergency';
      default: return 'slot-available';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'var(--color-success)';
      case 'Occupied': return 'var(--color-warning)';
      case 'Reserved': return 'var(--color-danger)';
      case 'EV Charging': return 'var(--color-ev)';
      case 'Maintenance': return 'var(--color-text-muted)';
      case 'Emergency Restricted': return 'var(--color-danger)';
      default: return 'var(--color-success)';
    }
  };

  const getStatusIcon = (status, isEV, isAccessible) => {
    if (status === 'Emergency Restricted') return <ShieldAlert size={14} style={{ color: 'var(--color-danger)' }} />;
    if (status === 'Maintenance') return <Hammer size={14} style={{ color: 'var(--color-text-muted)' }} />;
    if (status === 'EV Charging' || (isEV && status === 'Occupied')) return <Zap size={14} style={{ color: 'var(--color-ev)' }} className="pulse-ev-icon" />;
    if (status === 'Reserved') return <Lock size={14} style={{ color: 'var(--color-warning)' }} />;
    if (status === 'Occupied') return <Car size={14} style={{ color: 'white' }} />;
    if (isAccessible) return <Accessibility size={14} style={{ color: '#2563eb' }} />;
    return <Check size={14} style={{ color: 'var(--color-success)' }} />;
  };

  const renderSlotRow = (rowChar, side) => {
    const rowSlots = slots.filter(slot => slot.slotNumber.startsWith(rowChar));
    
    let rowLabel = '';
    if (rowChar === 'A') rowLabel = 'Row A - General (Cars)';
    else if (rowChar === 'B') rowLabel = 'Row B - Safety Corridor (SUVs)';
    else if (rowChar === 'C') rowLabel = 'Row C - High-Speed EV Charger Bays';
    else if (rowChar === 'D') rowLabel = 'Row D - Two-Wheeler Parking';
    else if (rowChar === 'E') rowLabel = 'Row E - Van / Large Dimensions';

    return (
      <div key={rowChar} style={{ width: '100%', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>
          <span>{rowLabel}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{side === 'top' ? '⬇ Faces Road' : '⬆ Faces Road'}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {rowSlots.map(slot => {
            const isSelected = selectedSlotId === slot._id;
            const isAccessible = slot.isAccessible || slot.slotNumber.endsWith('01');
            const statusClass = getStatusClass(slot.status);
            
            return (
              <div
                key={slot._id}
                className="parking-slot-wrapper"
                onClick={() => onSelectSlot(slot)}
                style={{ position: 'relative' }}
              >
                {/* Visual slot box styled like a parking bay */}
                <div
                  className={`parking-slot-box ${statusClass} ${side === 'top' ? 'bay-top' : 'bay-bottom'} ${isSelected ? 'selected' : ''}`}
                  style={{
                    borderLeftWidth: '2.5px',
                    borderRightWidth: '2.5px',
                    borderTopWidth: side === 'top' ? '2.5px' : '0.5px',
                    borderBottomWidth: side === 'bottom' ? '2.5px' : '0.5px',
                    ...(isSelected && {
                      borderColor: 'white',
                      boxShadow: '0 0 15px rgba(255, 255, 255, 0.5)',
                      transform: 'scale(1.04)'
                    })
                  }}
                >
                  {/* Accessibility overlay badge */}
                  {isAccessible && (
                    <div style={{ position: 'absolute', top: 4, left: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '3px', padding: '1px', zIndex: 1 }}>
                      <Accessibility size={10} style={{ color: '#2563eb' }} />
                    </div>
                  )}

                  {/* EV Indicator badge */}
                  {slot.isEV && (
                    <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '3px', padding: '1px', zIndex: 1 }}>
                      <Zap size={10} style={{ color: 'var(--color-ev)' }} />
                    </div>
                  )}

                  <span className="slot-label" style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.5px' }}>{slot.slotNumber}</span>
                  
                  {/* Status Indicator (Icon + Color) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '6px 0' }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getStatusColor(slot.status) }}></span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getStatusIcon(slot.status, slot.isEV, isAccessible)}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {slot.isEV ? 'EV Port' : slot.vehicleSize}
                  </span>
                </div>

                {/* CSS Tooltip Bubble */}
                <div className="slot-tooltip-bubble">
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem', marginBottom: '0.25rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Slot {slot.slotNumber}</span>
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: getStatusColor(slot.status) }}>{slot.status}</span>
                  </div>
                  <div>Class: <span style={{ textTransform: 'capitalize' }}>{slot.vehicleType}</span></div>
                  <div>Size: <span style={{ textTransform: 'capitalize' }}>{slot.vehicleSize}</span></div>
                  <div>Rate: <strong>₹{slot.currentPrice || 40}/hr</strong></div>
                  {slot.isEV && <div style={{ color: 'var(--color-ev)', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}><Zap size={10} /> EV Charging Slot</div>}
                  {isAccessible && <div style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}><Accessibility size={10} /> Accessible Parking</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1rem' }}>
      <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Visual Parking Layout Map</h3>
      <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '-0.5rem' }}>Hover over spaces to inspect constraints. Click any available space to configure booking parameters.</p>
      
      {/* Map Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--color-success)', backgroundColor: 'rgba(16, 185, 129, 0.06)', borderRadius: '4px' }}><Check size={12} style={{ color: 'var(--color-success)' }} /></div>
          <span>🟢 Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--color-warning)', backgroundColor: 'rgba(245, 158, 11, 0.06)', borderRadius: '4px' }}><Lock size={12} style={{ color: 'var(--color-warning)' }} /></div>
          <span>🔴 Reserved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '4px' }}><Car size={12} style={{ color: 'white' }} /></div>
          <span>🟠 Occupied</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--color-ev)', backgroundColor: 'rgba(6, 182, 212, 0.06)', borderRadius: '4px' }}><Zap size={12} style={{ color: 'var(--color-ev)' }} /></div>
          <span>🔵 EV / Charging</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--border-color)', backgroundColor: 'rgba(100, 116, 139, 0.06)', borderRadius: '4px' }}><Hammer size={12} style={{ color: 'var(--color-text-secondary)' }} /></div>
          <span>⚫ Out of Service</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
          <div style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #2563eb', backgroundColor: 'rgba(37, 99, 235, 0.08)', borderRadius: '4px' }}><Accessibility size={12} style={{ color: '#2563eb' }} /></div>
          <span>♿ Accessible</span>
        </div>
      </div>

      {/* Structured Layout Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        
        {/* Top Slots Section */}
        <div style={{ width: '100%' }}>
          {topRows.map(row => renderSlotRow(row, 'top'))}
        </div>

        {/* Driving Lane / Road Aisle */}
        <div className="parking-road" style={{ display: 'flex', flexDirection: 'column', margin: '1.25rem 0', padding: '0.5rem 0', position: 'relative', height: '60px', backgroundColor: '#0a0f1a', borderTop: '2px dashed #1e3a5f', borderBottom: '2px dashed #1e3a5f', justifyContent: 'center', alignItems: 'center', borderRadius: '4px' }}>
          {/* Yellow dashed divider line */}
          <div style={{ position: 'absolute', left: 0, right: 0, height: '0px', borderTop: '2px dashed #3b82f6', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}></div>
          
          {/* Lane markings and gate locations */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '0 2.5rem', zIndex: 1, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            <span style={{ color: 'var(--color-success)' }}>🚪 🚦 ENTRY LANE</span>
            <span style={{ color: 'var(--color-text-secondary)', backgroundColor: '#0a0f1a', padding: '0 1rem' }}>← ONE-WAY DRIVING AISLE →</span>
            <span style={{ color: 'var(--color-danger)' }}>EXIT GATES 🚦 🚪</span>
          </div>
        </div>

        {/* Bottom Slots Section */}
        <div style={{ width: '100%' }}>
          {bottomRows.map(row => renderSlotRow(row, 'bottom'))}
        </div>
      </div>
      
      {/* Footer Meta Details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
        <span>🚶 Central pedestrian escalators/elevators are adjacent to Column 05/06 of Rows A-E.</span>
        <span>📏 Slot width: standard vehicle clearance (2.6m x 5.0m).</span>
      </div>
    </div>
  );
};

export default ParkingMap;
