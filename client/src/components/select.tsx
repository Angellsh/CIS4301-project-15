import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../axios'
import {Form, Button, Container, Alert} from 'react-bootstrap'



const select: React.FC =()=>{
    const [selectedTimeRange, setSelectedTimeRange] = useState('1m');
    const handleTimeRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedTimeRange(e.target.value);
      };
    return(
<select value={selectedTimeRange} onChange={handleTimeRangeChange}>
            <option value="1d">1 Day</option>
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
            <option value="1y">1 Year</option>
          </select>)
}
export default select;