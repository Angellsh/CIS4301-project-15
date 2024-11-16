import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../axios'
import 'bootstrap/dist/css/bootstrap-grid.min.css'
import {Form, Button, Container, Alert} from 'react-bootstrap'


const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setErrorMessage]  = useState('');
    const [success, setSucessMessage]  = useState('');

    const navigate = useNavigate(); // Initialize useNavigate for navigation
    const handleSubmit = async (e : React.FormEvent) =>{
        e.preventDefault()
        setErrorMessage('');
        setSucessMessage('');

        try{
            const response = await api.post('/login', {email, password})
            if(response.status!==200){
               // const errorData = await response.data;
               setErrorMessage('Login failed');
               setSucessMessage('')
                return;
            }
            const {accessToken, userName} = response.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('userName', userName);
            setSucessMessage("Successfully logged in.")
            setErrorMessage('')
            setTimeout(()=>{
                navigate('/dashboard')
            }, 2000)
       
        }  catch(error ){
            if (error.response && error.response.status === 401) {
              setErrorMessage("Unauthorized: Please check your credentials or register."); // Optional: redirect to login if not already there
              setSucessMessage('')
          } else {
              setErrorMessage('Login failed.');
              setSucessMessage('')
              console.error('Error:', error);
          }
          }
    }
  
    return (

        <Container className ="d-flex justify-content-center align-items-center" style = {{maxWidth: '500px', marginTop: '50px'}}>
        <div  style={{ maxWidth: '400px'}}>
        <h2 className="text-center mb-4" style={{ marginBottom: '20px', textAlign: 'center' }}>Login</h2>
        {error && <Alert variant = "danger" style={{ marginBottom: '15px' }}>{error}</Alert>}
        {success && <Alert variant ="success" style={{ marginBottom: '15px' }}>{success}</Alert>}
   
        <Form onSubmit = {handleSubmit}>

        <Form.Group className ="mb-3" controlId="email">
        
        <Form.Control 
            type="email"
            name="email"
            value={email}
            onChange = {(e) => setEmail(e.target.value)}
            placeholder ="Enter your email"
            required
            />
        </Form.Group>
       
        <Form.Group className="mb-3" controlId = "formPassword">
        <Form.Control   
            type="password"
            name="password"
            value={password}
            placeholder ="Enter your password"

            onChange = {(e)=> setPassword(e.target.value)}
            />
        </Form.Group>
    
        <Button variant="primary" type="submit" className="mb-3 w-100">Login</Button>
        <Button variant="secondary" 
            type="button" className="w-100" 
            onClick={()=>navigate('/reset-password')}>
                Reset password
        </Button>
        </Form>
        </div>
        </Container>
    );
}
export default Login