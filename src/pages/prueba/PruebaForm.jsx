import axios from 'axios'
import React, { useState } from 'react'


export default function PruebaForm() {

    
    const [pregunta1, setPregunta1] = useState("")
    const [pregunta2, setPregunta2] = useState("")
    const [pregunta3, setPregunta3] = useState("")
    
    const onOptionChange=(e)=>{
        setPregunta1(e.target.value)
    }
    const onOptionChange2=(e)=>{
        setPregunta2(e.target.value)
    }
    const onOptionChange3=(e)=>{
        setPregunta3(e.target.value)
    }

    const handleSubmit = (event)=> {
        event.preventDefault();
        axios.post('http://localhost:4000/PruebaForm', {pregunta1,pregunta2,pregunta3})
        .then(res => {
            console.log(res);
            alert("datos enviados")

        }).catch(err => console.log(err));
    }


  return (
    <div>
        <h1>Pregunta 1:</h1>

        <input type="radio" name="1" id="1" value='1'  onChange={onOptionChange}/>
        <label for='1'>nada de acuerdo</label>

        <input type="radio" name="1" id="2" value='2' onChange={onOptionChange}/>
        <label for='2'>algo de acuerdo</label>

        <input type="radio" name="1" id="3" value='3' onChange={onOptionChange}/>
        <label for='3'>bastante de acuerdo</label>

        <input type="radio" name="1" id="4" value='4' onChange={onOptionChange}/>
        <label for='4'>muy de acuerdo</label>

        <input type="radio" name="1" id="5" value='5' onChange={onOptionChange}/>
        <label for='5'>totalmente de acuerdo</label>

        <h1>tu valor es:</h1>
        <h1>{pregunta1}</h1>

        <br />
        <br />

        <h1>Pregunta 2</h1>

        <input type="radio" name="2" id="1" value='1'  onChange={onOptionChange2}/>
        <label for='1'>nada de acuerdo</label>

        <input type="radio" name="2" id="2" value='2' onChange={onOptionChange2}/>
        <label for='2'>algo de acuerdo</label>

        <input type="radio" name="2" id="3" value='3' onChange={onOptionChange2}/>
        <label for='3'>bastante de acuerdo</label>

        <input type="radio" name="2" id="4" value='4' onChange={onOptionChange2}/>
        <label for='4'>muy de acuerdo</label>

        <input type="radio" name="2" id="5" value='5' onChange={onOptionChange2}/>
        <label for='5'>totalmente de acuerdo</label>

        <h1>tu valor es:</h1>
        <h1>{pregunta2}</h1>
        <br />
        <br />

        <h1>Pregunta 3:</h1>

        <input type="radio" name="3" id="1" value='1'  onChange={onOptionChange3}/>
        <label for='1'>nada de acuerdo</label>

        <input type="radio" name="3" id="2" value='2' onChange={onOptionChange3}/>
        <label for='2'>algo de acuerdo</label>

        <input type="radio" name="3" id="3" value='3' onChange={onOptionChange3}/>
        <label for='3'>bastante de acuerdo</label>

        <input type="radio" name="3" id="4" value='4' onChange={onOptionChange3}/>
        <label for='4'>muy de acuerdo</label>

        <input type="radio" name="3" id="5" value='5' onChange={onOptionChange3}/>
        <label for='5'>totalmente de acuerdo</label>
        <h1>tu valor es:</h1>
        <h1>{pregunta3}</h1>

        <button onClick={handleSubmit}>Enviar</button>

    </div>
  )
}
