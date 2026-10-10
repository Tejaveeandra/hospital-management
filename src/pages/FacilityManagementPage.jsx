import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  DoorOpen, 
  Bed, 
  PlusCircle, 
  Tag, 
  DollarSign, 
  Activity, 
  CheckCircle, 
  Trash2, 
  Edit3, 
  RefreshCw,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Wind,
  Bath,
  Check
} from 'lucide-react';
import styles from './FacilityManagementPage.module.css';
import { 
  getBuildings, createBuilding, deleteBuilding,
  getBlocks, createBlock, deleteBlock,
  getWards, createWard, deleteWard,
  getRooms, createRoom, updateRoomRate, deleteRoom,
  getBedsByRoom, createBed, bulkCreateBeds, deleteBed,
  getWardTypes, createWardType,
  getRoomTypes, createRoomType,
  getBedTypes, getBedStatuses,
  getBranches, getDepartments
} from '../api/facilityApi';

const FacilityManagementPage = ({ initialOperation, isEmbedded = false }) => {
  const [activeTab, setActiveTab] = useState(initialOperation || 'buildings');

  // Hierarchy Data
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  
  const [buildings, setBuildings] = useState([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  
  const [blocks, setBlocks] = useState([]);
  const [selectedBlockId, setSelectedBlockId] = useState('');
  
  const [wards, setWards] = useState([]);
  const [selectedWardId, setSelectedWardId] = useState('');
  
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');

  const [roomBeds, setRoomBeds] = useState([]);

  // Integrated Metadata
  const [departments, setDepartments] = useState([]);
  const [wardTypes, setWardTypes] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [bedTypes, setBedTypes] = useState([]);
  const [bedStatuses, setBedStatuses] = useState([]);

  // Form States
  const [buildingForm, setBuildingForm] = useState({ name: '', code: '', totalFloors: 1 });
  const [blockForm, setBlockForm] = useState({ name: '', code: '' });
  const [wardForm, setWardForm] = useState({ blockId: '', departmentId: '', wardTypeId: '', floorNumber: 1, wardName: '' });
  const [roomForm, setRoomForm] = useState({ wardId: '', roomTypeId: '', roomNumber: '', dailyRate: 1500, hasAttachedBathroom: true, hasOxygenSupply: true });
  
  // Bed Forms
  const [bulkBedForm, setBulkBedForm] = useState({ roomId: '', bedTypeId: '', prefix: 'BED-', count: 4 });
  const [singleBedForm, setSingleBedForm] = useState({ roomId: '', bedTypeId: '', bedNumber: '' });

  // Master Forms
  const [newRoomTypeForm, setNewRoomTypeForm] = useState({ name: '', code: '', defaultDailyRate: 2000, maxBedCapacity: 1, ac: true, oxygenPort: true, attachedBathroom: true, description: '' });
  const [newWardTypeForm, setNewWardTypeForm] = useState({ name: '', code: '', isCriticalCare: false, description: '' });

  // Rate Editing
  const [editingRateRoomId, setEditingRateRoomId] = useState(null);
  const [newRateValue, setNewRateValue] = useState('');

  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialOperation) {
      const opMap = {
        'buildings': 'buildings',
        'Buildings & Wings': 'buildings',
        'wards': 'wards',
        'Wards Management': 'wards',
        'rooms': 'rooms',
        'Rooms & Daily Tariffs': 'rooms',
        'beds': 'beds',
        'Bed Inventory & Bulk Gen': 'beds',
        'Bed Inventory & Bulk Generator': 'beds',
        'categories': 'categories',
        'Facility Master Categories': 'categories',
        'Master Category Config': 'categories'
      };
      setActiveTab(opMap[initialOperation] || 'buildings');
    }
  }, [initialOperation]);

  // Initial Load: Branches, Departments, Masters
  useEffect(() => {
    loadInitialData();
  }, []);

  // When Branch changes -> load Buildings
  useEffect(() => {
    if (selectedBranchId) {
      loadBuildings(selectedBranchId);
    }
  }, [selectedBranchId]);

  // When Building changes -> load Blocks
  useEffect(() => {
    if (selectedBuildingId) {
      loadBlocks(selectedBuildingId);
    }
  }, [selectedBuildingId]);

  // When Block changes -> load Wards
  useEffect(() => {
    if (selectedBlockId) {
      loadWards(selectedBlockId);
    }
  }, [selectedBlockId]);

  // When Ward changes -> load Rooms
  useEffect(() => {
    if (selectedWardId) {
      loadRooms(selectedWardId);
    }
  }, [selectedWardId]);

  // When Room changes -> load Beds
  useEffect(() => {
    if (selectedRoomId) {
      loadRoomBeds(selectedRoomId);
    }
  }, [selectedRoomId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [brRes, depRes, wtRes, rtRes, btRes, bsRes] = await Promise.all([
        getBranches(),
        getDepartments(),
        getWardTypes(),
        getRoomTypes(),
        getBedTypes(),
        getBedStatuses()
      ]);

      const brList = Array.isArray(brRes.data) ? brRes.data : (brRes.data?.data || []);
      setBranches(brList);
      if (brList.length > 0 && !selectedBranchId) {
        setSelectedBranchId(brList[0].branchId || brList[0].id);
      }

      setDepartments(Array.isArray(depRes.data) ? depRes.data : (depRes.data?.data || []));
      
      const wTypes = Array.isArray(wtRes.data) ? wtRes.data : [];
      setWardTypes(wTypes);
      if (wTypes.length > 0 && !wardForm.wardTypeId) {
        setWardForm(prev => ({ ...prev, wardTypeId: wTypes[0].id }));
      }

      const rTypes = Array.isArray(rtRes.data) ? rtRes.data : [];
      setRoomTypes(rTypes);
      if (rTypes.length > 0 && !roomForm.roomTypeId) {
        setRoomForm(prev => ({ 
          ...prev, 
          roomTypeId: rTypes[0].id,
          dailyRate: rTypes[0].defaultDailyRate || 1500
        }));
      }

      const bTypes = Array.isArray(btRes.data) ? btRes.data : [];
      setBedTypes(bTypes);
      if (bTypes.length > 0) {
        setBulkBedForm(prev => ({ ...prev, bedTypeId: bTypes[0].id }));
        setSingleBedForm(prev => ({ ...prev, bedTypeId: bTypes[0].id }));
      }

      setBedStatuses(Array.isArray(bsRes.data) ? bsRes.data : []);
    } catch (err) {
      console.error('Failed to load initial facility data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBuildings = async (branchId) => {
    try {
      const res = await getBuildings(branchId);
      const list = Array.isArray(res.data) ? res.data : [];
      setBuildings(list);
      if (list.length > 0) {
        setSelectedBuildingId(list[0].id);
      } else {
        setSelectedBuildingId('');
        setBlocks([]);
        setSelectedBlockId('');
        setWards([]);
        setSelectedWardId('');
        setRooms([]);
        setSelectedRoomId('');
        setRoomBeds([]);
      }
    } catch (err) {
      console.error('Failed to load buildings', err);
    }
  };

  const loadBlocks = async (buildingId) => {
    try {
      const res = await getBlocks(buildingId);
      const list = Array.isArray(res.data) ? res.data : [];
      setBlocks(list);
      if (list.length > 0) {
        setSelectedBlockId(list[0].id);
        setWardForm(prev => ({ ...prev, blockId: list[0].id }));
      } else {
        setSelectedBlockId('');
        setWards([]);
        setSelectedWardId('');
        setRooms([]);
        setSelectedRoomId('');
        setRoomBeds([]);
      }
    } catch (err) {
      console.error('Failed to load wings/blocks', err);
    }
  };

  const loadWards = async (blockId) => {
    try {
      const res = await getWards(blockId);
      const list = Array.isArray(res.data) ? res.data : [];
      setWards(list);
      if (list.length > 0) {
        setSelectedWardId(list[0].id);
        setRoomForm(prev => ({ ...prev, wardId: list[0].id }));
      } else {
        setSelectedWardId('');
        setRooms([]);
        setSelectedRoomId('');
        setRoomBeds([]);
      }
    } catch (err) {
      console.error('Failed to load wards', err);
    }
  };

  const loadRooms = async (wardId) => {
    try {
      const res = await getRooms(wardId);
      const list = Array.isArray(res.data) ? res.data : [];
      setRooms(list);
      if (list.length > 0) {
        setSelectedRoomId(list[0].id);
        setBulkBedForm(prev => ({ ...prev, roomId: list[0].id }));
        setSingleBedForm(prev => ({ ...prev, roomId: list[0].id }));
      } else {
        setSelectedRoomId('');
        setRoomBeds([]);
      }
    } catch (err) {
      console.error('Failed to load rooms', err);
    }
  };

  const loadRoomBeds = async (roomId) => {
    try {
      const res = await getBedsByRoom(roomId);
      setRoomBeds(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load room beds', err);
    }
  };

  // --- ACTIONS ---

  const handleCreateBuilding = async (e) => {
    e.preventDefault();
    if (!selectedBranchId) {
      alert('Please select a campus branch first');
      return;
    }
    try {
      await createBuilding({ 
        name: buildingForm.name,
        code: buildingForm.code,
        totalFloors: Number(buildingForm.totalFloors),
        branchId: Number(selectedBranchId),
        status: 'ACTIVE'
      });
      setMessage({ type: 'success', text: `Building '${buildingForm.name}' created successfully!` });
      setBuildingForm({ name: '', code: '', totalFloors: 1 });
      loadBuildings(selectedBranchId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create building');
    }
  };

  const handleDeleteBuilding = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete building '${name}'?`)) return;
    try {
      await deleteBuilding(id);
      setMessage({ type: 'success', text: 'Building deleted successfully!' });
      loadBuildings(selectedBranchId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete building');
    }
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    if (!selectedBuildingId) {
      alert('Please select a building first');
      return;
    }
    try {
      await createBlock({ 
        name: blockForm.name,
        code: blockForm.code,
        buildingId: Number(selectedBuildingId) 
      });
      setMessage({ type: 'success', text: `Wing '${blockForm.name}' added successfully!` });
      setBlockForm({ name: '', code: '' });
      loadBlocks(selectedBuildingId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create block');
    }
  };

  const handleDeleteBlock = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete wing '${name}'?`)) return;
    try {
      await deleteBlock(id);
      setMessage({ type: 'success', text: 'Wing deleted successfully!' });
      loadBlocks(selectedBuildingId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete block');
    }
  };

  const handleCreateWard = async (e) => {
    e.preventDefault();
    const targetBlockId = wardForm.blockId || selectedBlockId;
    if (!targetBlockId) {
      alert('Please select a wing/block first');
      return;
    }
    try {
      await createWard({
        blockId: Number(targetBlockId),
        departmentId: wardForm.departmentId ? Number(wardForm.departmentId) : null,
        wardTypeId: Number(wardForm.wardTypeId),
        floorNumber: Number(wardForm.floorNumber),
        wardName: wardForm.wardName,
        status: 'ACTIVE'
      });
      setMessage({ type: 'success', text: `Ward '${wardForm.wardName}' created successfully!` });
      setWardForm(prev => ({ ...prev, wardName: '', floorNumber: 1 }));
      loadWards(targetBlockId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create ward');
    }
  };

  const handleDeleteWard = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ward '${name}'?`)) return;
    try {
      await deleteWard(id);
      setMessage({ type: 'success', text: 'Ward deleted successfully!' });
      loadWards(selectedBlockId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete ward');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    const targetWardId = roomForm.wardId || selectedWardId;
    if (!targetWardId) {
      alert('Please select a ward first');
      return;
    }
    try {
      await createRoom({
        wardId: Number(targetWardId),
        roomTypeId: Number(roomForm.roomTypeId),
        roomNumber: roomForm.roomNumber,
        dailyRate: Number(roomForm.dailyRate),
        hasAttachedBathroom: Boolean(roomForm.hasAttachedBathroom),
        attachedBathroom: Boolean(roomForm.hasAttachedBathroom),
        hasOxygenSupply: Boolean(roomForm.hasOxygenSupply),
        oxygenSupply: Boolean(roomForm.hasOxygenSupply),
        status: 'ACTIVE'
      });
      setMessage({ type: 'success', text: `Room '${roomForm.roomNumber}' created successfully!` });
      setRoomForm(prev => ({ ...prev, roomNumber: '' }));
      loadRooms(targetWardId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create room');
    }
  };

  const handleSaveRate = async (roomId) => {
    try {
      await updateRoomRate(roomId, Number(newRateValue));
      setMessage({ type: 'success', text: 'Room daily billing rate updated successfully!' });
      setEditingRateRoomId(null);
      loadRooms(selectedWardId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update room rate');
    }
  };

  const handleDeleteRoom = async (id, roomNum) => {
    if (!window.confirm(`Are you sure you want to delete Room ${roomNum}?`)) return;
    try {
      await deleteRoom(id);
      setMessage({ type: 'success', text: 'Room deleted successfully!' });
      loadRooms(selectedWardId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete room');
    }
  };

  const handleBulkCreateBeds = async (e) => {
    e.preventDefault();
    const targetRoomId = bulkBedForm.roomId || selectedRoomId;
    if (!targetRoomId) {
      alert('Please select a target room first');
      return;
    }
    try {
      await bulkCreateBeds({
        roomId: Number(targetRoomId),
        bedTypeId: Number(bulkBedForm.bedTypeId),
        prefix: bulkBedForm.prefix || 'BED-',
        count: Number(bulkBedForm.count)
      });
      setMessage({ type: 'success', text: `${bulkBedForm.count} beds provisioned successfully in Room!` });
      loadRoomBeds(targetRoomId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to bulk generate beds');
    }
  };

  const handleSingleCreateBed = async (e) => {
    e.preventDefault();
    const targetRoomId = singleBedForm.roomId || selectedRoomId;
    if (!targetRoomId) {
      alert('Please select a target room first');
      return;
    }
    try {
      await createBed({
        roomId: Number(targetRoomId),
        bedTypeId: Number(singleBedForm.bedTypeId),
        bedStatusId: 1, // AVAILABLE
        bedNumber: singleBedForm.bedNumber
      });
      setMessage({ type: 'success', text: `Bed '${singleBedForm.bedNumber}' created successfully!` });
      setSingleBedForm(prev => ({ ...prev, bedNumber: '' }));
      loadRoomBeds(targetRoomId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create bed');
    }
  };

  const handleDeleteBed = async (id, bedNum) => {
    if (!window.confirm(`Delete Bed ${bedNum}?`)) return;
    try {
      await deleteBed(id);
      setMessage({ type: 'success', text: `Bed ${bedNum} deleted.` });
      loadRoomBeds(selectedRoomId);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete bed');
    }
  };

  const handleCreateCustomRoomType = async (e) => {
    e.preventDefault();
    try {
      await createRoomType({
        ...newRoomTypeForm,
        defaultDailyRate: Number(newRoomTypeForm.defaultDailyRate),
        maxBedCapacity: Number(newRoomTypeForm.maxBedCapacity),
        isActive: true
      });
      setMessage({ type: 'success', text: `Room Category '${newRoomTypeForm.name}' configured!` });
      setNewRoomTypeForm({ name: '', code: '', defaultDailyRate: 2000, maxBedCapacity: 1, ac: true, oxygenPort: true, attachedBathroom: true, description: '' });
      const res = await getRoomTypes();
      setRoomTypes(res.data);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create room type');
    }
  };

  const handleCreateCustomWardType = async (e) => {
    e.preventDefault();
    try {
      await createWardType({
        ...newWardTypeForm,
        isActive: true
      });
      setMessage({ type: 'success', text: `Ward Care Level '${newWardTypeForm.name}' configured!` });
      setNewWardTypeForm({ name: '', code: '', isCriticalCare: false, description: '' });
      const res = await getWardTypes();
      setWardTypes(res.data);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create ward type');
    }
  };

  // Active selections labels
  const currentBranch = branches.find(b => String(b.branchId || b.id) === String(selectedBranchId));
  const currentBuilding = buildings.find(b => String(b.id) === String(selectedBuildingId));
  const currentBlock = blocks.find(b => String(b.id) === String(selectedBlockId));
  const currentWard = wards.find(w => String(w.id) === String(selectedWardId));
  const currentRoom = rooms.find(r => String(r.id) === String(selectedRoomId));

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h2><Building2 size={26} color="#2563eb" /> Hospital Infrastructure & Facilities</h2>
          <p>Campus towers, wings, clinical wards, room tariffs, and bed inventory</p>
        </div>

        {/* Tab Controls */}
        <div className={styles.tabNav}>
          <button 
            className={activeTab === 'buildings' ? styles.activeTab + ' ' + styles.tabBtn : styles.tabBtn}
            onClick={() => setActiveTab('buildings')}
          >
            <Building2 size={16} /> Buildings & Wings
          </button>
          <button 
            className={activeTab === 'wards' ? styles.activeTab + ' ' + styles.tabBtn : styles.tabBtn}
            onClick={() => setActiveTab('wards')}
          >
            <Layers size={16} /> Wards Management
          </button>
          <button 
            className={activeTab === 'rooms' ? styles.activeTab + ' ' + styles.tabBtn : styles.tabBtn}
            onClick={() => setActiveTab('rooms')}
          >
            <DoorOpen size={16} /> Rooms & Tariffs
          </button>
          <button 
            className={activeTab === 'beds' ? styles.activeTab + ' ' + styles.tabBtn : styles.tabBtn}
            onClick={() => setActiveTab('beds')}
          >
            <Bed size={16} /> Bed Inventory & Generator
          </button>
          <button 
            className={activeTab === 'categories' ? styles.activeTab + ' ' + styles.tabBtn : styles.tabBtn}
            onClick={() => setActiveTab('categories')}
          >
            <Tag size={16} /> Master Categories
          </button>
        </div>
      </div>

      {message && (
        <div className={styles.banner} style={{ background: message.type === 'error' ? '#fef2f2' : '#f0fdf4', color: message.type === 'error' ? '#b91c1c' : '#15803d', border: '1px solid ' + (message.type === 'error' ? '#fca5a5' : '#86efac') }}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Dynamic Campus Hierarchy Navigator Bar */}
      <div className={styles.filterCard} style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Active Campus Hierarchy Location
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>1. Campus Branch</label>
            <select 
              className={styles.formSelect}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              {branches.map(b => (
                <option key={b.branchId || b.id} value={b.branchId || b.id}>
                  {b.branchName || b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>2. Building / Tower</label>
            <select 
              className={styles.formSelect}
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
            >
              {buildings.length === 0 ? <option value="">No Buildings</option> : null}
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>3. Wing / Block</label>
            <select 
              className={styles.formSelect}
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
            >
              {blocks.length === 0 ? <option value="">No Wings</option> : null}
              {blocks.map(blk => (
                <option key={blk.id} value={blk.id}>{blk.name} ({blk.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>4. Medical Ward Unit</label>
            <select 
              className={styles.formSelect}
              value={selectedWardId}
              onChange={(e) => setSelectedWardId(e.target.value)}
            >
              {wards.length === 0 ? <option value="">No Wards</option> : null}
              {wards.map(w => (
                <option key={w.id} value={w.id}>{w.wardName} (Flr {w.floorNumber})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>5. Room Unit</label>
            <select 
              className={styles.formSelect}
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
            >
              {rooms.length === 0 ? <option value="">No Rooms</option> : null}
              {rooms.map(rm => (
                <option key={rm.id} value={rm.id}>Room {rm.roomNumber} (₹{rm.dailyRate}/d)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ================= TAB 1: BUILDINGS & WINGS ================= */}
      {activeTab === 'buildings' && (
        <>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3><PlusCircle size={20} color="#2563eb" /> Add Building / Inpatient Tower</h3>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Branch: <strong>{currentBranch?.branchName || currentBranch?.name}</strong></span>
            </div>

            <form onSubmit={handleCreateBuilding}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Building Name *</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="e.g. Main Inpatient Tower, Trauma Center"
                    value={buildingForm.name}
                    onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Building Code (Unique) *</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="e.g. BLD-IPD-01"
                    value={buildingForm.code}
                    onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Total Floors *</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={50}
                    className={styles.formInput} 
                    value={buildingForm.totalFloors}
                    onChange={(e) => setBuildingForm({ ...buildingForm, totalFloors: e.target.value })}
                    required
                  />
                </div>
              </div>
              <button type="submit" className={styles.btnPrimary}><PlusCircle size={16} /> Save Building</button>
            </form>
          </div>

          {/* Buildings List */}
          <div className={styles.tableCard} style={{ marginTop: '24px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Campus Buildings ({buildings.length})</h3>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Select a building below to manage its wings and wards</span>
            </div>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Building Name</th>
                  <th>Code</th>
                  <th>Floors</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map(b => (
                  <tr 
                    key={b.id} 
                    style={{ background: String(b.id) === String(selectedBuildingId) ? '#eff6ff' : 'transparent', cursor: 'pointer' }}
                    onClick={() => setSelectedBuildingId(b.id)}
                  >
                    <td style={{ fontWeight: 700 }}>
                      {String(b.id) === String(selectedBuildingId) && <span style={{ color: '#2563eb', marginRight: '6px' }}>●</span>}
                      {b.name}
                    </td>
                    <td><code>{b.code}</code></td>
                    <td>{b.totalFloors} Floors</td>
                    <td><span className={styles.badge} style={{ background: '#f0fdf4', color: '#16a34a' }}>{b.status}</span></td>
                    <td>
                      <button 
                        className={styles.btnAction} 
                        style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        onClick={(e) => { e.stopPropagation(); handleDeleteBuilding(b.id, b.name); }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Wings / Blocks for Selected Building */}
          {selectedBuildingId && (
            <div className={styles.card} style={{ marginTop: '24px' }}>
              <div className={styles.cardHeader}>
                <h3><Layers size={20} color="#2563eb" /> Wings & Blocks for {currentBuilding?.name}</h3>
              </div>

              {/* Add Wing Form */}
              <form onSubmit={handleCreateBlock} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #f1f5f9' }}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Wing / Block Name *</label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      placeholder="e.g. East Wing - Block A"
                      value={blockForm.name}
                      onChange={(e) => setBlockForm({ ...blockForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Wing Code *</label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      placeholder="e.g. EW-A"
                      value={blockForm.code}
                      onChange={(e) => setBlockForm({ ...blockForm, code: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className={styles.btnPrimary}><PlusCircle size={16} /> Add Wing / Block</button>
              </form>

              {/* Wings Table */}
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Wing / Block Name</th>
                    <th>Code</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No wings created in this building yet.</td></tr>
                  ) : (
                    blocks.map(blk => (
                      <tr 
                        key={blk.id}
                        style={{ background: String(blk.id) === String(selectedBlockId) ? '#eff6ff' : 'transparent', cursor: 'pointer' }}
                        onClick={() => setSelectedBlockId(blk.id)}
                      >
                        <td style={{ fontWeight: 600 }}>
                          {String(blk.id) === String(selectedBlockId) && <span style={{ color: '#2563eb', marginRight: '6px' }}>●</span>}
                          {blk.name}
                        </td>
                        <td><code>{blk.code}</code></td>
                        <td>
                          <button 
                            className={styles.btnAction} 
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteBlock(blk.id, blk.name); }}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ================= TAB 2: WARDS MANAGEMENT ================= */}
      {activeTab === 'wards' && (
        <>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3><PlusCircle size={20} color="#2563eb" /> Create New Medical Ward</h3>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Building: <strong>{currentBuilding?.name}</strong> • Wing: <strong>{currentBlock?.name}</strong>
              </span>
            </div>
            <form onSubmit={handleCreateWard}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Target Wing / Block *</label>
                  <select 
                    className={styles.formSelect}
                    value={wardForm.blockId || selectedBlockId}
                    onChange={(e) => {
                      setWardForm({ ...wardForm, blockId: e.target.value });
                      setSelectedBlockId(e.target.value);
                    }}
                    required
                  >
                    <option value="">-- Choose Wing --</option>
                    {blocks.map(blk => (
                      <option key={blk.id} value={blk.id}>{blk.name} ({blk.code})</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Ward Name *</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="e.g. Medical Intensive Care Unit (MICU)"
                    value={wardForm.wardName}
                    onChange={(e) => setWardForm({ ...wardForm, wardName: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Ward Care Level / Type *</label>
                  <select 
                    className={styles.formSelect}
                    value={wardForm.wardTypeId}
                    onChange={(e) => setWardForm({ ...wardForm, wardTypeId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Ward Type --</option>
                    {wardTypes.map(wt => (
                      <option key={wt.id} value={wt.id}>
                        {wt.name} {wt.criticalCare || wt.isCriticalCare ? '🚨 (Critical Care)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Floor Number *</label>
                  <input 
                    type="number" 
                    min={0} 
                    max={50}
                    className={styles.formInput} 
                    value={wardForm.floorNumber}
                    onChange={(e) => setWardForm({ ...wardForm, floorNumber: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Linked Medical Department</label>
                  <select 
                    className={styles.formSelect}
                    value={wardForm.departmentId}
                    onChange={(e) => setWardForm({ ...wardForm, departmentId: e.target.value })}
                  >
                    <option value="">-- General / Multi-Disciplinary --</option>
                    {departments.map(d => (
                      <option key={d.departmentId || d.id} value={d.departmentId || d.id}>
                        {d.departmentName || d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className={styles.btnPrimary}><PlusCircle size={16} /> Save Ward</button>
            </form>
          </div>

          {/* Wards List */}
          <div className={styles.tableCard} style={{ marginTop: '24px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Wards in {currentBlock?.name || 'Selected Wing'} ({wards.length})</h3>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Select a ward below to manage its rooms and beds</span>
            </div>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Ward Name</th>
                  <th>Floor</th>
                  <th>Care Level</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {wards.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No wards configured in this wing yet.</td></tr>
                ) : (
                  wards.map(w => {
                    const wt = wardTypes.find(x => x.id === w.wardTypeId);
                    const isCrit = wt?.criticalCare || wt?.isCriticalCare;
                    const dept = departments.find(x => String(x.departmentId || x.id) === String(w.departmentId));
                    return (
                      <tr 
                        key={w.id}
                        style={{ background: String(w.id) === String(selectedWardId) ? '#eff6ff' : 'transparent', cursor: 'pointer' }}
                        onClick={() => setSelectedWardId(w.id)}
                      >
                        <td style={{ fontWeight: 700 }}>
                          {String(w.id) === String(selectedWardId) && <span style={{ color: '#2563eb', marginRight: '6px' }}>●</span>}
                          {w.wardName}
                        </td>
                        <td>Floor {w.floorNumber}</td>
                        <td>
                          <span className={styles.badge} style={{ background: isCrit ? '#fef2f2' : '#eff6ff', color: isCrit ? '#b91c1c' : '#2563eb' }}>
                            {wt?.name || `Type #${w.wardTypeId}`}
                          </span>
                        </td>
                        <td>{dept ? (dept.departmentName || dept.name) : <span style={{ color: '#94a3b8' }}>Multi-Disciplinary</span>}</td>
                        <td><span className={styles.badge} style={{ background: '#f0fdf4', color: '#16a34a' }}>{w.status}</span></td>
                        <td>
                          <button 
                            className={styles.btnAction} 
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteWard(w.id, w.wardName); }}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================= TAB 3: ROOMS & DAILY TARIFFS ================= */}
      {activeTab === 'rooms' && (
        <>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3><PlusCircle size={20} color="#2563eb" /> Create Room & Daily Tariff</h3>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Ward: <strong>{currentWard?.wardName}</strong> (Floor {currentWard?.floorNumber})
              </span>
            </div>

            <form onSubmit={handleCreateRoom}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Room Number / Code *</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="e.g. 301, ICU-01, DLX-204"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Room Category / Type *</label>
                  <select 
                    className={styles.formSelect}
                    value={roomForm.roomTypeId}
                    onChange={(e) => {
                      const rt = roomTypes.find(x => String(x.id) === e.target.value);
                      setRoomForm({ 
                        ...roomForm, 
                        roomTypeId: e.target.value,
                        dailyRate: rt ? rt.defaultDailyRate : roomForm.dailyRate
                      });
                    }}
                    required
                  >
                    <option value="">-- Choose Category --</option>
                    {roomTypes.map(rt => (
                      <option key={rt.id} value={rt.id}>{rt.name} (Base: ₹{rt.defaultDailyRate}/day)</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Daily Billing Tariff (₹ / Day) *</label>
                  <input 
                    type="number" 
                    min={0}
                    step={50}
                    className={styles.formInput} 
                    value={roomForm.dailyRate}
                    onChange={(e) => setRoomForm({ ...roomForm, dailyRate: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                  <label style={{ margin: 0 }}>Room Amenities</label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={roomForm.hasAttachedBathroom}
                        onChange={(e) => setRoomForm({ ...roomForm, hasAttachedBathroom: e.target.checked })}
                      />
                      Attached Bathroom
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={roomForm.hasOxygenSupply}
                        onChange={(e) => setRoomForm({ ...roomForm, hasOxygenSupply: e.target.checked })}
                      />
                      Oxygen Port
                    </label>
                  </div>
                </div>
              </div>
              <button type="submit" className={styles.btnPrimary}><PlusCircle size={16} /> Save Room</button>
            </form>
          </div>

          {/* Rooms Table */}
          <div className={styles.tableCard} style={{ marginTop: '24px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Rooms in {currentWard?.wardName || 'Selected Ward'} ({rooms.length})</h3>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Select a room to inspect its beds or update tariffs</span>
            </div>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Room Number</th>
                  <th>Category</th>
                  <th>Daily Billing Tariff</th>
                  <th>Amenities</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rooms.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No rooms configured in this ward yet.</td></tr>
                ) : (
                  rooms.map(rm => {
                    const rt = roomTypes.find(x => x.id === rm.roomTypeId);
                    const isEditing = editingRateRoomId === rm.id;
                    const hasBath = Boolean(rm.hasAttachedBathroom ?? rm.attachedBathroom);
                    const hasO2 = Boolean(rm.hasOxygenSupply ?? rm.oxygenSupply);

                    return (
                      <tr 
                        key={rm.id}
                        style={{ background: String(rm.id) === String(selectedRoomId) ? '#eff6ff' : 'transparent', cursor: 'pointer' }}
                        onClick={() => setSelectedRoomId(rm.id)}
                      >
                        <td style={{ fontWeight: 700 }}>
                          {String(rm.id) === String(selectedRoomId) && <span style={{ color: '#2563eb', marginRight: '6px' }}>●</span>}
                          Room {rm.roomNumber}
                        </td>
                        <td>{rt?.name || `Type #${rm.roomTypeId}`}</td>
                        <td>
                          {isEditing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
                              <input 
                                type="number" 
                                className={styles.formInput} 
                                style={{ width: '100px', padding: '4px 8px' }}
                                value={newRateValue} 
                                onChange={(e) => setNewRateValue(e.target.value)} 
                              />
                              <button 
                                className={styles.btnAction} 
                                style={{ background: '#2563eb', color: '#fff', border: 'none' }}
                                onClick={() => handleSaveRate(rm.id)}
                              >
                                <Check size={14} /> Save
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ color: '#16a34a' }}>₹{rm.dailyRate} / day</strong>
                              <button 
                                className={styles.btnAction} 
                                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRateRoomId(rm.id);
                                  setNewRateValue(rm.dailyRate);
                                }}
                              >
                                Edit Rate
                              </button>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {hasBath && <span className={styles.badge} style={{ background: '#f0fdf4', color: '#16a34a' }}>Bath</span>}
                            {hasO2 && <span className={styles.badge} style={{ background: '#eff6ff', color: '#2563eb' }}>Oxygen</span>}
                          </div>
                        </td>
                        <td><span className={styles.badge} style={{ background: '#f0fdf4', color: '#16a34a' }}>{rm.status}</span></td>
                        <td>
                          <button 
                            className={styles.btnAction} 
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteRoom(rm.id, rm.roomNumber); }}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================= TAB 4: BED PROVISIONING & INVENTORY ================= */}
      {activeTab === 'beds' && (
        <>
          {/* Room Overview Card */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.2rem' }}>
                Room {currentRoom?.roomNumber || 'None Selected'}
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#3b82f6', fontSize: '0.9rem' }}>
                {currentWard?.wardName} • {currentBlock?.name} • Tariff: <strong>₹{currentRoom?.dailyRate || 0} / day</strong>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8' }}>{roomBeds.length}</span>
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>Provisioned Beds</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            {/* Bulk Generator Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3><Sparkles size={20} color="#2563eb" /> Bulk Bed Auto-Generator</h3>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
                Rapidly provision multiple beds at once (e.g. 4 beds in a General Ward unit).
              </p>
              <form onSubmit={handleBulkCreateBeds}>
                <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                  <label>Bed Engineering Type *</label>
                  <select 
                    className={styles.formSelect}
                    value={bulkBedForm.bedTypeId}
                    onChange={(e) => setBulkBedForm({ ...bulkBedForm, bedTypeId: e.target.value })}
                    required
                  >
                    {bedTypes.map(bt => (
                      <option key={bt.id} value={bt.id}>
                        {bt.name} {bt.isElectric ? '(Electric)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Prefix *</label>
                    <input 
                      type="text" 
                      className={styles.formInput} 
                      value={bulkBedForm.prefix}
                      onChange={(e) => setBulkBedForm({ ...bulkBedForm, prefix: e.target.value })}
                      placeholder="e.g. BED-, ICU-"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Count (1 - 20) *</label>
                    <input 
                      type="number" 
                      className={styles.formInput} 
                      min={1} 
                      max={20}
                      value={bulkBedForm.count}
                      onChange={(e) => setBulkBedForm({ ...bulkBedForm, count: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                  <Sparkles size={16} /> Auto-Generate {bulkBedForm.count} Beds
                </button>
              </form>
            </div>

            {/* Single Bed Adder */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3><PlusCircle size={20} color="#2563eb" /> Single Custom Bed</h3>
              </div>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
                Add an individual custom-labelled bed (e.g. specialized ventilator bed).
              </p>
              <form onSubmit={handleSingleCreateBed}>
                <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                  <label>Bed Number / Identifier *</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    placeholder="e.g. VENT-BED-09"
                    value={singleBedForm.bedNumber}
                    onChange={(e) => setSingleBedForm({ ...singleBedForm, bedNumber: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '14px' }}>
                  <label>Bed Engineering Type *</label>
                  <select 
                    className={styles.formSelect}
                    value={singleBedForm.bedTypeId}
                    onChange={(e) => setSingleBedForm({ ...singleBedForm, bedTypeId: e.target.value })}
                    required
                  >
                    {bedTypes.map(bt => (
                      <option key={bt.id} value={bt.id}>
                        {bt.name} {bt.isElectric ? '(Electric)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <button type="submit" className={styles.btnPrimary} style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                  <PlusCircle size={16} /> Add Single Bed
                </button>
              </form>
            </div>
          </div>

          {/* Room Beds Table */}
          <div className={styles.tableCard}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Active Beds in Room {currentRoom?.roomNumber} ({roomBeds.length})</h3>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>All beds created in this room</span>
            </div>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Bed Number</th>
                  <th>Engineering Specification</th>
                  <th>Current Live Status</th>
                  <th>Admitted Patient</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {roomBeds.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>No beds provisioned in this room yet. Use the bulk generator above!</td></tr>
                ) : (
                  roomBeds.map(b => {
                    const bt = bedTypes.find(x => x.id === b.bedTypeId);
                    const bs = bedStatuses.find(x => x.id === b.bedStatusId);
                    return (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 700 }}>{b.bedNumber}</td>
                        <td>{bt?.name || `Type #${b.bedTypeId}`}</td>
                        <td>
                          <span className={styles.badge} style={{ background: (bs?.colorCode || '#10b981') + '22', color: bs?.colorCode || '#10b981' }}>
                            {bs?.name || bs?.code || 'AVAILABLE'}
                          </span>
                        </td>
                        <td>{b.currentPatientName || <span style={{ color: '#94a3b8' }}>None</span>}</td>
                        <td>
                          <button 
                            className={styles.btnAction} 
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            onClick={() => handleDeleteBed(b.id, b.bedNumber)}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================= TAB 5: MASTER CATEGORIES & TARIFFS ================= */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Room Types */}
          <div className={styles.tableCard}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Room Categories & Base Tariffs ({roomTypes.length})</h3>
            </div>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Code</th>
                  <th>Base Daily Tariff</th>
                  <th>Max Capacity</th>
                  <th>Amenities</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {roomTypes.map(rt => (
                  <tr key={rt.id}>
                    <td style={{ fontWeight: 700 }}>{rt.name}</td>
                    <td><code>{rt.code}</code></td>
                    <td><strong style={{ color: '#16a34a' }}>₹{rt.defaultDailyRate} / day</strong></td>
                    <td>{rt.maxBedCapacity} Bed(s)</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {rt.ac && <span className={styles.badge} style={{ background: '#f0fdf4', color: '#16a34a' }}>AC</span>}
                        {rt.oxygenPort && <span className={styles.badge} style={{ background: '#eff6ff', color: '#2563eb' }}>Oxygen</span>}
                        {rt.attachedBathroom && <span className={styles.badge} style={{ background: '#fdf4ff', color: '#9333ea' }}>Bath</span>}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{rt.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ward Types */}
          <div className={styles.tableCard}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Ward Care Levels & Acuity ({wardTypes.length})</h3>
            </div>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Care Level Name</th>
                  <th>Code</th>
                  <th>Critical Care Flag</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {wardTypes.map(wt => {
                  const isCrit = wt.criticalCare || wt.isCriticalCare;
                  return (
                    <tr key={wt.id}>
                      <td style={{ fontWeight: 700 }}>{wt.name}</td>
                      <td><code>{wt.code}</code></td>
                      <td>
                        <span className={styles.badge} style={{ background: isCrit ? '#fef2f2' : '#eff6ff', color: isCrit ? '#b91c1c' : '#2563eb' }}>
                          {isCrit ? '🚨 Critical Care' : 'Routine Inpatient'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{wt.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bed Types & Bed Statuses Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            {/* Bed Engineering Specs */}
            <div className={styles.tableCard}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Bed Engineering Specs ({bedTypes.length})</h3>
              </div>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Type Name</th>
                    <th>Electric</th>
                    <th>Ventilator Mount</th>
                  </tr>
                </thead>
                <tbody>
                  {bedTypes.map(bt => (
                    <tr key={bt.id}>
                      <td style={{ fontWeight: 600 }}>{bt.name}</td>
                      <td>{bt.isElectric ? '⚡ Yes' : 'Manual'}</td>
                      <td>{bt.ventilatorMount || bt.hasVentilatorMount ? '🫁 Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bed Operational Statuses */}
            <div className={styles.tableCard}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Bed Operational Statuses ({bedStatuses.length})</h3>
              </div>
              <table className={styles.customTable}>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Color</th>
                    <th>Clinical Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {bedStatuses.map(bs => (
                    <tr key={bs.id}>
                      <td>
                        <span className={styles.badge} style={{ background: bs.colorCode + '22', color: bs.colorCode }}>
                          {bs.name}
                        </span>
                      </td>
                      <td><code>{bs.colorCode}</code></td>
                      <td style={{ fontSize: '0.85rem', color: '#64748b' }}>{bs.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityManagementPage;
