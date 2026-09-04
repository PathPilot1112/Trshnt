import React, { useState, useEffect } from 'react';

const generateTeamNumber = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TH-${randomNum}`;
};

const RegistrationPage = ({ API_BASE, onRegisterSuccess, onCancel }) => {
  const [step, setStep] = useState(1);
  const [numPlayers, setNumPlayers] = useState(3);
  const [teamName, setTeamName] = useState('');
  const [teamNumber, setTeamNumber] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTeamNumber(generateTeamNumber());
  }, []);

  // Update members array when numPlayers changes
  useEffect(() => {
    const newMembers = [...members];
    while (newMembers.length < numPlayers) {
      newMembers.push({
        registerNumber: '',
        name: '',
        yearOfGraduation: '',
        course: '',
        specialization: '',
        contactNumber: '',
        email: ''
      });
    }
    // Trim if numPlayers decreased
    if (newMembers.length > numPlayers) {
      newMembers.length = numPlayers;
    }
    setMembers(newMembers);
  }, [numPlayers]);

  const handleMemberChange = (index, field, value) => {
    const updatedMembers = [...members];
    updatedMembers[index][field] = value;
    setMembers(updatedMembers);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone) => {
    return /^\+?[\d\s-]{10,15}$/.test(phone);
  };

  const nextStep = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      if (step === 1) {
        if (!teamName.trim()) {
          setError('Research Unit Identifier is required');
          setIsSubmitting(false);
          return;
        }
        
        // Validate team name with backend
        const res = await fetch(`${API_BASE}/teams/validate-team`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamName })
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.msg || 'Team validation failed');
          setIsSubmitting(false);
          return;
        }
      } else if (step > 1 && step <= numPlayers + 1) {
        const memberIndex = step - 2;
        const member = members[memberIndex];
        
        if (!member.registerNumber || !member.name || !member.email || !member.contactNumber || !member.yearOfGraduation || !member.course || !member.specialization) {
          setError('All fields in this section are mandatory.');
          setIsSubmitting(false);
          return;
        }

        if (!validateEmail(member.email)) {
          setError('Invalid email format detected.');
          setIsSubmitting(false);
          return;
        }

        if (!validatePhone(member.contactNumber)) {
          setError('Invalid contact number format. Must be 10-15 digits.');
          setIsSubmitting(false);
          return;
        }

        // Validate duplicates within the form
        for (let i = 0; i < memberIndex; i++) {
          if (members[i].registerNumber.toLowerCase() === member.registerNumber.toLowerCase()) {
            setError(`Subject ID already assigned to Bio-Asset 0${i + 1}`);
            setIsSubmitting(false);
            return;
          }
          if (members[i].email.toLowerCase() === member.email.toLowerCase()) {
            setError(`Email already assigned to Bio-Asset 0${i + 1}`);
            setIsSubmitting(false);
            return;
          }
          if (members[i].contactNumber === member.contactNumber) {
            setError(`Contact number already assigned to Bio-Asset 0${i + 1}`);
            setIsSubmitting(false);
            return;
          }
        }

        // Validate member details with backend
        const res = await fetch(`${API_BASE}/teams/validate-member`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(member)
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.msg || 'Member validation failed');
          setIsSubmitting(false);
          return;
        }
      }
      
      setStep(step + 1);
    } catch (err) {
      console.error(err);
      setError('Communication error with secure server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/teams/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamName,
          teamNumber,
          members
        })
      });

      const data = await response.json();

      if (response.ok) {
        onRegisterSuccess(data.token, data.user, data.team);
      } else {
        setError(data.msg || data.message || 'Clearance denial.');
      }
    } catch (err) {
      console.error(err);
      setError('Network failure. Document not saved.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMemberForm = (index) => {
    const member = members[index];
    if (!member) return null;

    return (
      <div className="form-section fade-in">
        <h3 className="section-title">
          SECTION {index + 2}: BIO-ASSET 0{index + 1} IDENTIFICATION
        </h3>
        
        <div className="input-row">
          <label>SUBJECT ID (REG NUMBER):</label>
          <input 
            type="text" 
            required
            value={member.registerNumber}
            onChange={(e) => handleMemberChange(index, 'registerNumber', e.target.value)}
            placeholder="e.g. RA2000000000000"
          />
        </div>

        <div className="input-row">
          <label>FULL DESIGNATION (NAME):</label>
          <input 
            type="text" 
            required
            value={member.name}
            onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
          />
        </div>

        <div className="input-row">
          <label>YEAR OF DEPLOYMENT (GRADUATION):</label>
          <select 
            required
            value={member.yearOfGraduation}
            onChange={(e) => handleMemberChange(index, 'yearOfGraduation', e.target.value)}
            className="doc-select-underline"
          >
            <option value="" disabled>Select Year</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
            <option value="2028">2028</option>
            <option value="2029">2029</option>
            <option value="2030">2030</option>
          </select>
        </div>

        <div className="input-row">
          <label>TRAINING COURSE:</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', fontFamily: 'Courier New, monospace', fontSize: '1.2rem', minHeight: '36px' }}>
            {!member.course ? (
              <>
                <span style={{ cursor: 'pointer', color: '#666', borderBottom: '1px dashed #666', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#000'} onMouseLeave={(e) => e.target.style.color = '#666'} onClick={() => handleMemberChange(index, 'course', 'B.Tech')}>B.Tech</span>
                <span style={{ color: '#666' }}>/</span>
                <span style={{ cursor: 'pointer', color: '#666', borderBottom: '1px dashed #666', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#000'} onMouseLeave={(e) => e.target.style.color = '#666'} onClick={() => handleMemberChange(index, 'course', 'M.Tech')}>M.Tech</span>
              </>
            ) : (
              <span 
                style={{ cursor: 'pointer', color: '#cc0000', fontWeight: 'bold', borderBottom: '2px solid #cc0000' }} 
                onClick={() => handleMemberChange(index, 'course', '')}
                title="Click to change selection"
              >
                {member.course}
              </span>
            )}
          </div>
        </div>

        <div className="input-row">
          <label>SPECIALTY EXPERTISE:</label>
          <input 
            type="text" 
            required
            value={member.specialization}
            onChange={(e) => handleMemberChange(index, 'specialization', e.target.value)}
            placeholder="e.g. Bio-engineering"
          />
        </div>

        <div className="input-row">
          <label>EMERGENCY FREQUENCY (PHONE):</label>
          <input 
            type="tel" 
            required
            value={member.contactNumber}
            onChange={(e) => handleMemberChange(index, 'contactNumber', e.target.value)}
          />
        </div>

        <div className="input-row">
          <label>COMMUNICATION LINK (EMAIL):</label>
          <input 
            type="email" 
            required
            value={member.email}
            onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
          />
        </div>
      </div>
    );
  };

  const totalSteps = numPlayers + 1;

  return (
    <div className="registration-wrapper">
      
      {/* Back to Welcome button */}
      <button onClick={onCancel} className="back-btn-doc">
        &lt; ABORT AND RETURN TO BASE
      </button>

      <div className="document-container">
        {/* Hazard Header */}
        <div className="hazard-bar"></div>
        
        {/* Document Header */}
        <div className="doc-header">
          <div className="doc-meta">FORM-4B // DEPT OF BIO-RESEARCH // CLEARANCE LEVEL: OMEGA</div>
          <h2 className="doc-title">CONFIDENTIAL PROJECT CLEARANCE</h2>
          <div className="red-stamp">TOP SECRET</div>
        </div>
        
        {/* Progress Bar */}
        <div className="doc-progress-container">
           <div style={{fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'Courier New, monospace', marginBottom: '0.5rem'}}>
             DOCUMENT PROGRESS: PAGE {step} OF {totalSteps}
           </div>
           <div className="doc-progress-bg">
             <div className="doc-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
           </div>
        </div>

        {error && (
          <div className="doc-error fade-in">
            [DENIED]: {error}
          </div>
        )}

        <form onSubmit={step === totalSteps ? handleSubmit : nextStep} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {step === 1 && (
            <div className="form-section fade-in">
              <h3 className="section-title">SECTION I: UNIT DESIGNATION</h3>
              
              <div className="input-row">
                <label>RESEARCH UNIT IDENTIFIER (TEAM NAME):</label>
                <input 
                  type="text" 
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="input-row">
                <label>ASSIGNED CLEARANCE ID (TEAM NUMBER):</label>
                <input 
                  type="text" 
                  value={teamNumber}
                  readOnly
                  className="readonly-input"
                />
              </div>

              <div className="input-row">
                <label>QUANTITY OF BIO-ASSETS (MEMBERS):</label>
                <select 
                  value={numPlayers} 
                  onChange={(e) => setNumPlayers(parseInt(e.target.value))}
                  className="doc-select"
                >
                  <option value={3}>3 BIO-ASSETS</option>
                  <option value={4}>4 BIO-ASSETS</option>
                  <option value={5}>5 BIO-ASSETS</option>
                </select>
              </div>
            </div>
          )}

          {step > 1 && step <= totalSteps && renderMemberForm(step - 2)}

          {step === totalSteps && (
            <div className="signature-section fade-in">
              <p style={{fontFamily: 'Courier New, monospace', fontSize: '0.9rem', lineHeight: '1.5', marginTop: '1rem'}}>
                By sealing this document, the Research Unit accepts all terms of the 
                Chernobyl Exclusion Zone protocol. Bio-assets proceed at their own risk. 
                Any exposure to ionizing radiation or anomalous phenomena is the sole 
                responsibility of the Unit.
              </p>
              <div style={{marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
                <div style={{ width: '250px', fontFamily: 'Courier New, monospace'}}>
                  <div style={{ paddingBottom: '0.2rem', borderBottom: '2px solid #000', fontSize: '1.5rem', fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive', color: '#000066', minHeight: '2.5rem', display: 'flex', alignItems: 'flex-end' }}>
                    {members[0]?.name || ''}
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 'bold' }}>Signature (Lead Asset)</div>
                </div>
                <div style={{ width: '150px', fontFamily: 'Courier New, monospace'}}>
                  <div style={{ paddingBottom: '0.2rem', borderBottom: '2px solid #000', fontSize: '1.1rem', color: '#000066', minHeight: '2.5rem', display: 'flex', alignItems: 'flex-end' }}>
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.3rem', fontWeight: 'bold' }}>Date</div>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            {step > 1 ? (
              <button type="button" onClick={prevStep} className="btn-doc-secondary" disabled={isSubmitting}>
                [ REVERT PAGE ]
              </button>
            ) : <div></div>}

            <button type="submit" className="btn-doc-primary" disabled={isSubmitting}>
              {isSubmitting ? 'PROCESSING...' : (step === totalSteps ? 'AUTHORIZE & SEAL DOCUMENT' : 'AUTHORIZE NEXT PAGE')}
            </button>
          </div>
        </form>

        <div className="hazard-bar" style={{ marginTop: '3rem' }}></div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-in {
          animation: fadeIn 0.5s ease forwards;
        }

        .registration-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 2rem 1rem;
          position: relative;
          z-index: 100;
          overflow-y: auto;
          width: 100%;
          box-sizing: border-box;
        }

        .back-btn-doc {
          margin-bottom: 1.5rem;
          background: transparent;
          border: 1px solid var(--color-accent);
          color: var(--color-text);
          font-family: var(--font-mono);
          font-size: 0.9rem;
          font-weight: bold;
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.3s ease;
          padding: 0.6rem 1.2rem;
        }

        .back-btn-doc:hover {
          background: rgba(255, 51, 51, 0.2);
          border-color: #ff3333;
          color: #ff3333;
        }

        .document-container {
          width: 100%;
          max-width: 800px;
          background-color: #fdfbf7;
          background-image: radial-gradient(#e0dcd3 1px, transparent 1px);
          background-size: 20px 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
          position: relative;
          color: #1a1a1a;
          overflow: hidden;
          padding-bottom: 2rem;
          border: 1px solid #1a1a1a;
        }

        .hazard-bar {
          width: 100%;
          height: 15px;
          background: repeating-linear-gradient(
            45deg,
            #ffcc00,
            #ffcc00 15px,
            #000000 15px,
            #000000 30px
          );
        }

        .doc-header {
          padding: 2rem 3rem 1rem 3rem;
          position: relative;
          border-bottom: 3px double #1a1a1a;
          margin-bottom: 1.5rem;
        }

        .doc-meta {
          font-family: 'Courier New', Courier, monospace;
          font-weight: bold;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          color: #444;
        }

        .doc-title {
          font-family: 'Times New Roman', Times, serif;
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: 1px;
          margin: 0;
          text-transform: uppercase;
        }

        .red-stamp {
          position: absolute;
          top: 1.5rem;
          right: 2rem;
          color: #cc0000;
          font-family: 'Courier New', Courier, monospace;
          font-size: 1.2rem;
          font-weight: 900;
          border: 3px solid #cc0000;
          padding: 0.1rem 0.4rem;
          transform: rotate(-12deg);
          opacity: 0.85;
          border-radius: 4px;
        }

        .doc-progress-container {
          padding: 0 3rem;
          margin-bottom: 1.5rem;
        }

        .doc-progress-bg {
          width: 100%;
          height: 6px;
          background: #ccc;
          border: 1px solid #1a1a1a;
        }

        .doc-progress-bar {
          height: 100%;
          background: #1a1a1a;
          transition: width 0.3s ease;
        }

        .doc-error {
          margin: 0 3rem 1rem 3rem;
          padding: 0.8rem;
          background: #ffe6e6;
          border-left: 5px solid #cc0000;
          color: #cc0000;
          font-family: 'Courier New', Courier, monospace;
          font-weight: bold;
        }

        form {
          padding: 0 3rem;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .section-title {
          font-family: 'Times New Roman', Times, serif;
          font-size: 1.3rem;
          border-bottom: 2px solid #1a1a1a;
          padding-bottom: 0.4rem;
          margin-bottom: 0.8rem;
          font-weight: bold;
        }

        .input-row {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .input-row label {
          font-family: 'Courier New', Courier, monospace;
          font-weight: bold;
          font-size: 0.85rem;
          color: #333;
        }

        .input-row input {
          background: transparent;
          border: none;
          border-bottom: 1px solid #1a1a1a;
          padding: 0.4rem 0;
          font-family: 'Courier New', Courier, monospace;
          font-size: 1.1rem;
          color: #000;
          outline: none;
          transition: border-bottom 0.2s ease;
        }

        .input-row input:focus {
          border-bottom: 2.5px solid #1a1a1a;
        }

        .readonly-input {
          color: #666 !important;
          border-bottom: 1px dashed #666 !important;
          background: rgba(0,0,0,0.03) !important;
        }

        .doc-select {
          background: transparent;
          border: 1px solid #1a1a1a;
          padding: 0.4rem;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.9rem;
          font-weight: bold;
          color: #000;
          outline: none;
          cursor: pointer;
        }

        .doc-select-underline {
          background: transparent;
          border: none;
          border-bottom: 1px solid #1a1a1a;
          padding: 0.4rem 0;
          font-family: 'Courier New', Courier, monospace;
          font-size: 1.1rem;
          color: #000;
          outline: none;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          border-radius: 0;
        }

        .doc-select option, .doc-select-underline option {
          background: #fdfbf7;
        }

        .form-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 2px dashed #1a1a1a;
        }

        .btn-doc-primary {
          background: #cc0000;
          color: #fff;
          border: 2px solid #990000;
          padding: 0.7rem 1.3rem;
          font-family: 'Courier New', Courier, monospace;
          font-weight: bold;
          font-size: 0.9rem;
          cursor: pointer;
          box-shadow: 2px 2px 0px #990000;
          transition: all 0.1s ease;
        }

        .btn-doc-primary:hover:not(:disabled) {
          transform: translate(2px, 2px);
          box-shadow: 0px 0px 0px #990000;
        }

        .btn-doc-secondary {
          background: transparent;
          color: #1a1a1a;
          border: 2px solid #1a1a1a;
          padding: 0.7rem 1.3rem;
          font-family: 'Courier New', Courier, monospace;
          font-weight: bold;
          font-size: 0.9rem;
          cursor: pointer;
          box-shadow: 2px 2px 0px #1a1a1a;
          transition: all 0.1s ease;
        }

        .btn-doc-secondary:hover:not(:disabled) {
          background: #e0dcd3;
          transform: translate(2px, 2px);
          box-shadow: 0px 0px 0px #1a1a1a;
        }

        .btn-doc-primary:disabled, .btn-doc-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .registration-wrapper { padding: 1rem; }
          .back-btn-doc { 
            width: 100%;
            margin-bottom: 1rem; 
            font-size: 0.8rem;
          }
          .doc-header { padding: 1.5rem 1rem 1rem 1rem; }
          .doc-title { font-size: 1.3rem; }
          .doc-meta { font-size: 0.7rem; }
          .red-stamp { 
            top: 0.5rem; 
            right: 0.5rem; 
            font-size: 1rem; 
            border-width: 2px; 
            padding: 0.1rem 0.3rem;
          }
          .doc-progress-container, form { padding: 0 1rem; }
          .doc-error { margin: 0 1rem 1rem 1rem; font-size: 0.85rem; }
          
          .signature-section > div:last-child {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 1rem;
          }
          .signature-section > div:last-child > div {
            width: 100% !important;
          }
          
          .form-actions {
            flex-direction: column;
            gap: 0.8rem;
          }
          .btn-doc-primary, .btn-doc-secondary {
            width: 100%;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default RegistrationPage;
