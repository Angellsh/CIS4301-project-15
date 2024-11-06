import React, {useState} from 'react'
import {Form, Button, Container, Alert} from 'react-bootstrap'


type RegisterFormData={
    firstname: string, 
    lastname: string,
    email: string, 
    password: string, 
    confirmPassword: string;
};
const Register: React.FC = () =>{
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
            const response = await fetch('http://localhost:3000/register', {
                method: 'POST', 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify({email: formData.email, password: formData.password,
                                    lastname: formData.lastname, firstname: formData.firstname
                })
            });
            if( !response.ok){
                throw new Error('Registration failed')
            }
            setError(null);
            setSuccess("Registration successfull!")
        }catch(err){
            console.log(err)
            setError('Failed to register')
        }
    }
    return (
        <Container style = {{maxWidth: '500px', marginTop: '50px'}}>
        <h2>Register</h2>
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
        </Form>
        </Container>
    );
    

};
export default Register;