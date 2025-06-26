import React, {useState} from 'react';
import Modal from 'react-modal';

const LoginModal = ({isOpen, onRequestClose, onLoginSuccess}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('/api/token/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, password}),
            });
            if (!res.ok) throw new Error('Invalid credentials');
            const data = await res.json();
            localStorage.setItem('access', data.access);
            localStorage.setItem('refresh', data.refresh);
            onLoginSuccess();
            onRequestClose();
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Login"
            className="lightbox-modal"
            overlayClassName="lightbox-overlay"
        >
            <button className="lightbox-close-btn" onClick={onRequestClose} aria-label="Close">&times;</button>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                /><br/>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                /><br/>
                <button type="submit">Login</button>
            </form>
            {error && <div style={{color: 'red'}}>{error}</div>}
        </Modal>
    );
};

export default LoginModal;
