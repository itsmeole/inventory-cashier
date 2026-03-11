export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    let headers = new Headers(options.headers || {});
    
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.store_id) {
                    headers.set('x-store-id', user.store_id.toString());
                }
            } catch (e) {}
        }
    }
    
    return fetch(url, {
        ...options,
        headers
    });
}
