import App from './App'
import { createBrowserRouter } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Tutorial from './pages/Tutorial'
import Lobby from './pages/Lobby'
import Cockpit from './pages/Cockpit'
import Sector from './pages/Sector'
import GamePlay from './pages/GamePlay'
import PuzzleGame from './pages/PuzzleGame'
import ApodInfo from './pages/ApodInfo'
import Shop from './pages/Shop'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Landing /> }, // ✅ '/'는 Landing
      { path: 'login', element: <Login /> },
      { path: 'tutorial', element: <Tutorial /> },
      { path: 'lobby', element: <Lobby /> },
      { path: 'cockpit', element: <Cockpit /> },
      { path: 'sector', element: <Sector /> },
      { path: 'gameplay', element: <GamePlay /> },
      { path: 'puzzle', element: <PuzzleGame /> },
      { path: 'apod-info', element: <ApodInfo /> },
      { path: 'shop', element: <Shop /> },
    ],
  },
])

export default router
