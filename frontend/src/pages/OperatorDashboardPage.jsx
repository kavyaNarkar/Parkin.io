import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export const OperatorDashboardPage = () => {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('');
  // Setup order: create-facility → slots → rates → checkins → checkouts
  const [activeTab, setActiveTab] = useState('create-facility');

  const [slots, setSlots] = useState([]);
  const [zones, setZones] = useState([]);
  const [rates, setRates] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [facName, setFacName] = useState('');
  const [facAddress, setFacAddress] = useState('');
  const [facCity, setFacCity] = useState('');

  const [newSlotCode, setNewSlotCode] = useState('');
  const [newSlotVehicle, setNewSlotVehicle] = useState('CAR');
  const [newZoneId, setNewZoneId] = useState('');
  const [slotDraft, setSlotDraft] = useState(null);

  const [newZoneName, setNewZoneName] = useState('');
  const [newFloorLabel, setNewFloorLabel] = useState('');

  const [rateVehicle, setRateVehicle] = useState('CAR');
  const [rateAmount, setRateAmount] = useState('');

  const hasFacility = facilities.length > 0 && !!selectedFacilityId;
  const hasSlots = slots.length > 0;
  const hasRates = rates.length > 0;
  const hasSlotDraft = !!slotDraft;
  const hasZoneForDraft = !!newZoneId || zones.length > 0;
  const wizardReadyToCreate = hasSlotDraft && hasZoneForDraft && hasRates;

  // Pending check-ins: confirmed bookings waiting for arrival
  const pendingCheckIns = reservations.filter((r) => r.status === 'CONFIRMED');
  // Active check-outs: drivers currently parked, awaiting session complete
  const pendingCheckOuts = reservations.filter((r) => r.status === 'CHECKED_IN');

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacilityId && activeTab !== 'create-facility') {
      fetchFacilityDetails(selectedFacilityId);
    }
  }, [selectedFacilityId, activeTab]);

  // When no facility exists, force create-facility view and clear detail data
  useEffect(() => {
    if (facilities.length === 0) {
      setActiveTab('create-facility');
      setSelectedFacilityId('');
      setSlots([]);
      setZones([]);
      setRates([]);
      setReservations([]);
    }
  }, [facilities.length]);

  const fetchFacilities = async () => {
    try {
      const res = await axiosClient.get('/facilities');
      const list = res.data || [];
      setFacilities(list);
      if (list.length > 0) {
        if (!selectedFacilityId || !list.find((f) => String(f.id) === String(selectedFacilityId))) {
          setSelectedFacilityId(list[0].id);
          setActiveTab((prev) => (prev === 'create-facility' ? 'slots' : prev));
        }
      } else {
        setSelectedFacilityId('');
        setActiveTab('create-facility');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFacilityDetails = async (facId) => {
    if (!facId) return;
    setLoading(true);
    try {
      // Always keep slots/rates counts for gating tabs
      const [slotsRes, ratesRes] = await Promise.all([
        axiosClient.get(`/slots/facility/${facId}`),
        axiosClient.get(`/operator/rates/facility/${facId}`),
      ]);
      setSlots(slotsRes.data || []);
      setRates(ratesRes.data || []);

      if (activeTab === 'zones' || activeTab === 'slots' || activeTab === 'rates' || hasSlotDraft) {
        const zonesRes = await axiosClient.get(`/operator/zones/facility/${facId}`);
        setZones(zonesRes.data || []);
      }

      if (activeTab === 'checkins' || activeTab === 'checkouts') {
        const res = await axiosClient.get(`/operator/reservations/facility/${facId}`);
        // Only keep active operational entries — drop completed / cancelled / expired history
        const all = res.data || [];
        setReservations(all.filter((r) => r.status === 'CONFIRMED' || r.status === 'CHECKED_IN'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFacility = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post('/facilities', {
        name: facName,
        address: facAddress,
        city: facCity,
        openingTime: '00:00',
        closingTime: '23:59',
        status: 'ACTIVE',
      });
      setMessage('Parking Facility created successfully! Next: add parking slots.');
      setFacName('');
      setFacAddress('');
      setFacCity('');
      const newFac = res.data;
      const listRes = await axiosClient.get('/facilities');
      const list = listRes.data || [];
      setFacilities(list);
      if (newFac && newFac.id) {
        setSelectedFacilityId(newFac.id);
      } else if (list.length > 0) {
        setSelectedFacilityId(list[list.length - 1].id);
      }
      setSlots([]);
      setZones([]);
      setRates([]);
      setReservations([]);
      setSlotDraft(null);
      setNewZoneId('');
      setActiveTab('slots');
    } catch (err) {
      alert(err.message || 'Failed to create facility');
    }
  };

  const handleToggleSlotStatus = async (slotId, currentStatus) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'OUT_OF_SERVICE' : 'AVAILABLE';
    try {
      await axiosClient.patch(`/slots/${slotId}/status?status=${nextStatus}`);
      setMessage(`Slot status updated to ${nextStatus}`);
      fetchFacilityDetails(selectedFacilityId);
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleStartSlotWizard = (e) => {
    e.preventDefault();
    if (!selectedFacilityId) {
      alert('Please create a parking facility first.');
      return;
    }
    if (!newSlotCode.trim()) {
      alert('Enter a slot code first.');
      return;
    }
    setSlotDraft({
      slotCode: newSlotCode.trim(),
      vehicleType: newSlotVehicle,
    });
    setRateVehicle(newSlotVehicle);
    setMessage(`Slot ${newSlotCode.trim()} saved as draft. Next: assign a zone and floor.`);
    setActiveTab('zones');
  };

  const persistParkingSlot = async ({ ratesOk = false } = {}) => {
    const draft = slotDraft;
    if (!selectedFacilityId || !draft) {
      alert('Fill parking slot details first.');
      setActiveTab('slots');
      return false;
    }
    let zoneId = newZoneId;
    if (!zoneId) {
      const zonesRes = await axiosClient.get(`/operator/zones/facility/${selectedFacilityId}`);
      const list = zonesRes.data || [];
      setZones(list);
      zoneId = list[0] && list[0].id;
    }
    if (!zoneId) {
      alert('Create and select a zone / floor before creating the slot.');
      setActiveTab('zones');
      return false;
    }
    if (!hasRates && !ratesOk) {
      alert('Set a price rate before creating the slot.');
      setActiveTab('rates');
      return false;
    }
    await axiosClient.post(`/slots?facilityId=${selectedFacilityId}`, {
      slotCode: draft.slotCode,
      vehicleType: draft.vehicleType,
      zone: { id: zoneId },
      operationalStatus: 'AVAILABLE',
    });
    setNewSlotCode('');
    setNewZoneId('');
    setSlotDraft(null);
    setMessage(`Parking slot ${draft.slotCode} created.`);
    await fetchFacilityDetails(selectedFacilityId);
    setActiveTab('slots');
    return true;
  };

  const handleFinishCreateSlot = async () => {
    try {
      await persistParkingSlot();
    } catch (err) {
      alert(err.message || 'Failed to create slot');
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    if (!selectedFacilityId) {
      alert('Please create a parking facility first.');
      return;
    }
    try {
      await axiosClient.post(`/operator/zones?facilityId=${selectedFacilityId}`, {
        name: newZoneName,
        floorLabel: newFloorLabel,
      });
      setNewZoneName('');
      setNewFloorLabel('');
      setMessage('Zone added successfully! Select it below, then continue to price rates.');
      const zonesRes = await axiosClient.get(`/operator/zones/facility/${selectedFacilityId}`);
      const list = zonesRes.data || [];
      setZones(list);
      if (list.length > 0 && !newZoneId) {
        setNewZoneId(list[list.length - 1].id);
      }
    } catch (err) {
      alert(err.message || 'Failed to add zone');
    }
  };

  const handleCreateRate = async (e) => {
    e.preventDefault();
    if (!selectedFacilityId) {
      alert('Please create a parking facility first.');
      return;
    }
    if (!hasSlots && !hasSlotDraft) {
      alert('Fill parking slot details first, then zones, then price rates.');
      setActiveTab('slots');
      return;
    }
    try {
      await axiosClient.post(`/operator/rates?facilityId=${selectedFacilityId}`, {
        vehicleType: rateVehicle,
        amount: parseFloat(rateAmount),
        unit: 'HOURLY',
        currency: 'INR',
      });
      setRateAmount('');
      await fetchFacilityDetails(selectedFacilityId);
      if (slotDraft) {
        const created = await persistParkingSlot({ ratesOk: true });
        if (!created) {
          setMessage('Pricing rate saved. Finish zone/floor, then create the parking slot.');
        }
      } else {
        setMessage('Pricing rate added!');
      }
    } catch (err) {
      alert(err.message || 'Failed to save rate');
    }
  };

  const handleDriverCheckIn = async (resId) => {
    try {
      await axiosClient.patch(`/operator/reservations/${resId}/check-in`);
      setMessage('Driver checked-in!');
      fetchFacilityDetails(selectedFacilityId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompleteSession = async (resId) => {
    try {
      await axiosClient.patch(`/operator/reservations/${resId}/complete`);
      setMessage('Session completed — entry removed from check-outs.');
      fetchFacilityDetails(selectedFacilityId);
    } catch (err) {
      alert(err.message);
    }
  };

  const tabBtnStyle = (tab) => ({
    padding: '0.75rem 1.25rem',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    borderBottom: activeTab === tab ? '3px solid #0284c7' : 'none',
    color: activeTab === tab ? '#0284c7' : '#64748b',
  });

  const statusBadge = (status) => {
    const map = {
      CONFIRMED: { bg: '#dbeafe', color: '#1d4ed8' },
      CHECKED_IN: { bg: '#dcfce7', color: '#15803d' },
    };
    const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
    return (
      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: s.bg, color: s.color }}>
        {status}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#0f172a' }}>Parking Operator Portal</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            {hasFacility
              ? 'Set up slots and rates, then manage driver check-ins and check-outs.'
              : 'Create a parking facility first to unlock slots, rates, and operations.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {hasFacility && (
            <>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Facility:</label>
              <select
                value={selectedFacilityId}
                onChange={(e) => {
                  setSelectedFacilityId(e.target.value);
                  setSlots([]);
                  setZones([]);
                  setRates([]);
                  setReservations([]);
                  setSlotDraft(null);
                  setNewZoneId('');
                  setActiveTab('slots');
                }}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: '500' }}
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>{fac.name} ({fac.city})</option>
                ))}
              </select>
              <button
                onClick={() => setActiveTab('create-facility')}
                style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.5rem 0.75rem', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
              >
                + Add Facility
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
          {message}
        </div>
      )}

      {/* Setup progress — only when a facility exists */}
      {hasFacility && activeTab !== 'create-facility' && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '9999px', backgroundColor: '#dcfce7', color: '#15803d', fontWeight: '600' }}>
            1. Facility ✓
          </span>
          <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '9999px', backgroundColor: (hasSlots || hasSlotDraft) ? '#dcfce7' : '#fef3c7', color: (hasSlots || hasSlotDraft) ? '#15803d' : '#b45309', fontWeight: '600' }}>
            2. Slot details {(hasSlots || hasSlotDraft) ? '✓' : ''}
          </span>
          <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '9999px', backgroundColor: zones.length > 0 ? '#dcfce7' : '#fef3c7', color: zones.length > 0 ? '#15803d' : '#b45309', fontWeight: '600' }}>
            3. Zone & Floor {zones.length > 0 ? '✓' : ''}
          </span>
          <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '9999px', backgroundColor: hasRates ? '#dcfce7' : '#fef3c7', color: hasRates ? '#15803d' : '#b45309', fontWeight: '600' }}>
            4. Price Rates {hasRates ? '✓' : ''}
          </span>
          <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '9999px', backgroundColor: hasSlots ? '#dcfce7' : '#f1f5f9', color: hasSlots ? '#15803d' : '#94a3b8', fontWeight: '600' }}>
            5. Slot created {hasSlots ? '✓' : ''}
          </span>
        </div>
      )}

      {/* Tabs — hidden until a facility exists (except while creating) */}
      {hasFacility && activeTab !== 'create-facility' && (
        <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('slots')} style={tabBtnStyle('slots')}>
            Parking Slots ({slots.length})
          </button>
          <button onClick={() => setActiveTab('zones')} style={tabBtnStyle('zones')}>
            Zones & Floors
          </button>
          <button
            onClick={() => {
              if (!hasSlots && !hasSlotDraft) {
                alert('Fill parking slot details first.');
                setActiveTab('slots');
                return;
              }
              if (zones.length === 0) {
                alert('Add a zone and floor next, then set price rates.');
                setActiveTab('zones');
                return;
              }
              setActiveTab('rates');
            }}
            style={tabBtnStyle('rates')}
          >
            Pricing Rates ({rates.length})
          </button>
          <button
            onClick={() => {
              if (!hasSlots || !hasRates) {
                alert('Complete parking slots and price rates before managing check-ins.');
                setActiveTab(!hasSlots ? 'slots' : 'rates');
                return;
              }
              setActiveTab('checkins');
            }}
            style={tabBtnStyle('checkins')}
          >
            Check-Ins ({pendingCheckIns.length})
          </button>
          <button
            onClick={() => {
              if (!hasSlots || !hasRates) {
                alert('Complete parking slots and price rates before managing check-outs.');
                setActiveTab(!hasSlots ? 'slots' : 'rates');
                return;
              }
              setActiveTab('checkouts');
            }}
            style={tabBtnStyle('checkouts')}
          >
            Check-Outs ({pendingCheckOuts.length})
          </button>
        </div>
      )}

      {loading && <p>Loading data...</p>}

      {/* NO FACILITY / CREATE FACILITY — slots & other details must not show */}
      {(activeTab === 'create-facility' || !hasFacility) && (
        <div style={{ maxWidth: '500px', backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {hasFacility ? 'Create New Parking Facility' : 'Create Your First Parking Facility'}
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Parking slots, price rates, and check-in/check-out tools appear only after a facility is saved.
          </p>
          <form onSubmit={handleCreateFacility} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Facility Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Central Mall Parking"
                value={facName}
                onChange={(e) => setFacName(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>Address</label>
              <input
                type="text"
                required
                placeholder="e.g. MG Road, Block B"
                value={facAddress}
                onChange={(e) => setFacAddress(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.25rem' }}>City</label>
              <input
                type="text"
                required
                placeholder="e.g. Bengaluru"
                value={facCity}
                onChange={(e) => setFacCity(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.75rem 1rem', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', flex: 1 }}
              >
                Save Parking Facility
              </button>
              {hasFacility && (
                <button
                  type="button"
                  onClick={() => setActiveTab('slots')}
                  style={{ backgroundColor: '#e2e8f0', color: '#0f172a', padding: '0.75rem 1rem', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* SLOTS — only after facility exists */}
      {!loading && hasFacility && activeTab === 'slots' && (
        <div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Step 2: Enter slot details. Click Add Parking Slot to continue to Zones & Floors, then rates. The slot is created only after those are filled.
          </p>
          {hasSlotDraft && (
            <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Draft slot <strong>{slotDraft.slotCode}</strong> ({slotDraft.vehicleType}) is waiting. Finish zone/floor and price rate, then create it.
            </div>
          )}
          <form onSubmit={handleStartSlotWizard} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Slot Code (e.g. A-101)"
              required
              value={newSlotCode}
              onChange={(e) => setNewSlotCode(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', width: '180px' }}
            />
            <select
              value={newSlotVehicle}
              onChange={(e) => setNewSlotVehicle(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            >
              <option value="CAR">Car Slot</option>
              <option value="BIKE">Bike Slot</option>
              <option value="EV">EV Charging Slot</option>
              <option value="ACCESSIBLE">Accessible Slot</option>
            </select>
            <button
              type="submit"
              style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
            >
              + Add Parking Slot
            </button>
          </form>

          {slots.length === 0 && !hasSlotDraft && (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
              <p style={{ color: '#64748b' }}>No parking slots yet. Enter a slot code and continue through zones and rates to create one.</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
            {slots.map((slot) => (
              <div key={slot.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', backgroundColor: '#ffffff', textAlign: 'center' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{slot.slotCode}</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Type: {slot.vehicleType}</p>
                <span style={{
                  display: 'inline-block',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  marginBottom: '0.75rem',
                  backgroundColor: slot.operationalStatus === 'AVAILABLE' ? '#dcfce7' : '#fee2e2',
                  color: slot.operationalStatus === 'AVAILABLE' ? '#15803d' : '#b91c1c'
                }}>
                  {slot.operationalStatus}
                </span>
                <div>
                  <button
                    onClick={() => handleToggleSlotStatus(slot.id, slot.operationalStatus)}
                    style={{ backgroundColor: slot.operationalStatus === 'AVAILABLE' ? '#ef4444' : '#22c55e', color: '#ffffff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    {slot.operationalStatus === 'AVAILABLE' ? 'Set Out of Service' : 'Set Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ZONES */}
      {!loading && hasFacility && activeTab === 'zones' && (
        <div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Step 3: Create a zone and floor{hasSlotDraft ? ` for draft slot ${slotDraft.slotCode}` : ''}, then continue to price rates.
          </p>
          <form onSubmit={handleCreateZone} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Zone Name (e.g. Zone A)"
              required
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
            <input
              type="text"
              placeholder="Floor Label (e.g. 1st Floor / Basement 1)"
              value={newFloorLabel}
              onChange={(e) => setNewFloorLabel(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
            <button
              type="submit"
              style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
            >
              + Create Zone
            </button>
          </form>

          {zones.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Assign zone to slot:</label>
              <select
                value={newZoneId}
                onChange={(e) => setNewZoneId(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
              >
                <option value="">Select zone</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}{z.floorLabel ? ` (${z.floorLabel})` : ''}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (!hasSlotDraft) {
                    alert('Fill parking slot details first.');
                    setActiveTab('slots');
                    return;
                  }
                  if (!newZoneId) {
                    alert('Select a zone for this slot.');
                    return;
                  }
                  setMessage('Zone assigned. Next: set the price rate, then create the parking slot.');
                  setActiveTab('rates');
                }}
                style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
              >
                Next: Price Rates →
              </button>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Zone Name</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Floor Label</th>
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No zones yet.</td>
                </tr>
              )}
              {zones.map((zone) => (
                <tr key={zone.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontWeight: '500' }}>{zone.name}</td>
                  <td style={{ padding: '0.75rem', color: '#64748b' }}>{zone.floorLabel || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PRICING RATES — after slots */}
      {!loading && hasFacility && activeTab === 'rates' && (
        <div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Step 4: Set the hourly price rate. After slot details, zone, and rate are collected, create the parking slot.
          </p>
          {!hasSlots && !hasSlotDraft ? (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
              <p style={{ color: '#b45309', marginBottom: '0.75rem' }}>Fill parking slot details first, then zones and floors.</p>
              <button
                type="button"
                onClick={() => setActiveTab('slots')}
                style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
              >
                Go to Parking Slots
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleCreateRate} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={rateVehicle}
                  onChange={(e) => setRateVehicle(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                >
                  <option value="CAR">Car</option>
                  <option value="BIKE">Bike</option>
                  <option value="EV">EV Charging</option>
                  <option value="ACCESSIBLE">Accessible</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Hourly Rate (₹)"
                  required
                  value={rateAmount}
                  onChange={(e) => setRateAmount(e.target.value)}
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                />
                <button
                  type="submit"
                  style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Set Rate Rule
                </button>
                {hasSlotDraft && (
                  <button
                    type="button"
                    onClick={handleFinishCreateSlot}
                    disabled={!wizardReadyToCreate}
                    style={{ backgroundColor: wizardReadyToCreate ? '#10b981' : '#94a3b8', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: wizardReadyToCreate ? 'pointer' : 'not-allowed', marginLeft: 'auto' }}
                  >
                    Create Parking Slot
                  </button>
                )}
                {hasSlots && hasRates && !hasSlotDraft && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('checkins')}
                    style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', marginLeft: 'auto' }}
                  >
                    Next: Check-Ins →
                  </button>
                )}
              </form>

              <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Vehicle Type</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Hourly Rate</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>No rates set yet.</td>
                    </tr>
                  )}
                  {rates.map((rate) => (
                    <tr key={rate.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>{rate.vehicleType}</td>
                      <td style={{ padding: '0.75rem', color: '#0f172a', fontWeight: 'bold' }}>₹{rate.amount}</td>
                      <td style={{ padding: '0.75rem', color: '#64748b' }}>{rate.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* CHECK-INS — separate section; only CONFIRMED (previous completed entries removed) */}
      {!loading && hasFacility && activeTab === 'checkins' && (
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Driver Check-Ins</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Confirmed bookings waiting for arrival. Completed and cancelled history is not shown here.
          </p>
          {(!hasSlots || !hasRates) ? (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
              <p style={{ color: '#b45309' }}>Finish parking slots and price rates before using check-ins.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Driver</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Slot</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Timing</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingCheckIns.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                      No drivers waiting to check in.
                    </td>
                  </tr>
                )}
                {pendingCheckIns.map((res) => (
                  <tr key={res.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{res.user?.name || 'Driver'}</td>
                    <td style={{ padding: '0.75rem' }}>{res.slot?.slotCode}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                      {new Date(res.startAt).toLocaleTimeString()} - {new Date(res.endAt).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{statusBadge(res.status)}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => handleDriverCheckIn(res.id)}
                        style={{ backgroundColor: '#0284c7', color: '#ffffff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Check In Driver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CHECK-OUTS — separate section; only CHECKED_IN (completed entries removed after checkout) */}
      {!loading && hasFacility && activeTab === 'checkouts' && (
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Driver Check-Outs</h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Drivers currently parked. Completing a session removes the entry from this list.
          </p>
          {(!hasSlots || !hasRates) ? (
            <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
              <p style={{ color: '#b45309' }}>Finish parking slots and price rates before using check-outs.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Driver</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Slot</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Timing</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                  <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingCheckOuts.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                      No active sessions to check out.
                    </td>
                  </tr>
                )}
                {pendingCheckOuts.map((res) => (
                  <tr key={res.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{res.user?.name || 'Driver'}</td>
                    <td style={{ padding: '0.75rem' }}>{res.slot?.slotCode}</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                      {new Date(res.startAt).toLocaleTimeString()} - {new Date(res.endAt).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>{statusBadge(res.status)}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <button
                        onClick={() => handleCompleteSession(res.id)}
                        style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Complete Check-Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
