import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Tutorial from './pages/Tutorial';
import Lobby from './pages/Lobby';
import Cockpit from './pages/Cockpit';
import Sector from './pages/Sector';
import GamePlay from './pages/GamePlay';
import PuzzleGame from './pages/PuzzleGame';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/tutorial',
    element: <Tutorial />,
  },
  {
    path: '/lobby',
    element: <Lobby />,
  },
  {
    path: '/cockpit',
    element: <Cockpit />,
  },
  {
    path: '/sector',
    element: <Sector />,
  },
  {
    path: '/gameplay',
    element: <GamePlay />,
  },
  {
    path: '/puzzle',
    element: <PuzzleGame />,
  },
]);

export default router;
