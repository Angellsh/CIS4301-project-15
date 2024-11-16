import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:3000', 
    withCredentials:true, 
    timeout:5000, 
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use(
    config =>{
        const token = localStorage.getItem('accessToken');
        if(token){
            config.headers.Authorization = `Bearer ${token}`
        }
        return config;
    }, 
    error=>{
        console.log(error)
        return Promise.reject(error)
    }

)
api.interceptors.response.use(
    response=>{ return response},
    async error => {
        const originalRequest  = error.config;
        if(error.response.status ===403 && ! originalRequest._retry){
            originalRequest._retry = true;
            try{
                const response = await api.post('/refresh-token', {
                    withCredentials: true
                });
                axios.defaults.headers.common['Authorization'] = response.data.token
                localStorage.removeItem('accessToken')
                localStorage.setItem('accessToken', response.data.token)
                return api(originalRequest)
            }
            catch(err){
                window.location.href = "http://localhost:3000/login"
                return Promise.reject(err)
            }
        }
    }

)
export default api