import { useNavigate } from 'react-router-dom'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: '#f4a261',
        borderRadius: '16px',
        width: '80px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        marginBottom: '24px',
      }}>
        🔧
      </div>

      <h1 style={{ fontSize: '72px', fontWeight: 'bold', color: '#1a1a2e', margin: 0 }}>404</h1>
      <h2 style={{ color: '#444', marginTop: '8px', marginBottom: '12px' }}>Página no encontrada</h2>
      <p style={{ color: '#666', maxWidth: '360px', marginBottom: '32px' }}>
        La página que estás buscando no existe o fue movida.
      </p>

      <button
        onClick={() => navigate(-1)}
        style={{
          backgroundColor: '#f4a261',
          color: 'white',
          border: 'none',
          padding: '12px 28px',
          borderRadius: '8px',
          fontSize: '15px',
          cursor: 'pointer',
        }}
      >
        ← Volver
      </button>
    </div>
  )
}

export default NotFound