import React, { useState } from 'react';
import { generatePassphrase } from './api';

export default function Generator() {
    const [bio, setBio] = useState('');
    const [vowels, setVowels] = useState('ae');
    const [separator, setSeparator] = useState('-');
    const [capitalise, setCapitalise] = useState(false);
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const data = await generatePassphrase({
                user_bio: bio,
                vowels_to_remove: vowels,
                separator: separator,
                capitalize: capitalise 
            });
            
            setResult(data);
            localStorage.setItem('csh_participant_id', data.participant_id);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2>CSH Passphrase Generator</h2>
            
            <div style={{ marginBottom: '15px' }}>
                <label>User Biography (Optional Filter)</label>
                <input 
                    type="text" 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    style={{ width: '100%', padding: '8px' }}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label>Vowels to Remove</label>
                <input 
                    type="text" 
                    value={vowels} 
                    onChange={(e) => setVowels(e.target.value)} 
                    style={{ width: '100%', padding: '8px' }}
                />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label>Separator</label>
                <select 
                    value={separator} 
                    onChange={(e) => setSeparator(e.target.value)}
                    style={{ width: '100%', padding: '8px' }}
                >
                    <option value="-">Hyphen (-)</option>
                    <option value="_">Underscore (_)</option>
                    <option value=".">Full Stop (.)</option>
                    <option value=" ">Space</option>
                </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label>
                    <input 
                        type="checkbox" 
                        checked={capitalise} 
                        onChange={(e) => setCapitalise(e.target.checked)} 
                    />
                    Capitalise Words
                </label>
            </div>

            <button 
                onClick={handleGenerate} 
                disabled={loading}
                style={{ padding: '10px 20px', cursor: 'pointer' }}
            >
                {loading ? 'Generating...' : 'Generate Passphrase'}
            </button>

            {error && <div style={{ color: 'red', marginTop: '15px' }}>{error}</div>}

            {result && (
                <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc' }}>
                    <h3>Results</h3>
                    <p><strong>Raw Phrase:</strong> {result.raw_passphrase}</p>
                    <p><strong>Final Passphrase:</strong> {result.final_passphrase}</p>
                    <hr />
                    <p><strong>Entropy:</strong> {result.entropy} bits</p>
                    <p><strong>Strength Score:</strong> {result.zxcvbn_score} / 4</p>
                    <p><strong>Concreteness:</strong> {result.concreteness_score} / 5.0</p>
                    <p><strong>Crack Time:</strong> {result.crack_time_display}</p>
                    
                    {result.breach_count > 0 && (
                        <p style={{ color: 'red' }}>
                            <strong>Warning:</strong> Found in {result.breach_count} breaches.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}