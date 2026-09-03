import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [role, setRole] = useState(localStorage.getItem('adminRole'));
  
  const [password, setPassword] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedTeam, setExpandedTeam] = useState(null);

  // Edit state
  const [editingTeam, setEditingTeam] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  useEffect(() => {
    if (token) {
      fetchTeams();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (res.ok) {
        setToken(data.token);
        setRole(data.role);
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminRole', data.role);
        setPassword('');
      } else {
        setError(data.msg || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRole');
    setTeams([]);
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_URL + '/admin/teams', {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      if (res.ok) {
        setTeams(data);
      } else {
        setError(data.msg);
        if (res.status === 401) handleLogout();
      }
    } catch (err) {
      setError('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (id, teamName) => {
    if (!window.confirm(`Are you sure you want to delete the team: ${teamName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/teams/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });
      
      if (res.ok) {
        setTeams(teams.filter(t => t._id !== id));
      } else {
        const data = await res.json();
        alert('Failed to delete: ' + data.msg);
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  const handleEditClick = (team) => {
    setEditingTeam(team._id);
    // Deep clone team data for editing
    setEditFormData(JSON.parse(JSON.stringify(team)));
  };

  const handleEditMemberChange = (index, field, value) => {
    const updated = { ...editFormData };
    updated.members[index][field] = value;
    setEditFormData(updated);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/teams/${editingTeam}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-auth-token': token 
        },
        body: JSON.stringify({
          teamName: editFormData.teamName,
          members: editFormData.members
        })
      });
      
      if (res.ok) {
        const updatedTeam = await res.json();
        setTeams(teams.map(t => t._id === editingTeam ? updatedTeam : t));
        setEditingTeam(null);
        setEditFormData(null);
      } else {
        const data = await res.json();
        alert('Failed to update: ' + data.msg);
      }
    } catch (err) {
      alert('Error connecting to server');
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', position: 'relative', zIndex: 100 }}>
        <button onClick={() => navigate('/')} className="back-btn">&lt; RETURN TO BASE</button>
        <div className="terminal-form">
          <div className="terminal-header">Admin Terminal // Authentication Required</div>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem', marginTop: '1rem', color: 'rgba(57, 255, 20, 0.9)', textShadow: '0 0 10px rgba(57, 255, 20, 0.5)' }}>
            RESTRICTED ACCESS
          </h2>
          {error && <div style={{ color: '#ff3333', marginBottom: '1rem', textAlign: 'center' }}>[ERROR]: {error}</div>}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="input-group">
              <label>&gt; ENTER CLEARANCE CODE_</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={{ letterSpacing: '5px' }}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '[ VERIFYING... ]' : '[ ACCESS ]'}
            </button>
          </form>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', position: 'relative', zIndex: 100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ color: 'rgba(57, 255, 20, 0.9)', textShadow: '0 0 10px rgba(57, 255, 20, 0.5)', margin: 0, fontFamily: 'var(--font-mono)' }}>DATABASE TERMINAL</h1>
          <p style={{ color: '#888', margin: 0, fontFamily: 'var(--font-mono)' }}>
            Access Level: <strong style={{ color: role === 'write' ? '#ff3333' : '#39ff14', textTransform: 'uppercase' }}>{role}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => navigate('/')} className="btn-outline">HOME</button>
          <button onClick={handleLogout} className="btn-outline" style={{ borderColor: '#ff3333', color: '#ff3333' }}>LOGOUT</button>
        </div>
      </div>

      {loading && !teams.length ? (
        <div style={{ color: 'rgba(57, 255, 20, 0.9)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>[ FETCHING DATA... ]</div>
      ) : (
        <div className="data-container">
          <div style={{ marginBottom: '1rem', fontFamily: 'var(--font-mono)', color: 'rgba(57, 255, 20, 0.9)' }}>
            TOTAL REGISTERED SQUADS: {teams.length}
          </div>
          
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>TEAM ID</th>
                  <th>SQUAD DESIGNATION</th>
                  <th>OPERATIVES</th>
                  <th>REGISTERED ON</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {teams.map(team => (
                  <React.Fragment key={team._id}>
                    <tr>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{team.teamNumber}</td>
                      <td>{team.teamName}</td>
                      <td>{team.members.length}</td>
                      <td>{new Date(team.createdAt).toLocaleString()}</td>
                      <td style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="btn-small" 
                          onClick={() => setExpandedTeam(expandedTeam === team._id ? null : team._id)}
                        >
                          {expandedTeam === team._id ? 'HIDE DETAILS' : 'VIEW DETAILS'}
                        </button>
                        {role === 'write' && (
                          <>
                            <button className="btn-small" style={{ borderColor: '#ffaa00', color: '#ffaa00' }} onClick={() => handleEditClick(team)}>
                              EDIT
                            </button>
                            <button className="btn-small" style={{ borderColor: '#ff3333', color: '#ff3333' }} onClick={() => handleDeleteTeam(team._id, team.teamName)}>
                              DELETE
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                    {expandedTeam === team._id && (
                      <tr className="details-row">
                        <td colSpan="5">
                          <div className="members-grid">
                            {team.members.map((member, i) => (
                              <div key={member._id || i} className="member-card">
                                <h4>OPERATIVE 0{i + 1}</h4>
                                <p><strong>NAME:</strong> {member.name}</p>
                                <p><strong>REG NO:</strong> {member.registerNumber}</p>
                                <p><strong>YEAR:</strong> {member.yearOfGraduation}</p>
                                <p><strong>COURSE:</strong> {member.course}</p>
                                <p><strong>SPECIALTY:</strong> {member.specialization}</p>
                                <p><strong>PHONE:</strong> {member.contactNumber}</p>
                                <p><strong>EMAIL:</strong> {member.email}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTeam && editFormData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ color: '#ffaa00', marginBottom: '1rem', fontFamily: 'var(--font-mono)' }}>EDIT SQUAD: {editFormData.teamNumber}</h3>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label>SQUAD DESIGNATION (TEAM NAME)</label>
                <input 
                  type="text" 
                  value={editFormData.teamName} 
                  onChange={e => setEditFormData({...editFormData, teamName: e.target.value})}
                  required
                />
              </div>
              
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '1rem' }}>
                {editFormData.members.map((member, i) => (
                  <div key={i} style={{ border: '1px solid #444', padding: '1rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                    <h4 style={{ color: '#888', marginTop: 0 }}>OPERATIVE 0{i + 1}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="input-group">
                        <label>NAME</label>
                        <input type="text" value={member.name} onChange={e => handleEditMemberChange(i, 'name', e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label>REG NO</label>
                        <input type="text" value={member.registerNumber} onChange={e => handleEditMemberChange(i, 'registerNumber', e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label>EMAIL</label>
                        <input type="email" value={member.email} onChange={e => handleEditMemberChange(i, 'email', e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label>PHONE</label>
                        <input type="text" value={member.contactNumber} onChange={e => handleEditMemberChange(i, 'contactNumber', e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label>COURSE</label>
                        <input type="text" value={member.course} onChange={e => handleEditMemberChange(i, 'course', e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label>SPECIALTY</label>
                        <input type="text" value={member.specialization} onChange={e => handleEditMemberChange(i, 'specialization', e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <label>YEAR</label>
                        <input type="number" value={member.yearOfGraduation} onChange={e => handleEditMemberChange(i, 'yearOfGraduation', e.target.value)} required />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setEditingTeam(null)}>CANCEL</button>
                <button type="submit" className="btn-primary" style={{ borderColor: '#ffaa00', color: '#ffaa00' }}>SAVE CHANGES</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{styles}</style>
    </div>
  );
};

const styles = `
  .back-btn {
    position: absolute;
    top: 2rem;
    left: 2rem;
    background: transparent;
    border: none;
    color: var(--color-accent);
    font-family: var(--font-mono);
    font-size: 1rem;
    cursor: pointer;
    text-transform: uppercase;
  }

  .terminal-form {
    width: 100%;
    max-width: 500px;
    padding: 3rem;
    border: 2px solid rgba(57, 255, 20, 0.5);
    border-radius: 5px;
    background-color: #002729;
    box-shadow: 0 0 30px rgba(57, 255, 20, 0.1);
    position: relative;
  }

  .terminal-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 0.5rem;
    background-color: rgba(57, 255, 20, 0.8);
    color: #000;
    font-weight: bold;
    font-family: var(--font-mono);
    text-align: center;
    text-transform: uppercase;
    font-size: 0.8rem;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .input-group label {
    font-family: var(--font-mono);
    color: #888;
    font-size: 0.9rem;
  }

  .input-group input {
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(57, 255, 20, 0.5);
    color: var(--color-text);
    padding: 0.5rem 0;
    font-family: var(--font-mono);
    font-size: 1.1rem;
    outline: none;
  }

  .input-group input:focus {
    border-bottom-color: rgba(57, 255, 20, 1);
  }

  .btn-primary, .btn-outline {
    padding: 0.8rem 1.5rem;
    font-family: var(--font-mono);
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: bold;
  }

  .btn-primary {
    background: transparent;
    border: 1px solid rgba(57, 255, 20, 0.8);
    color: rgba(57, 255, 20, 0.8);
    box-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
    text-shadow: 0 0 5px rgba(57, 255, 20, 0.5);
  }

  .btn-primary:hover:not(:disabled) {
    background: rgba(57, 255, 20, 0.8);
    color: #000;
    box-shadow: 0 0 20px rgba(57, 255, 20, 0.6);
    text-shadow: none;
  }

  .btn-outline {
    background: transparent;
    border: 1px solid rgba(155, 168, 168, 0.5);
    color: var(--color-text);
  }

  .btn-outline:hover:not(:disabled) {
    border-color: var(--color-text);
  }

  .btn-small {
    padding: 0.4rem 0.8rem;
    background: transparent;
    border: 1px solid rgba(57, 255, 20, 0.5);
    color: rgba(57, 255, 20, 0.8);
    font-family: var(--font-mono);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 0 5px rgba(57, 255, 20, 0.2);
  }
  
  .btn-small:hover {
    background: rgba(57, 255, 20, 0.2);
    box-shadow: 0 0 10px rgba(57, 255, 20, 0.4);
  }

  .data-container {
    background: rgba(0, 39, 41, 0.8);
    border: 1px solid rgba(57, 255, 20, 0.3);
    border-radius: 5px;
    padding: 2rem;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    text-align: left;
  }

  .admin-table th {
    color: rgba(57, 255, 20, 0.9);
    border-bottom: 1px solid rgba(57, 255, 20, 0.5);
    padding: 1rem;
  }

  .admin-table td {
    padding: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .details-row td {
    padding: 0;
    border-bottom: 1px solid rgba(57, 255, 20, 0.3);
  }

  .members-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
  }

  .member-card {
    border: 1px dashed rgba(155, 168, 168, 0.3);
    padding: 1rem;
    font-family: var(--font-mono);
    font-size: 0.9rem;
  }

  .member-card h4 {
    color: rgba(57, 255, 20, 0.8);
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(57, 255, 20, 0.2);
    padding-bottom: 0.5rem;
  }

  .member-card p {
    margin: 0.4rem 0;
    color: #ccc;
  }
  
  .member-card strong {
    color: #888;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }

  .modal-content {
    background: #002729;
    border: 2px solid #ffaa00;
    padding: 2rem;
    width: 90%;
    max-width: 800px;
    border-radius: 5px;
    box-shadow: 0 0 30px rgba(255, 170, 0, 0.1);
  }
`;

export default AdminDashboard;
