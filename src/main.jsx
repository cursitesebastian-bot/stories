import { createRoot } from "react-dom/client";
import { useState } from "react";

function MyForm() {
  const [mytxt, setMytxt] = useState("");

  function handleChange(e) {
    setMytxt(e.target.value);
  }

  return (
    <form form style={{
    textAlign: 'center',
    backgroundColor: '#f0f0f5',
    padding: '24px',
    width: '320px',        // fixed width
    maxWidth: '90%',       // won't overflow on small screens
    margin: '0 auto',      // centers the box horizontally on the page
    borderRadius: '12px',  // rounded corners for the whole form box
    }}>
      <label>
        :
        <textarea value={mytxt} onChange={handleChange} style={{ borderRadius: '20px', padding: '6px 10px', border: '1px solid #ccc' }} />
      </label>
      <p>Current value: {mytxt}</p>
    </form>
  );
}

createRoot(document.getElementById("root")).render(<MyForm />);

function App() {
  const [input, setinput] = useState({});

  const handlechange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setinput((prev) => ({ ...prev, [name]: value }));
  };
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <form style={{
        textAlign: 'center',
        backgroundColor: '#000003',
        color: 'white',
        padding: '24px',
        width: '320px',
        borderRadius: '12px',
        alignitem: 'center',
        boxShadow: '0 4px 15px rgba(63, 8, 115, 0.79)'
      }}>
        <label style={{ alignitem:'center', display: 'block', marginBottom: '10px' }}>
          First name:
          <input
            type="text"
            name="firstname"
            value={input.firstname || ''}
            onChange={handlechange}
            style={{ borderRadius: '30px', padding: '6px 10px', border: '1px solid #ccc' }}
          />
        </label>
        <br/>
        <label> las t name:
          <input 
            type="text"
            name="lastname"
            value={input.lastname || ''}
            onChange={handlechange}
            style={{borderRadius: ' 30px', padding: '6px 10px', border: '1px solid #e9d8d8'}}
            />
        </label>
        <p>Current value: {input.firstname} {input.lastname}</p>
      </form>
    </div>
  );
}
  
createRoot(document.getElementById('branch')).render(<App />);
