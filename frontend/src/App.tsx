import './App.css'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

function App() {
    const accessToken = localStorage.getItem('accessToken')

    if(accessToken) {
        return <DashboardPage />
    }

    return <LoginPage />
}

export default App
