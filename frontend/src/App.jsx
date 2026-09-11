import React, { useState } from 'react';
import Header from './components/Header';
import Nav from './components/Nav';
import { UIProvider } from './context/UIContext';
import GreatHall from './pages/GreatHall';
import Shelves from './pages/Shelves';
import Members from './pages/Members';
import Issue from './pages/Issue';
import Return from './pages/Return';
import Admin from './pages/Admin';
import Tags from './pages/Tags';

const PAGES = {
  hall: GreatHall,
  shelves: Shelves,
  members: Members,
  issue: Issue,
  return: Return,
  admin: Admin,
  tags: Tags
};

export default function App() {
  const [tab, setTab] = useState('hall');
  const Page = PAGES[tab];

  return (
    <UIProvider>
      <Header />
      <div className="app">
        <Nav current={tab} onChange={setTab} />
        <main className="parchment">
          <Page goTo={setTab} />
        </main>
      </div>
      <footer className="foot">Mischief managed. Data enchanted to persist in the registry.</footer>
    </UIProvider>
  );
}
