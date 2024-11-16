import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../axios'
import {Form, Button, Container, Alert} from 'react-bootstrap'



const ResetPassword: React.FC =()=>{
        const navigate = useNavigate();
        const [email, setEmail] = useState('');
        const [code, setCode] = useState('');
        const [showPasswordField, setShowPasswordField] = useState(false);
        const [success, setSuccess] = useState('');
        const [error, setError] = useState('');
        const [newPassword, setNewPassword] = useState('')
       const [showSendCodeButton, setShowSendCodeButton] = useState(true);
       const [showResetPassword, setShowResetPassword] = useState(false);
       const [redirectToLogin, setRedirectToLogin] = useState(false);

   
       const validatePassword = (password : string)=>{
       

        if(password.length<8 || !/\d/.test(password) || ! /[A-Z]/.test(password) ||  ! /[a-z]/.test(password) ){
            return 'Password must contain at least one number.'
        }
        return '';
       }

       const handleSubmit = async(e: React.FormEvent) =>{
        e.preventDefault();
        setError('');
        setSuccess('');
        if(!email){
            setError("Please enter an email address.")
            return}
        setShowSendCodeButton(true);
        
        try{
            const reponse = await api.post('/reset-password', {email}, {
                headers: {
                  'Content-Type': 'application/json',
                }});
            if(reponse.status ===200){
                console.log("response is 200")
                setSuccess("Please check your email. ")
                setShowResetPassword(true)
                setShowSendCodeButton(false);
    
            }
    
        }
        catch(err){
    
        }
    
    }
        const handleCodeSubmit = async(e: React.FormEvent)=>{
            e.preventDefault();
            setError('');
            setSuccess('');
            if(!code){
                setError("Please enter your code.")
                return;
            }
            try{
                const response = await api.post('/verify-code', {email, code});
                if(response.status===200){
                    setSuccess('Successfully verified. You can now set your new password.')
                  //  setShowSendCodeButton(false);
                    setShowPasswordField(true);
                    setShowResetPassword(false)
                }
            }catch(error){
                if(error.response){
                    console.log('Response error:', error.response);
                    setError("An error has occured")
                }
                else{
                    setError("An error has occured")
                    
                }
    
            }
        }
        const handleResendCode =async (e :React.FormEvent)=>{
            e.preventDefault()
            setError('');
            setSuccess('');
            if(!email){
                setError("Please enter your email address first.");
                return;
            }
            try{
                const reponse = await api.post('/reset-password', {email}, {
                    headers: {
                      'Content-Type': 'application/json',
                    }});
                if(reponse.status ===200){
                    setSuccess("Verification code has been resent. Please check your email. ")
                }
        
            }
            catch(err){
                setError('An error has occured.')
            }
    
        }
    
        const resetPassword = async (e:  React.FormEvent)=>{
            e.preventDefault()
            setError('');
            setSuccess('');
            
            console.log("resetting password")
            if(!newPassword){ //add validation rules
                setError("Please enter a new password.")
                console.log("empty body")
                return;
            }
            const  passwordErr = validatePassword(newPassword);
            if(passwordErr){
                setError(`Password must be at least 8 characters, 1 number, 1 special character, 1 uppercase.`);
                return;
            }
          try{
                const response = await api.post('/new-password', {password: newPassword, email})
                if(response.status===201){
                    console.log("status 200")
                    setSuccess("Password has been succesfully reset. Redirecting to login page.");
                    const timer = setTimeout(() => {
                        navigate('/login');
                      }, 3000);
                  
                      return () => clearTimeout(timer);
                
                
            }
        }catch(err){
                setError("An error has occured. Please try again")
                console.log(err);
            }
        }
        let handleSubmitFunction;

       if (showSendCodeButton) {
           handleSubmitFunction = handleSubmit;
       }else if(showResetPassword){
           handleSubmitFunction = handleCodeSubmit;
       }else if(showPasswordField){
            handleSubmitFunction=resetPassword
       }
    return(
        <Container className="d-flex justify-content-center align-items-center">
            <div>
                <h2 className="text-center mb-4"  style ={{marginBottom: '20px'}}>Reset password</h2>
                {error && <Alert variant ="danger">{error}</Alert> }
                {success && <Alert variant = "success">{success}</Alert>}
                <Form onSubmit={handleSubmitFunction }>
                    <Form.Group className="mb-3" controlId="email">
                        <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        onChange={e =>{ setEmail(e.target.value)}}
                        required
                        />

                    </Form.Group>
                    {showSendCodeButton && <Button variant = 'primary' type="submit">Send code</Button>}
                    {showResetPassword && <div><Form.Group className="mb-3">
                        <Form.Control type ="string" 
                        name="code"
                        placeholder="Enter code"
                        onChange = {e=>{setCode(e.target.value)}}>
                        </Form.Control></Form.Group>
                            <Button variant = 'primary' className="mb-3 w-100" type="submit">Reset password</Button>
                            <Button variant ='secondary' className="mb-3 w-100" onClick={handleResendCode}>Resend code</Button>
                        </div>}
                    {showPasswordField && <div><Form.Group>
                         <Form.Control
                                type="password"
                                name="password"
                                placeholder="Enter your password"
                                onChange={(e)=>{setNewPassword(e.target.value)}}>
                                </Form.Control>
                                <Button variant ='primary' className="mb-3 w-100" type="submit">Reset password</Button>
                            </Form.Group></div>  }
                </Form>
            </div>
        </Container>
    )
}
export default ResetPassword
