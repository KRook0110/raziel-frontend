// const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = 'https://universe-unawake-strategic.ngrok-free.dev';

export const generatePassphrase = async (requestData) => {
    const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    });

    if (!response.ok) {
        throw new Error('Failed to generate passphrase');
    }

    return response.json();
};

export const verifyRecall = async (participantId, attemptedPassphrase) => {
    const response = await fetch(`${API_BASE_URL}/verify-recall`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            participant_id: participantId,
            attempted_passphrase: attemptedPassphrase
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to verify recall');
    }

    return response.json();
};

export const confirmPassphrase = async (participantId, finalPassphrase) => {
    const response = await fetch(`${API_BASE_URL}/confirm`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            participant_id: participantId,
            confirmed_passphrase: finalPassphrase
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to confirm passphrase');
    }

    return response.json();
};
