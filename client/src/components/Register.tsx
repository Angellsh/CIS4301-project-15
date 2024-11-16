import React, {useState} from 'react'
import {Form, Button, Container, Alert} from 'react-bootstrap'
import api from '../../axios'
import { useNavigate } from 'react-router-dom';
type RegisterFormData={
    firstname: string, 
    lastname: string,
    email: string, 
    password: string, 
    confirmPassword: string;
};
const Register: React.FC = () =>{
    const navigate = useNavigate()

    const [formData, setFormData] = useState<RegisterFormData>(
        {
        firstname: '',
        lastname: '',
        email: '',
        password: '', 
        confirmPassword:''
                                                                
    })
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>)=>{
        const{ name, value} = e.target;
        setFormData({...formData, [name]: value})
    };
    const handleSubmit = async (e: React.FormEvent) =>{
        e.preventDefault();
        if(formData.password!==formData.confirmPassword){
            setError("Passwords do not match.")
            setSuccess(null);
            return;
        }
        try{
            const response = await api.post('/register', {
                firstName: formData.firstname,
                lastName: formData.firstname,
                email: formData.email,
                password: formData.password
              }
            );
            if(response.status ===200){
                setError('User registered successfully.')
                setFormData({
                    firstname: '',
                    lastname: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                  });
                const {accessToken} = response.data;
                localStorage.setItem('accessToken', accessToken);
                setTimeout(()=>{ navigate('/login')}, 3000)
            }else{
                setError("Registration failed");
                return;
            }
            setError(null);
            setSuccess("Registration successfull!")
        }catch(err){
            console.log(err)
            setError('Failed to register')
        }
    }
    return (
        <Container className="d-flex justify-content-center align-items-center" style = {{maxWidth: '500px', marginTop: '50px'}}>
       <div> <h2 className="text-center mb-4"  style ={{marginBottom: '20px'}}  >Register</h2>
        {error && <Alert variant = "danger">{error}</Alert>}
        {success && <Alert variant ="success">{success}</Alert>}
        <Form onSubmit = {handleSubmit}>

        <Form.Group className ="mb-3" controlId="firstName">
        
        <Form.Control 
            type="name"
            name="firstname"
            value={formData.firstname}
            onChange = {handleChange}
            placeholder ="Enter first name"
            required
            />
        </Form.Group>
        <Form.Group className ="mb-3" controlId="lastName">
        <Form.Control 
            type="name"
            name="lastname"
            value={formData.lastname}
            onChange = {handleChange}
            placeholder ="Enter last name"
            required
            />
        </Form.Group>



        <Form.Group className ="mb-3" controlId="formEmail">
        <Form.Control 
            type="email"
            name="email"
            value={formData.email}
            onChange = {handleChange}
            placeholder ="Enter email"
            required
            />
        </Form.Group>
        <Form.Group className ="mb-3" controlId="formPassword">
        <Form.Control 
            type="password"
            name="password"
            value={formData.password}
            onChange = {handleChange}
            placeholder ="Enter password"
            required
            />
        </Form.Group>
        
        <Form.Group className ="mb-3" controlId="formConfirmPassword">
        <Form.Control 
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange = {handleChange}
            placeholder ="Confirm password"
            required
            />
        </Form.Group>
        <Button variant="primary" type="submit">Register</Button>
        </Form></div>
        </Container>
    );
    

};
export default Register;