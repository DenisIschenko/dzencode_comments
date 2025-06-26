import axios from 'axios';

const api = axios.create({
    baseURL: '/',
});

api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('access');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({resolve, reject});
                })
                    .then(token => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return api(originalRequest);
                    })
                    .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refresh');
            if (!refreshToken) {
                isRefreshing = false;
                processQueue(null, null);
                // Optionally: logout user here
                window.location.reload();
                return Promise.reject(error);
            }

            try {
                const res = await axios.post('/api/token/refresh/', {refresh: refreshToken});
                const newAccess = res.data.access;
                localStorage.setItem('access', newAccess);
                api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccess;
                processQueue(null, newAccess);
                originalRequest.headers['Authorization'] = 'Bearer ' + newAccess;
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                // Optionally: logout user here
                localStorage.removeItem('access');
                localStorage.removeItem('refresh');
                window.location.reload();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
