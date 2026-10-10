import api from './api';

// --- BED & INPATIENT ACTIONS ---
export const getLiveBedMatrix = (branchId) => api.get('/api/beds/live-matrix', { params: branchId ? { branchId } : {} });
export const getBedById = (id) => api.get('/api/beds/' + id);
export const getBedsByRoom = (roomId) => api.get('/api/beds/room/' + roomId);
export const createBed = (data) => api.post('/api/beds', data);
export const bulkCreateBeds = (data) => api.post('/api/beds/bulk', data);
export const updateBed = (id, data) => api.put('/api/beds/' + id, data);
export const deleteBed = (id) => api.delete('/api/beds/' + id);

export const allocateBed = (bedId, data) => api.post('/api/beds/' + bedId + '/allocate', data);
export const transferBed = (data) => api.post('/api/beds/transfer', data);
export const releaseBed = (bedId, data) => api.post('/api/beds/' + bedId + '/release', data);
export const updateBedStatus = (bedId, data) => api.patch('/api/beds/' + bedId + '/status', data);
export const getBedHistory = (bedId) => api.get('/api/beds/' + bedId + '/history');

// --- BUILDINGS & BLOCKS ---
export const getBuildings = (branchId) => branchId ? api.get('/api/buildings/branch/' + branchId) : api.get('/api/buildings');
export const getBuildingById = (id) => api.get('/api/buildings/' + id);
export const createBuilding = (data) => api.post('/api/buildings', data);
export const updateBuilding = (id, data) => api.put('/api/buildings/' + id, data);
export const deleteBuilding = (id) => api.delete('/api/buildings/' + id);

export const getBlocks = (buildingId) => api.get('/api/blocks/building/' + buildingId);
export const createBlock = (data) => api.post('/api/blocks', data);
export const updateBlock = (id, data) => api.put('/api/blocks/' + id, data);
export const deleteBlock = (id) => api.delete('/api/blocks/' + id);

// --- WARDS ---
export const getWards = (blockId) => blockId ? api.get('/api/wards/block/' + blockId) : api.get('/api/wards');
export const getWardById = (id) => api.get('/api/wards/' + id);
export const createWard = (data) => api.post('/api/wards', data);
export const updateWard = (id, data) => api.put('/api/wards/' + id, data);
export const deleteWard = (id) => api.delete('/api/wards/' + id);

// --- ROOMS ---
export const getRooms = (wardId) => api.get('/api/rooms/ward/' + wardId);
export const getRoomById = (id) => api.get('/api/rooms/' + id);
export const createRoom = (data) => api.post('/api/rooms', data);
export const updateRoom = (id, data) => api.put('/api/rooms/' + id, data);
export const updateRoomRate = (id, dailyRate) => api.patch('/api/rooms/' + id + '/rate', { dailyRate });
export const deleteRoom = (id) => api.delete('/api/rooms/' + id);

// --- MASTER TYPES ---
export const getWardTypes = () => api.get('/api/ward-types');
export const createWardType = (data) => api.post('/api/ward-types', data);
export const getRoomTypes = () => api.get('/api/room-types');
export const createRoomType = (data) => api.post('/api/room-types', data);
export const getBedTypes = () => api.get('/api/bed-types');
export const createBedType = (data) => api.post('/api/bed-types', data);
export const getBedStatuses = () => api.get('/api/bed-statuses');

// --- INTEGRATED METADATA ---
export const getBranches = () => api.get('/api/branches');
export const getDepartments = () => api.get('/api/departments');
export const getPatients = () => api.get('/patients/getAllPatients');
