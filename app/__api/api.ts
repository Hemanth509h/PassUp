const API_URL = process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? 'https://passup-jsx9.onrender.com'
        : 'http://localhost:5000');

const Api = {
    health: async () => {
        try {
            const res = await fetch(`${API_URL}/api-status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                return data;
            } else {
                const text = await res.text();
                return {
                    status: 'error',
                    message: `Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}`
                };
            }
        } catch (error) {
            console.error("API health call error:", error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : String(error)
            };
        }
    },

    login: async (email: string, password: string) => {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                return data;
            } else {
                const text = await res.text();
                return {
                    status: 'error',
                    message: `Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}`
                };
            }
        } catch (error) {
            console.error("API login call error:", error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : String(error)
            };
        }
    },
    register: async (name: string, email: string, password: string) => {
        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, email, password }),
            });
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                return data;
            } else {
                const text = await res.text();
                return {
                    status: 'error',
                    message: `Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}`
                };
            }
        } catch (error) {
            console.error("API register call error:", error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : String(error)
            };
        }
    },
    getEntries: async (masterKey?: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            if (masterKey) {
                headers['X-Master-Key'] = masterKey;
            }
            const res = await fetch(`${API_URL}/entries`, {
                method: 'GET',
                headers,
            });
            return await res.json();
        } catch (error) {
            console.error("API getEntries call error:", error);
            return { status: 'error', message: error instanceof Error ? error.message : String(error) };
        }
    },
    addEntry: async (entryData: any, masterKey?: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            if (masterKey) {
                headers['X-Master-Key'] = masterKey;
            }
            const res = await fetch(`${API_URL}/entries`, {
                method: 'POST',
                headers,
                body: JSON.stringify(entryData)
            });
            return await res.json();
        } catch (error) {
            console.error("API addEntry call error:", error);
            return { status: 'error', message: error instanceof Error ? error.message : String(error) };
        }
    },
    deleteEntry: async (id: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const res = await fetch(`${API_URL}/entries/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            return await res.json();
        } catch (error) {
            console.error("API deleteEntry call error:", error);
            return { status: 'error', message: error instanceof Error ? error.message : String(error) };
        }
    },
    updateEntry: async (id: string, entryData: any, masterKey?: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            if (masterKey) {
                headers['X-Master-Key'] = masterKey;
            }
            const res = await fetch(`${API_URL}/entries/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(entryData)
            });
            return await res.json();
        } catch (error) {
            console.error("API updateEntry call error:", error);
            return { status: 'error', message: error instanceof Error ? error.message : String(error) };
        }
    },
    getpassword: async (id: string, masterKey?: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            if (masterKey) {
                headers['X-Master-Key'] = masterKey;
            }
            const res = await fetch(`${API_URL}/password/${id}`, {
                method: 'GET',
                headers,
            });
            return await res.json();
        } catch (error) {
            console.error("API getEntries call error:", error);
            return { status: 'error', message: error instanceof Error ? error.message : String(error) };
        }
    },
    masterkey: async (masterKey: string, userid?: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const res = await fetch(`${API_URL}/check-master-key`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Master-Key': masterKey,
                    'userid': userid || token || ''
                },
            });
            return await res.json();
        } catch (error) {
            console.error("API checkMasterKey call error:", error);
            return { status: 'error', message: error instanceof Error ? error.message : String(error) };
        }
    },
    updateMasterKey: async (oldMasterKey: string, newMasterKey: string) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const res = await fetch(`${API_URL}/update-master-key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldMasterKey, newMasterKey })
            });
            return await res.json();
        } catch (error) {
            console.error("API updateMasterKey call error:", error);
            return { status: 'error', message: error instanceof Error ? error.message : String(error) };
        }
    }
};

export default Api;