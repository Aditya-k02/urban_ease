import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Building2,
    Layers,
    Home,
    Plus,
    Trash2,
    Save,
    CheckCircle,
    LayoutTemplate
} from 'lucide-react';
import '../../assets/css/Manager/managerSetup.css';

const API_BASE_URL = 'http://localhost:3000';

const ManagerSetup = () => {
    const navigate = useNavigate();
    const [blocks, setBlocks] = useState([
        { name: 'A', totalFloors: 5, flatsPerFloor: 4 }
    ]);
    const [loading, setLoading] = useState(false);
    const [fetchingStructure, setFetchingStructure] = useState(true);

    // Fetch existing structure on mount
    useEffect(() => {
        const fetchStructure = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/manager/get-structure`, {
                    withCredentials: true
                });

                if (res.data.success && res.data.blocks && res.data.blocks.length > 0) {
                    setBlocks(res.data.blocks);
                }
            } catch (err) {
                console.error('Error fetching structure:', err);
                // Keep default single block if fetch fails
            } finally {
                setFetchingStructure(false);
            }
        };

        fetchStructure();
    }, []);

    // Add a new block
    const handleAddBlock = () => {
        const nextChar = String.fromCharCode(65 + blocks.length); // A, B, C...
        setBlocks([...blocks, { name: nextChar, totalFloors: 5, flatsPerFloor: 4 }]);
    };

    // Remove a block
    const handleRemoveBlock = (index) => {
        const newBlocks = blocks.filter((_, i) => i !== index);
        setBlocks(newBlocks);
    };

    // Update block fields
    const handleBlockChange = (index, field, value) => {
        const newBlocks = [...blocks];
        newBlocks[index][field] = value;
        setBlocks(newBlocks);
    };

    // Stats calculation
    const totalBlocks = blocks.length;
    const totalFloors = blocks.reduce((acc, b) => acc + parseInt(b.totalFloors || 0), 0);
    const totalUnits = blocks.reduce((acc, b) => acc + (parseInt(b.totalFloors || 0) * parseInt(b.flatsPerFloor || 0)), 0);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = blocks.map(b => ({
                name: b.name,
                totalFloors: parseInt(b.totalFloors),
                flatsPerFloor: parseInt(b.flatsPerFloor)
            }));

            const res = await axios.post(`${API_BASE_URL}/manager/setup-structure`, { blocks: payload }, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.data.success) {
                // alert('Community setup complete!');
                window.location.href = '/manager/dashboard';
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Setup failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="setup-container">
            {/* Header */}
            <div className="setup-header">
                <div>
                    <h2><LayoutTemplate className="text-primary" size={28} /> Community Structure Setup</h2>
                    <p>Define the physical layout of your community to generate resident units.</p>
                </div>
            </div>

            {fetchingStructure ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Loading structure...</p>
                </div>
            ) : (
                <>
                    {/* Stats Overview */}
                    <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon blue"><Building2 size={24} /></div>
                    <div className="stat-info">
                        <h3>Blocks</h3>
                        <div className="value">{totalBlocks}</div>
                    </div>
                </div>
                <div className="stat-card orange"><div className="stat-icon orange"><Layers size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Floors</h3>
                        <div className="value">{totalFloors}</div>
                    </div>
                </div>
                <div className="stat-card green"><div className="stat-icon green"><Home size={24} /></div>
                    <div className="stat-info">
                        <h3>Total Units</h3>
                        <div className="value">{totalUnits}</div>
                    </div>
                </div>
            </div>

            {/* Blocks Configuration */}
            <div className="blocks-section">
                <div className="section-label">
                    <span>Block Configuration</span>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>Add blocks and define their height/width</span>
                </div>

                <div className="blocks-grid">
                    {blocks.map((block, index) => (
                        <div key={index} className="block-card">
                            <div className="block-header">
                                <h4>Block {index + 1}</h4>
                                {blocks.length > 1 && (
                                    <button className="remove-btn" onClick={() => handleRemoveBlock(index)}>
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="block-body">
                                <div className="input-group">
                                    <label>Block/Tower Name</label>
                                    <input
                                        type="text"
                                        value={block.name}
                                        onChange={(e) => handleBlockChange(index, 'name', e.target.value)}
                                        placeholder="e.g. A"
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Total Floors</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={block.totalFloors}
                                        onChange={(e) => handleBlockChange(index, 'totalFloors', e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Units per Floor</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={block.flatsPerFloor}
                                        onChange={(e) => handleBlockChange(index, 'flatsPerFloor', e.target.value)}
                                    />
                                </div>

                                <div className="block-summary-tag">
                                    Generating {block.totalFloors * block.flatsPerFloor} Units
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Block Button Card */}
                    <div className="add-block-card" onClick={handleAddBlock}>
                        <div className="add-btn-icon"><Plus size={32} /></div>
                        <span>Add Another Block</span>
                    </div>
                </div>
            </div>

            {/* Floating Footer Action */}
            <div className="setup-footer">
                <div className="total-badge">
                    Total to generate: <span className="text-primary">{totalUnits} Units</span>
                </div>
                <button className="save-btn" onClick={handleSubmit} disabled={loading}>
                    {loading ? (
                        <>Generating...</>
                    ) : (
                        <><CheckCircle size={18} /> Save & Build Community</>
                    )}
                </button>
            </div>
            </>
            )}

        </div>
    );
};

export default ManagerSetup;
